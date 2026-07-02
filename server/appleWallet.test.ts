/**
 * Apple Wallet logo-rendering coverage.
 *
 * Run with:  npx tsx server/appleWallet.test.ts
 *
 * These tests prove the merchant-logo path on Apple passes is robust:
 *  - loadLogoBuffer decodes data URIs and https URLs, and returns null (never
 *    throws) for missing / 404 / unreachable / non-https inputs.
 *  - makeLogoPng fits the logo onto a TRANSPARENT canvas at the exact size, and
 *    makeIconPng center-crops to a square — both verified via sharp metadata.
 *  - makeLogoPng throws on corrupt bytes (the failure generatePass catches).
 *  - AppleWalletService.generatePass ALWAYS yields a valid signed .pkpass buffer
 *    for: valid data-URI logo, valid remote URL, missing logo, corrupt bytes,
 *    and an unreachable URL.
 *  - The solid-color placeholder path is exercised and CONFIRMED by unzipping the
 *    generated pass and inspecting the embedded logo.png: the real-logo pass has
 *    a transparent, non-uniform logo; the placeholder pass has an opaque, solid
 *    fill matching the merchant's brand color.
 *
 * global.fetch is stubbed per-test so remote-URL cases never touch the network.
 * The Apple Wallet signing certs must be present in the environment (they are in
 * the dev/Replit environment); if they are not, the end-to-end pass tests are
 * skipped with a clear message rather than failing spuriously.
 */
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  loadLogoBuffer,
  makeLogoPng,
  makeIconPng,
  isAppleWalletConfigured,
  AppleWalletService,
  type AppleLoyaltyPassData,
} from './appleWallet';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failed++;
    console.error(`  \u2717 ${label}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failed++;
    console.error(`  \u2717 ${label}\n      expected: ${e}\n      actual:   ${a}`);
  }
}

async function assertRejects(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    failed++;
    console.error(`  \u2717 ${label} (expected a throw, got success)`);
  } catch {
    passed++;
    console.log(`  \u2713 ${label}`);
  }
}

// A small, valid PNG (red rectangle) we can decode/render everywhere.
async function makeSamplePng(width = 200, height = 80): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

// Swap global.fetch for the duration of `fn`, then always restore it.
async function withFetch(stub: typeof fetch, fn: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
}

// Unzip a single entry from a .pkpass buffer and return its bytes.
function extractFromPkpass(pkpass: Buffer, entry: string): Buffer {
  const dir = mkdtempSync(path.join(tmpdir(), 'pkpass-'));
  const file = path.join(dir, 'pass.pkpass');
  try {
    writeFileSync(file, pkpass);
    return execFileSync('unzip', ['-p', file, entry], { maxBuffer: 32 * 1024 * 1024 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function basePassData(overrides: Partial<AppleLoyaltyPassData>): AppleLoyaltyPassData {
  return {
    customerId: 'test-customer-apple-wallet',
    customerName: 'Jane Doe',
    shopName: 'Aroma Cafe',
    stamps: 3,
    maxStamps: 10,
    rewardText: 'Free Coffee',
    customerQrCode: 'QR-TEST-123',
    cardBackgroundColor: '#0f172a',
    logo: null,
    ...overrides,
  };
}

// A generated .pkpass is a zip; assert it looks like a real, signed pass.
function assertValidPass(buf: Buffer, label: string) {
  assert(Buffer.isBuffer(buf) && buf.length > 0, `${label}: returns a non-empty buffer`);
  assert(buf[0] === 0x50 && buf[1] === 0x4b, `${label}: buffer is a ZIP (PK header)`);
  assert(buf.includes(Buffer.from('pass.json')), `${label}: contains pass.json`);
  assert(buf.includes(Buffer.from('manifest.json')), `${label}: contains manifest.json`);
  assert(buf.includes(Buffer.from('signature')), `${label}: contains signature`);
  assert(buf.includes(Buffer.from('logo.png')), `${label}: contains logo.png`);
  assert(buf.includes(Buffer.from('icon.png')), `${label}: contains icon.png`);
}

async function run() {
  const sample = await makeSamplePng();
  const dataUri = 'data:image/png;base64,' + sample.toString('base64');
  const corruptBytes = Buffer.from('this is definitely not an image');

  // ---- loadLogoBuffer -----------------------------------------------------
  console.log('\nloadLogoBuffer:');
  {
    const buf = await loadLogoBuffer(dataUri);
    assert(Buffer.isBuffer(buf) && buf!.length > 0, 'decodes a valid data-URI logo');

    assertEqual(await loadLogoBuffer(null), null, 'null logo -> null');
    assertEqual(await loadLogoBuffer(undefined), null, 'undefined logo -> null');
    assertEqual(await loadLogoBuffer(''), null, 'empty-string logo -> null');
    assertEqual(await loadLogoBuffer('data:image/png;base64,'), null, 'empty data-URI payload -> null');
    assertEqual(await loadLogoBuffer('data:garbage-no-base64-marker'), null, 'malformed data-URI -> null');
    assertEqual(await loadLogoBuffer('http://example.com/logo.png'), null, 'plain http URL rejected (SSRF guard) -> null');

    // Valid remote https URL (fetch stubbed to return the sample PNG).
    await withFetch(
      (async () => new Response(sample, { status: 200 })) as unknown as typeof fetch,
      async () => {
        const remote = await loadLogoBuffer('https://cdn.example.com/logo.png');
        assert(Buffer.isBuffer(remote) && remote!.length > 0, 'fetches a valid remote https logo');
      },
    );

    // Remote https that 404s.
    await withFetch(
      (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch,
      async () => {
        assertEqual(await loadLogoBuffer('https://cdn.example.com/missing.png'), null, 'remote 404 -> null');
      },
    );

    // Remote https that returns an empty body.
    await withFetch(
      (async () => new Response(Buffer.alloc(0), { status: 200 })) as unknown as typeof fetch,
      async () => {
        assertEqual(await loadLogoBuffer('https://cdn.example.com/empty.png'), null, 'remote empty body -> null');
      },
    );

    // Unreachable host (fetch rejects) — must be swallowed, never thrown.
    await withFetch(
      (async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as typeof fetch,
      async () => {
        assertEqual(
          await loadLogoBuffer('https://unreachable.invalid/logo.png'),
          null,
          'unreachable URL -> null (never throws)',
        );
      },
    );
  }

  // ---- makeLogoPng / makeIconPng -----------------------------------------
  console.log('\nmakeLogoPng / makeIconPng:');
  {
    const logo1x = await makeLogoPng(sample, 160, 50);
    const meta1x = await sharp(logo1x).metadata();
    assertEqual([meta1x.width, meta1x.height], [160, 50], 'logo @1x sized to 160x50');
    assert(meta1x.hasAlpha === true, 'logo canvas is transparent (has alpha channel)');
    assertEqual(meta1x.format, 'png', 'logo output is PNG');

    const logo2x = await makeLogoPng(sample, 320, 100);
    const meta2x = await sharp(logo2x).metadata();
    assertEqual([meta2x.width, meta2x.height], [320, 100], 'logo @2x sized to 320x100');

    // Contain-fit on a wider-than-target logo leaves transparent letterbox bands.
    const stats = await sharp(logo1x).stats();
    const alpha = stats.channels[3];
    assert(alpha !== undefined && alpha.min === 0, 'transparent padding present around contained logo');

    const icon1x = await makeIconPng(sample, 29);
    const iconMeta1x = await sharp(icon1x).metadata();
    assertEqual([iconMeta1x.width, iconMeta1x.height], [29, 29], 'icon @1x is a 29x29 square');

    const icon2x = await makeIconPng(sample, 58);
    const iconMeta2x = await sharp(icon2x).metadata();
    assertEqual([iconMeta2x.width, iconMeta2x.height], [58, 58], 'icon @2x is a 58x58 square');

    await assertRejects(() => makeLogoPng(corruptBytes, 160, 50), 'makeLogoPng throws on corrupt bytes');
    await assertRejects(() => makeIconPng(corruptBytes, 29), 'makeIconPng throws on corrupt bytes');
  }

  // ---- generatePass end-to-end -------------------------------------------
  console.log('\ngeneratePass (end-to-end signed .pkpass):');
  if (!isAppleWalletConfigured()) {
    console.log('  ! Apple Wallet certs not configured in this environment — skipping end-to-end pass tests.');
  } else {
    const svc = new AppleWalletService();

    // 1) Valid data-URI logo -> real logo used.
    const dataUriPass = await svc.generatePass(basePassData({ logo: dataUri }));
    assertValidPass(dataUriPass, 'data-URI logo');
    {
      const logoPng = extractFromPkpass(dataUriPass, 'logo.png');
      const meta = await sharp(logoPng).metadata();
      const stats = await sharp(logoPng).stats();
      assert(meta.hasAlpha === true, 'data-URI logo.png keeps a transparent canvas (real logo path)');
      const red = stats.channels[0];
      assert(red.min !== red.max, 'data-URI logo.png is non-uniform (contains the real image, not a flat fill)');
    }

    // 2) Valid remote https logo -> real logo used (fetch stubbed).
    await withFetch(
      (async () => new Response(sample, { status: 200 })) as unknown as typeof fetch,
      async () => {
        const remotePass = await svc.generatePass(
          basePassData({ logo: 'https://cdn.example.com/logo.png' }),
        );
        assertValidPass(remotePass, 'remote https logo');
      },
    );

    // 3) Missing logo -> solid-color placeholder path.
    const missingPass = await svc.generatePass(basePassData({ logo: null }));
    assertValidPass(missingPass, 'missing logo (placeholder)');
    {
      const logoPng = extractFromPkpass(missingPass, 'logo.png');
      const meta = await sharp(logoPng).metadata();
      const stats = await sharp(logoPng).stats();
      // makePng emits an opaque, uniformly-colored rectangle matching the brand bg (#0f172a -> 15,23,42).
      assert(meta.hasAlpha !== true, 'placeholder logo.png is opaque (no alpha) — solid-color path');
      const [pr, pg, pb] = [stats.channels[0], stats.channels[1], stats.channels[2]];
      assert(
        pr.min === pr.max && pg.min === pg.max && pb.min === pb.max,
        'placeholder logo.png is a single flat color',
      );
      assertEqual(
        [Math.round(pr.min), Math.round(pg.min), Math.round(pb.min)],
        [15, 23, 42],
        'placeholder fill matches the merchant brand color',
      );
    }

    // 4) Corrupt logo bytes -> render throws internally -> placeholder fallback, no throw.
    const corruptDataUri = 'data:image/png;base64,' + corruptBytes.toString('base64');
    const originalError = console.error;
    let loggedFallback = false;
    console.error = (...args: unknown[]) => {
      if (String(args[0]).includes('Logo render failed')) loggedFallback = true;
    };
    let corruptPass: Buffer;
    try {
      corruptPass = await svc.generatePass(basePassData({ logo: corruptDataUri }));
    } finally {
      console.error = originalError;
    }
    assertValidPass(corruptPass, 'corrupt logo bytes (placeholder fallback)');
    assert(loggedFallback, 'corrupt logo logs the fallback and does not throw');
    {
      const logoPng = extractFromPkpass(corruptPass, 'logo.png');
      const meta = await sharp(logoPng).metadata();
      assert(meta.hasAlpha !== true, 'corrupt-logo pass falls back to opaque placeholder');
    }

    // 5) Unreachable remote URL -> placeholder path, valid pass, no throw.
    await withFetch(
      (async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as typeof fetch,
      async () => {
        const unreachablePass = await svc.generatePass(
          basePassData({ logo: 'https://unreachable.invalid/logo.png' }),
        );
        assertValidPass(unreachablePass, 'unreachable URL (placeholder)');
        const logoPng = extractFromPkpass(unreachablePass, 'logo.png');
        const meta = await sharp(logoPng).metadata();
        assert(meta.hasAlpha !== true, 'unreachable-URL pass falls back to opaque placeholder');
      },
    );
  }
}

run()
  .catch((err) => {
    failed++;
    console.error('\nUnexpected error during tests:', err);
  })
  .finally(() => {
    console.log(`\n=== Apple Wallet logo tests: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  });
