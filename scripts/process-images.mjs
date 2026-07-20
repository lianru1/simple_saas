/**
 * 图片处理脚本
 *
 * 1. 品牌字 — 亮度法去除深色画布背景（保留抗锯齿边缘），输出带透明通道的 PNG
 * 2. 三步流程配图 — 边缘羽化融入背景
 *
 * 用法：node scripts/process-images.mjs
 * 原始图从 image/ 读取，处理后输出到 public/images/
 */

import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "image");           // 原始图（不修改）
const DST = join(__dirname, "..", "public", "images"); // 处理后输出

// ============================================================
// 1. 品牌字：亮度法去背景
//    深色像素（背景 #111827）→ alpha=0，亮色像素（文字）→ alpha=255
//    中间亮度 → 线性插值 alpha，保留抗锯齿边缘的平滑过渡
// ============================================================
async function processWordmark() {
  const inputPath = join(SRC, "品牌字.png");
  const outputPath = join(DST, "品牌字.png");

  console.log("→ 处理品牌字：亮度法去背景...");

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const { width, height, channels } = info;

  // 亮度阈值（实测：深炭背景 ≈ 0.08-0.12，紫色文字 ≈ 0.35-0.55）
  const BG_LUM_MAX = 0.18;   // 低于此值 → 完全透明（背景）
  const TEXT_LUM_MIN = 0.32; // 高于此值 → 完全不透明（文字）
  // 中间地带 → 线性插值 alpha

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // 相对亮度（ITU-R BT.709）
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      let alpha;
      if (lum <= BG_LUM_MAX) {
        alpha = 0;
      } else if (lum >= TEXT_LUM_MIN) {
        alpha = 255;
      } else {
        alpha = Math.round(((lum - BG_LUM_MAX) / (TEXT_LUM_MIN - BG_LUM_MAX)) * 255);
      }

      pixels[idx + 3] = alpha;
    }
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`   ✅ 已保存 → ${outputPath}`);
}

// ============================================================
// 2. 三步流程配图：径向渐变遮罩羽化边缘
//    中间 60% 完全不透明，60%-100% 逐渐淡出到完全透明
// ============================================================
async function processTriptych(filename) {
  const inputPath = join(SRC, filename);
  const tmpPath = join(DST, `_tmp_${filename}`);
  const outputPath = join(DST, filename);

  console.log(`→ 处理边缘羽化：${filename}...`);

  const metadata = await sharp(inputPath).metadata();
  const { width, height } = metadata;

  const featherStart = 0.60; // 60% 处开始羽化
  const featherEnd = 1.00;   // 边缘完全透明

  const maskSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="${featherStart * 100}%" stop-color="white" stop-opacity="1" />
          <stop offset="${featherEnd * 100}%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
    </svg>
  `;

  const mask = await sharp(Buffer.from(maskSvg))
    .resize(width, height)
    .toBuffer();

  await sharp(inputPath)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(tmpPath);

  fs.renameSync(tmpPath, outputPath);

  console.log(`   ✅ 已保存 → ${outputPath}`);
}

// ── 主流程 ──
async function main() {
  console.log("🖼️  开始处理图片...\n");

  await processWordmark();
  console.log("");

  const triptychFiles = [
    "区配图1-gather.png",
    "区配图2-age.png",
    "区配图3-Minted​.png",
  ];

  for (const f of triptychFiles) {
    await processTriptych(f);
  }

  console.log("\n🎉 全部处理完成！");
}

main().catch((err) => {
  console.error("处理失败:", err);
  process.exit(1);
});
