/**
 * Unit tests for the shared wallet stamp-strip renderer.
 *
 * Run with:  npx tsx server/walletStrip.test.ts
 *
 * Covers (per Round 10 definition of done):
 *  - 6 stamps  -> one centered row of circles
 *  - 10 stamps -> two centered rows of circles
 *  - 15 stamps -> numeric "X / Y" pill (no circles)
 *  - null banner       -> brand-color gradient fallback
 *  - invalid banner    -> decode failure falls back to gradient, never throws
 */
import sharp from 'sharp';
import { renderStampStrip } from './walletStrip';

let passed = 0;
let failed = 0;

function ok(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failed++;
    console.error(`  \u2717 ${label}`);
  }
}

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

async function decode(png: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function pixelAt(img: RawImage, x: number, y: number): [number, number, number] {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

// Count near-white pixels along a horizontal scanline (white circles/strokes).
function whiteCountInRow(img: RawImage, y: number): number {
  let count = 0;
  for (let x = 0; x < img.width; x++) {
    const [r, g, b] = pixelAt(img, x, y);
    if (r > 220 && g > 220 && b > 220) count++;
  }
  return count;
}

// A valid banner PNG for banner-path tests: solid mid-gray 200x100.
async function makeTestBanner(): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 100, channels: 3, background: { r: 120, g: 120, b: 120 } },
  }).png().toBuffer();
}

async function run() {
  const W = 375;
  const H = 123;

  console.log('\nrenderStampStrip:');

  // --- 6 stamps: one centered row --------------------------------------------
  {
    const png = await renderStampStrip({
      bannerImage: await makeTestBanner(),
      brandColorHex: '#7C3AED',
      stamps: 3,
      maxStamps: 6,
      width: W,
      height: H,
    });
    const img = await decode(png);
    ok(img.width === W && img.height === H, `6 stamps: output is ${W}x${H} PNG`);
    // One-row layout: circles centered at y ~= 0.42h.
    const rowY = Math.round(H * 0.42);
    ok(whiteCountInRow(img, rowY) > 20, '6 stamps: white circle pixels present on the single row');
    // No circles in the second-row band used by the two-row layout (0.63h);
    // allow a little tolerance for the row-1 circle bottoms (r ~= 26px ends ~0.63h,
    // so sample slightly below at 0.70h which is between circles and caption).
    const lowY = Math.round(H * 0.70);
    ok(whiteCountInRow(img, lowY) < 10, '6 stamps: no second row of circles');
  }

  // --- 10 stamps: two centered rows -------------------------------------------
  {
    // 7 filled of 10 so BOTH rows contain solid-white filled circles (unfilled
    // circles are faint 55%-opacity strokes and won't hit the near-white bar).
    const png = await renderStampStrip({
      bannerImage: await makeTestBanner(),
      brandColorHex: '#7C3AED',
      stamps: 7,
      maxStamps: 10,
      width: W,
      height: H,
    });
    const img = await decode(png);
    ok(img.width === W && img.height === H, `10 stamps: output is ${W}x${H} PNG`);
    const topY = Math.round(H * 0.27);
    const botY = Math.round(H * 0.63);
    ok(whiteCountInRow(img, topY) > 20, '10 stamps: circles present on top row');
    ok(whiteCountInRow(img, botY) > 20, '10 stamps: circles present on bottom row');
  }

  // --- 15 stamps: numeric pill, no circles ------------------------------------
  {
    const png = await renderStampStrip({
      bannerImage: await makeTestBanner(),
      brandColorHex: '#7C3AED',
      stamps: 4,
      maxStamps: 15,
      width: W,
      height: H,
    });
    const img = await decode(png);
    ok(img.width === W && img.height === H, `15 stamps: output is ${W}x${H} PNG`);
    // Pill is centered at y ~= 0.42h: solid white run at the exact center.
    const pillY = Math.round(H * 0.42);
    const centerRun = whiteCountInRow(img, pillY);
    ok(centerRun > 30, '15 stamps: white pill present at center');
    // The pill is narrower than a full circle row would be — the far edges stay dark.
    const [er, eg, eb] = pixelAt(img, 5, pillY);
    ok(er < 220 || eg < 220 || eb < 220, '15 stamps: no circles at strip edges (pill only)');
  }

  // --- null banner: gradient fallback ------------------------------------------
  {
    const png = await renderStampStrip({
      bannerImage: null,
      brandColorHex: '#FF0000',
      stamps: 2,
      maxStamps: 6,
      width: W,
      height: H,
    });
    const img = await decode(png);
    ok(img.width === W && img.height === H, `null banner: output is ${W}x${H} PNG`);
    // Top-left corner should be the brand color (no scrim on gradient fallback).
    const [r, g, b] = pixelAt(img, 2, 2);
    ok(r > 230 && g < 40 && b < 40, `null banner: top edge is brand red (got rgb(${r},${g},${b}))`);
    // Bottom corner should be darker than the top (vertical gradient).
    const [r2] = pixelAt(img, 2, H - 3);
    ok(r2 < r, `null banner: bottom is darker than top (gradient, ${r2} < ${r})`);
  }

  // --- invalid banner buffer: decode failure -> gradient, never throws ---------
  {
    let threw = false;
    let png: Buffer | null = null;
    try {
      png = await renderStampStrip({
        bannerImage: Buffer.from('this is definitely not an image'),
        brandColorHex: '#FF0000',
        stamps: 2,
        maxStamps: 6,
        width: W,
        height: H,
      });
    } catch {
      threw = true;
    }
    ok(!threw, 'invalid banner: does not throw');
    if (png) {
      const img = await decode(png);
      ok(img.width === W && img.height === H, `invalid banner: output is ${W}x${H} PNG`);
      const [r, g, b] = pixelAt(img, 2, 2);
      ok(r > 230 && g < 40 && b < 40, `invalid banner: falls back to brand gradient (got rgb(${r},${g},${b}))`);
    } else {
      ok(false, 'invalid banner: produced a PNG');
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
