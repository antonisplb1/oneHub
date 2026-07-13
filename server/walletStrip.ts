import sharp from 'sharp';
import { relativeLuminance } from './appleWallet';

// Banner loading has the exact same semantics as logo loading (data-URI or
// https only, never throws, null on failure) — reuse it instead of duplicating.
export { loadLogoBuffer as loadBannerBuffer } from './appleWallet';

export interface StripRenderOptions {
  bannerImage: Buffer | null;   // decoded merchant banner, or null
  brandColorHex: string;        // validated #RRGGBB, same fallback rules as today
  stamps: number;
  maxStamps: number;
  width: number;                // px
  height: number;               // px
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

// Darken a hex color by the given fraction (0..1) — used for the gradient stop.
function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.max(0, Math.round(c * (1 - amount))));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FONT_STACK = `Poppins, 'Helvetica Neue', Arial, sans-serif`;

// Build the SVG overlay (scrim + stamps/pill + caption) for a strip.
function buildOverlaySvg(opts: StripRenderOptions, hasBanner: boolean, brand: string): string {
  const { width, height, stamps, maxStamps } = opts;
  const parts: string[] = [];

  // Scrim: keep stamps legible on any banner photo. The gradient fallback is
  // already dark enough on its own, so only apply it over real banners.
  if (hasBanner) {
    parts.push(`<rect width="${width}" height="${height}" fill="black" opacity="0.35"/>`);
  }

  // Checkmark color: brand color on the white circle, unless the brand color is
  // itself light — then near-black for contrast (same luminance rule as the pass).
  const checkColor = relativeLuminance(brand) > 0.5 ? '#1A1A1A' : brand;

  const captionSize = Math.max(9, Math.round(height * 0.085));
  const captionY = height - Math.round(captionSize * 0.55);

  if (maxStamps > 12) {
    // Numeric fallback: a white rounded pill with "X / Y" — mirrors the existing
    // numeric text fallback for large cards; circles would be unreadably small.
    const pillH = Math.round(height * 0.38);
    const pillText = `${stamps} / ${maxStamps}`;
    const fontSize = Math.round(pillH * 0.52);
    const pillW = Math.max(Math.round(width * 0.24), Math.round(pillText.length * fontSize * 0.62) + pillH);
    const pillX = Math.round((width - pillW) / 2);
    const pillY = Math.round(height * 0.42 - pillH / 2);
    parts.push(
      `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="white" opacity="0.95"/>`,
      `<text x="${width / 2}" y="${pillY + pillH / 2}" dominant-baseline="central" text-anchor="middle" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="600" fill="#1A1A1A">${escapeXml(pillText)}</text>`,
    );
  } else {
    const rows: number[] = maxStamps <= 6
      ? [maxStamps]
      : [Math.ceil(maxStamps / 2), Math.floor(maxStamps / 2)];
    const maxRowCount = Math.max(...rows);

    // Diameter from strip height (≈42% one row, ≈34% two rows), capped so the
    // widest row fits with side margins of at least one radius.
    // Row width = (count-1)*1.4d + d; margins 2 * d/2 = d  =>  d*((count-1)*1.4 + 2) <= width
    let d = height * (rows.length === 1 ? 0.42 : 0.34);
    d = Math.min(d, width / ((maxRowCount - 1) * 1.4 + 2));
    const r = d / 2;
    const spacing = d * 1.4;
    const rowYs = rows.length === 1 ? [height * 0.42] : [height * 0.27, height * 0.63];

    let stampIndex = 0;
    for (let rowI = 0; rowI < rows.length; rowI++) {
      const count = rows[rowI];
      const cy = rowYs[rowI];
      const startX = width / 2 - ((count - 1) * spacing) / 2;
      for (let i = 0; i < count; i++) {
        const cx = startX + i * spacing;
        if (stampIndex < stamps) {
          // Filled: solid white circle + checkmark in the brand-contrast color.
          parts.push(
            `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="0.95"/>`,
            `<path d="M ${(cx - r * 0.38).toFixed(1)} ${(cy + r * 0.02).toFixed(1)} L ${(cx - r * 0.08).toFixed(1)} ${(cy + r * 0.32).toFixed(1)} L ${(cx + r * 0.42).toFixed(1)} ${(cy - r * 0.28).toFixed(1)}" fill="none" stroke="${checkColor}" stroke-width="${(r * 0.22).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
          );
        } else {
          // Unfilled: faded outline circle.
          parts.push(
            `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r - 1).toFixed(1)}" fill="none" stroke="white" stroke-width="2" opacity="0.55"/>`,
          );
        }
        stampIndex++;
      }
    }
  }

  // Progress caption along the bottom edge.
  parts.push(
    `<text x="${width / 2}" y="${captionY}" text-anchor="middle" font-family="${FONT_STACK}" font-size="${captionSize}" font-weight="600" letter-spacing="${(captionSize * 0.14).toFixed(1)}" fill="white" opacity="0.92">${escapeXml(`${stamps} OF ${maxStamps} STAMPS`)}</text>`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

// Render the wallet stamp strip: merchant banner (cover-cropped) or a brand
// color gradient, with stamp circles / numeric pill and a progress caption
// composited on top. Never throws on a bad banner — falls back to the gradient.
// Output is a PNG buffer; no network access (banner is passed in decoded).
export async function renderStampStrip(opts: StripRenderOptions): Promise<Buffer> {
  const { width, height } = opts;
  const brand = /^#[0-9A-Fa-f]{6}$/.test(opts.brandColorHex) ? opts.brandColorHex : '#0f172a';

  let background: Buffer | null = null;
  let hasBanner = false;
  if (opts.bannerImage) {
    try {
      background = await sharp(opts.bannerImage)
        .resize(width, height, { fit: 'cover' })
        .png()
        .toBuffer();
      hasBanner = true;
    } catch (err) {
      console.error('[Wallet Strip] Banner decode failed, using gradient fallback:', err);
      background = null;
    }
  }
  const gradientSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${brand}"/><stop offset="1" stop-color="${darkenHex(brand, 0.15)}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`;
  const base: Buffer = background ?? (await sharp(Buffer.from(gradientSvg)).png().toBuffer());

  const overlay = buildOverlaySvg(opts, hasBanner, brand);
  return sharp(base)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
