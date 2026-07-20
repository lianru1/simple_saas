/**
 * 生成亮色模式品牌字：深炭画布 → 白色画布，紫色文字保留
 *
 * 用法：node scripts/wordmark-light.mjs
 */

import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "image", "品牌字.png");
const DST = join(__dirname, "..", "public", "images", "品牌字-light.png");

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = new Uint8ClampedArray(data);
const { width, height, channels } = info;

// 与 process-images.mjs 相同的亮度阈值
const BG_LUM_MAX = 0.18;   // 低于此值 → 背景（替换为白色）
const TEXT_LUM_MIN = 0.32; // 高于此值 → 文字（保留紫色）

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * channels;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    if (lum <= BG_LUM_MAX) {
      // 纯背景 → 替换为白色
      pixels[idx] = 255;
      pixels[idx + 1] = 255;
      pixels[idx + 2] = 255;
      pixels[idx + 3] = 255;
    } else if (lum < TEXT_LUM_MIN) {
      // 中间地带 → 混合到白色（抗锯齿边）
      const t = (lum - BG_LUM_MAX) / (TEXT_LUM_MIN - BG_LUM_MAX);
      pixels[idx] = Math.round(255 - (255 - r) * t);
      pixels[idx + 1] = Math.round(255 - (255 - g) * t);
      pixels[idx + 2] = Math.round(255 - (255 - b) * t);
      pixels[idx + 3] = 255;
    }
    // lum >= TEXT_LUM_MIN → 文字，保持原样
  }
}

await sharp(pixels, { raw: { width, height, channels } })
  .png()
  .toFile(DST);

console.log(`✅ 亮色品牌字已生成 → ${DST}`);
