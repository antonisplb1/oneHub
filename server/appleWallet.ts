import { Template } from '@walletpass/pass-js';
import { createHash, createHmac } from 'crypto';
import zlib from 'zlib';
import http2 from 'http2';
import sharp from 'sharp';
import { db } from './db';
import { appleWalletDevices, customers } from '@shared/schema';
import { eq, or } from 'drizzle-orm';

export interface AppleLoyaltyPassData {
  customerId: string;
  customerName: string;
  shopName: string;
  stamps: number;
  maxStamps: number;
  rewardText: string;
  customerQrCode: string;
  cardBackgroundColor?: string | null;
  logo?: string | null;
}

function makePng(width: number, height: number, r: number, g: number, b: number): Buffer {
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(name: string, data: Buffer): Buffer {
    const nb = Buffer.from(name, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([nb, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([len, nb, data, crcBuf]);
  }

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      raw[row + 1 + x * 3] = r;
      raw[row + 1 + x * 3 + 1] = g;
      raw[row + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return [15, 23, 42];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function hexToRgbCss(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

// WCAG relative luminance (0 = black .. 1 = white) of a hex color. Used to pick
// a foreground/label color that stays readable on the merchant's brand color.
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Load a merchant logo (data URI or http/https URL) into a raw image Buffer, or
// null when there is no logo / it can't be fetched. Never throws.
export async function loadLogoBuffer(logo?: string | null): Promise<Buffer | null> {
  if (!logo) return null;
  try {
    if (logo.startsWith('data:')) {
      const m = logo.match(/^data:(.+);base64,(.+)$/);
      if (!m) return null;
      const buf = Buffer.from(m[2], 'base64');
      return buf.length > 0 ? buf : null;
    }
    // Only https (matches the Google logo-resolution path); never plain http.
    if (logo.startsWith('https://')) {
      const resp = await fetch(logo);
      if (!resp.ok) return null;
      const arr = await resp.arrayBuffer();
      const buf = Buffer.from(arr);
      return buf.length > 0 ? buf : null;
    }
  } catch {
    return null;
  }
  return null;
}

// Fit the logo, aspect-preserved, onto a transparent canvas of the given size.
export async function makeLogoPng(src: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(src)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Center-crop the logo into a square icon of the given size.
export async function makeIconPng(src: Buffer, size: number): Promise<Buffer> {
  return sharp(src)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
}

function normalizePem(raw: string, type: 'CERTIFICATE' | 'PRIVATE KEY'): string {
  if (!raw) return raw;
  let pem = raw.replace(/\\n/g, '\n').trim();
  if (pem.startsWith('-----BEGIN')) return pem;
  const base64 = pem.replace(/[\s\r\n]+/g, '');
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

export function getPassSerialNumber(customerId: string): string {
  return `${customerId}-${createHash('sha1').update(customerId).digest('hex').slice(0, 8)}`;
}

export function generatePassAuthToken(customerId: string): string {
  // Secret comes from APPLE_WALLET_AUTH_SECRET (Replit Secrets). It must NOT be
  // derived from the pass type ID, which is public (embedded in every issued
  // .pkpass) — deriving from it lets anyone holding a pass forge a valid token.
  return createHmac('sha256', process.env.APPLE_WALLET_AUTH_SECRET!)
    .update(customerId)
    .digest('hex');
}

export async function sendApnsWalletPush(pushToken: string): Promise<void> {
  const privateKey = normalizePem(process.env.APPLE_WALLET_PRIVATE_KEY_PEM!, 'PRIVATE KEY');
  const cert = normalizePem(process.env.APPLE_WALLET_CERT_PEM!, 'CERTIFICATE');
  const passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID!;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error('APNs push timeout'));
    }, 10000);

    const client = http2.connect('https://api.push.apple.com', { key: privateKey, cert });
    client.on('error', (err) => { clearTimeout(timer); client.destroy(); reject(err); });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': passTypeId,
      'apns-push-type': 'background',
      'content-type': 'application/json',
    });

    req.write('{}');
    req.end();

    req.on('response', (headers) => {
      clearTimeout(timer);
      client.close();
      const status = headers[':status'];
      if (status === 200 || status === 410) resolve();
      else reject(new Error(`APNs returned status ${status}`));
    });

    req.on('error', (err) => { clearTimeout(timer); client.destroy(); reject(err); });
  });
}

// Fire-and-forget: tell every device holding this customer's pass to re-fetch it.
// Never throws; no-ops when Apple Wallet is not configured.
export function notifyAppleWalletDevices(customerId: string): void {
  if (!isAppleWalletConfigured()) return;
  const serialNumber = getPassSerialNumber(customerId);
  db.select()
    .from(appleWalletDevices)
    .where(eq(appleWalletDevices.serialNumber, serialNumber))
    .then((devices) => {
      for (const device of devices) {
        sendApnsWalletPush(device.pushToken).catch((err) =>
          console.error(`[Apple Wallet] APNs push failed for ${device.deviceLibraryIdentifier}:`, err)
        );
      }
    })
    .catch((err) => console.error('[Apple Wallet] Device lookup failed:', err));
}

// Fire-and-forget: tell every device holding ANY pass for this store to re-fetch.
// Matches devices by their storeId AND legacy rows with a null storeId whose
// customer belongs to this store (older registrations pre-dating the storeId
// column). Never throws; no-ops when Apple Wallet is not configured.
export function notifyAppleWalletDevicesForStore(storeId: string): void {
  if (!isAppleWalletConfigured()) return;
  db.select({
    pushToken: appleWalletDevices.pushToken,
    deviceLibraryIdentifier: appleWalletDevices.deviceLibraryIdentifier,
  })
    .from(appleWalletDevices)
    .leftJoin(customers, eq(appleWalletDevices.customerId, customers.id))
    .where(or(eq(appleWalletDevices.storeId, storeId), eq(customers.storeId, storeId)))
    .then((devices) => {
      const pushed = new Set<string>();
      for (const device of devices) {
        if (pushed.has(device.pushToken)) continue;
        pushed.add(device.pushToken);
        sendApnsWalletPush(device.pushToken).catch((err) =>
          console.error(`[Apple Wallet] APNs push failed for ${device.deviceLibraryIdentifier}:`, err)
        );
      }
    })
    .catch((err) => console.error('[Apple Wallet] Store device lookup failed:', err));
}

export class AppleWalletService {
  private passTypeId: string;
  private teamId: string;
  private privateKeyPem: string;
  private certPem: string;

  constructor() {
    this.passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID!;
    this.teamId = process.env.APPLE_WALLET_TEAM_ID!;
    this.privateKeyPem = normalizePem(process.env.APPLE_WALLET_PRIVATE_KEY_PEM!, 'PRIVATE KEY');
    this.certPem = normalizePem(process.env.APPLE_WALLET_CERT_PEM!, 'CERTIFICATE');

    if (!this.passTypeId) throw new Error('APPLE_WALLET_PASS_TYPE_ID is not set');
    if (!this.teamId) throw new Error('APPLE_WALLET_TEAM_ID is not set');
    if (!this.privateKeyPem) throw new Error('APPLE_WALLET_PRIVATE_KEY_PEM is not set');
    if (!this.certPem) throw new Error('APPLE_WALLET_CERT_PEM is not set');
  }

  async generatePass(passData: AppleLoyaltyPassData): Promise<Buffer> {
    const bgColor = (passData.cardBackgroundColor && /^#[0-9A-Fa-f]{6}$/.test(passData.cardBackgroundColor))
      ? passData.cardBackgroundColor
      : '#0f172a';

    const [r, g, b] = hexToRgb(bgColor);

    const serialNumber = getPassSerialNumber(passData.customerId);
    const authenticationToken = generatePassAuthToken(passData.customerId);
    const baseUrl = process.env.APP_BASE_URL || 'https://unihub.live';

    // Contrast-aware text: dark text on light brand colors, white on dark ones,
    // so labels/values stay readable regardless of the merchant's color.
    const isLightBg = relativeLuminance(bgColor) > 0.5;
    const foregroundColor = isLightBg ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)';
    const labelColor = isLightBg ? 'rgb(71, 85, 105)' : 'rgb(226, 232, 240)';

    const template = new Template('storeCard', {
      passTypeIdentifier: this.passTypeId,
      teamIdentifier: this.teamId,
      organizationName: passData.shopName,
      description: `${passData.shopName} Loyalty Card`,
      serialNumber,
      foregroundColor,
      labelColor,
      backgroundColor: hexToRgbCss(bgColor),
      logoText: passData.shopName,
      webServiceURL: `${baseUrl}/api/apple-wallet`,
      authenticationToken,
    });

    template.setCertificate(this.certPem);
    template.setPrivateKey(this.privateKeyPem);

    // Use the merchant's real logo when available; fall back to a solid-color
    // placeholder if there's no logo or it can't be decoded.
    let usedRealLogo = false;
    const logoSrc = await loadLogoBuffer(passData.logo);
    if (logoSrc) {
      try {
        await template.images.add('logo', await makeLogoPng(logoSrc, 160, 50), '1x');
        await template.images.add('logo', await makeLogoPng(logoSrc, 320, 100), '2x');
        await template.images.add('icon', await makeIconPng(logoSrc, 29), '1x');
        await template.images.add('icon', await makeIconPng(logoSrc, 58), '2x');
        usedRealLogo = true;
      } catch (err) {
        console.error('[Apple Wallet] Logo render failed, using placeholder:', err);
        usedRealLogo = false;
      }
    }
    if (!usedRealLogo) {
      await template.images.add('icon', makePng(29, 29, r, g, b), '1x');
      await template.images.add('icon', makePng(58, 58, r, g, b), '2x');
      await template.images.add('logo', makePng(160, 50, r, g, b), '1x');
      await template.images.add('logo', makePng(320, 100, r, g, b), '2x');
    }

    const pass = template.createPass({
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: passData.customerQrCode,
          messageEncoding: 'iso-8859-1',
          altText: passData.customerQrCode,
        },
      ],
    });

    // Visual stamp progress for small cards (filled = collected); numeric form for
    // larger cards where a row of circles would overflow.
    if (passData.maxStamps <= 12) {
      const circles = Array.from({ length: passData.maxStamps }, (_, i) =>
        i < passData.stamps ? '\u25CF' : '\u25CB',
      ).join(' ');
      pass.primaryFields.add({
        key: 'stamps',
        label: `Stamps \u00B7 ${passData.stamps} of ${passData.maxStamps}`,
        value: circles,
      });
    } else {
      pass.primaryFields.add({
        key: 'stamps',
        label: 'Stamps',
        value: `${passData.stamps} / ${passData.maxStamps}`,
      });
    }

    pass.secondaryFields.add({
      key: 'reward',
      label: 'Reward',
      value: passData.rewardText,
    });

    pass.auxiliaryFields.add({
      key: 'status',
      label: passData.stamps >= passData.maxStamps ? 'Ready to Redeem!' : 'Keep Collecting',
      value: passData.stamps >= passData.maxStamps
        ? 'Show to cashier to claim'
        : `${passData.maxStamps - passData.stamps} more stamp${passData.maxStamps - passData.stamps === 1 ? '' : 's'} to go`,
    });

    pass.backFields.add({
      key: 'info',
      label: 'About your loyalty card',
      value: `Earn stamps every time you visit ${passData.shopName}. Collect ${passData.maxStamps} stamps to earn: ${passData.rewardText}`,
    });

    pass.backFields.add({
      key: 'member',
      label: 'Member',
      value: passData.customerName,
    });

    return pass.asBuffer();
  }
}

export function isAppleWalletConfigured(): boolean {
  return !!(
    process.env.APPLE_WALLET_PASS_TYPE_ID &&
    process.env.APPLE_WALLET_TEAM_ID &&
    process.env.APPLE_WALLET_PRIVATE_KEY_PEM &&
    process.env.APPLE_WALLET_CERT_PEM &&
    process.env.APPLE_WALLET_AUTH_SECRET
  );
}

// Startup check: a missing auth secret disables Apple Wallet entirely (every pass
// would otherwise 401). Surface it clearly at boot instead of failing silently.
if (!process.env.APPLE_WALLET_AUTH_SECRET) {
  const otherAppleVarsSet = !!(
    process.env.APPLE_WALLET_PASS_TYPE_ID &&
    process.env.APPLE_WALLET_TEAM_ID &&
    process.env.APPLE_WALLET_PRIVATE_KEY_PEM &&
    process.env.APPLE_WALLET_CERT_PEM
  );
  if (otherAppleVarsSet && process.env.NODE_ENV === 'production') {
    console.error('[Apple Wallet] APPLE_WALLET_AUTH_SECRET is not set — Apple Wallet features are DISABLED. Set APPLE_WALLET_AUTH_SECRET in Replit Secrets.');
  } else {
    console.log('[Apple Wallet] Disabled: APPLE_WALLET_AUTH_SECRET is not set.');
  }
}
