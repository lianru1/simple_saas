/**
 * 品牌字 → 真正透明背景
 *
 * 色键抠图：自动采样四角获取画布颜色，按颜色距离计算 alpha，
 * 抗锯齿边缘平滑过渡，保留紫色文字完整。
 *
 * 用法：node scripts/wordmark-transparent.mjs
 */

import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "image", "品牌字.png");
const DST = join(__dirname, "..", "public", "images", "品牌字.png");

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = new Uint8ClampedArray(data);
const { width, height, channels } = info;

// 1. 采样四角 + 四边中点，取平均 → 画布颜色
function sample(x, y) {
  const idx = (y * width + x) * channels;
  return [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
}

const m = 4; // margin
const samples = [
  sample(m, m),           // 左上
  sample(width - 1 - m, m), // 右上
  sample(m, height - 1 - m), // 左下
  sample(width - 1 - m, height - 1 - m), // 右下
  sample(Math.floor(width / 2), m),           // 上中
  sample(Math.floor(width / 2), height - 1 - m), // 下中
  sample(m, Math.floor(height / 2)),           // 左中
  sample(width - 1 - m, Math.floor(height / 2)), // 右中
];

const bgR = Math.round(samples.reduce((s, c) => s + c[0], 0) / samples.length);
const bgG = Math.round(samples.reduce((s, c) => s + c[1], 0) / samples.length);
const bgB = Math.round(samples.reduce((s, c) => s + c[2], 0) / samples.length);

console.log(`  自动检测画布色：rgb(${bgR}, ${bgG}, ${bgB})`);

// 2. 按颜色距离计算 alpha
// 在 RGB 空间中的欧几里得距离
const MAX_DIST = 80;  // 超过此距离 → 完全不透明（文字）
const MIN_DIST = 18;  // 低于此距离 → 完全透明（画布）
// 中间 → 线性插值

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * channels;
    const dr = pixels[idx] - bgR;
    const dg = pixels[idx + 1] - bgG;
    const db = pixels[idx + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    let alpha;
    if (dist <= MIN_DIST) {
      alpha = 0;
    } else if (dist >= MAX_DIST) {
      alpha = 255;
    } else {
      alpha = Math.round(((dist - MIN_DIST) / (MAX_DIST - MIN_DIST)) * 255);
    }

    pixels[idx + 3] = alpha;
  }
}

await sharp(pixels, { raw: { width, height, channels } })
  .png()
  .toFile(DST);

console.log(`  ✅ 透明品牌字已保存 → ${DST}`);
