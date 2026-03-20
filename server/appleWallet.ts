import { Template } from '@walletpass/pass-js';
import { createHash } from 'crypto';
import zlib from 'zlib';

export interface AppleLoyaltyPassData {
  customerId: string;
  customerName: string;
  shopName: string;
  stamps: number;
  maxStamps: number;
  rewardText: string;
  customerQrCode: string;
  cardBackgroundColor?: string | null;
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

function normalizePem(raw: string, type: 'CERTIFICATE' | 'PRIVATE KEY'): string {
  if (!raw) return raw;
  let pem = raw.replace(/\\n/g, '\n').trim();
  if (pem.startsWith('-----BEGIN')) return pem;
  const base64 = pem.replace(/[\s\r\n]+/g, '');
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
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

    const serialNumber = `${passData.customerId}-${createHash('sha1').update(passData.customerId).digest('hex').slice(0, 8)}`;

    const template = new Template('storeCard', {
      passTypeIdentifier: this.passTypeId,
      teamIdentifier: this.teamId,
      organizationName: passData.shopName,
      description: `${passData.shopName} Loyalty Card`,
      serialNumber,
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(200, 220, 255)',
      backgroundColor: hexToRgbCss(bgColor),
      logoText: passData.shopName,
    });

    template.setCertificate(this.certPem);
    template.setPrivateKey(this.privateKeyPem);

    await template.images.add('icon', makePng(29, 29, r, g, b), '1x');
    await template.images.add('icon', makePng(58, 58, r, g, b), '2x');
    await template.images.add('logo', makePng(160, 50, r, g, b), '1x');
    await template.images.add('logo', makePng(320, 100, r, g, b), '2x');

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

    pass.primaryFields.add({
      key: 'stamps',
      label: 'Stamps',
      value: `${passData.stamps} / ${passData.maxStamps}`,
    });

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
    process.env.APPLE_WALLET_CERT_PEM
  );
}
