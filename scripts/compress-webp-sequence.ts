/**
 * Recompress the hero scroll-animation frames in public/webp-sequence.
 *
 * The originals shipped at 1920x1080 (~20 MB for 210 frames), all of which a
 * first-time visitor downloads before the hero unlocks. 1440px wide at
 * quality 64 reads identically on the scrubbed canvas at ~a third of the
 * bytes. Re-run after replacing frames:
 *
 *   npx tsx scripts/compress-webp-sequence.ts
 *
 * Frames already at or below the target width are re-encoded in place
 * (quality only). The script overwrites files: the sequence is git-tracked,
 * so `git checkout -- public/webp-sequence` restores the originals.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const SEQUENCE_DIR = path.resolve('public/webp-sequence');
const TARGET_WIDTH = 1440;
const QUALITY = 64;

async function compressFrame(filePath: string): Promise<{ before: number; after: number }> {
  // Read into memory first: passing the path leaves libvips holding a file
  // handle on Windows, which blocks the overwrite below.
  const original = await readFile(filePath);
  const before = original.length;
  const image = sharp(original);
  const metadata = await image.metadata();

  const pipeline =
    metadata.width && metadata.width > TARGET_WIDTH
      ? image.resize({ width: TARGET_WIDTH })
      : image;

  const buffer = await pipeline.webp({ quality: QUALITY, effort: 6 }).toBuffer();

  // Only keep the recompressed frame when it actually saves space.
  if (buffer.length >= before) {
    return { before, after: before };
  }

  // Direct overwrite: rename-over-existing hits EPERM on Windows when a
  // scanner briefly locks the target, and the sequence is git-tracked anyway.
  await writeFile(filePath, buffer);
  return { before, after: buffer.length };
}

async function main() {
  const files = (await readdir(SEQUENCE_DIR))
    .filter((file) => file.endsWith('.webp'))
    .sort();

  if (files.length === 0) {
    console.error(`No .webp frames found in ${SEQUENCE_DIR}`);
    process.exit(1);
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const { before, after } = await compressFrame(path.join(SEQUENCE_DIR, file));
    totalBefore += before;
    totalAfter += after;
  }

  const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
  console.log(
    `${files.length} frames: ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB ` +
    `(${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% smaller)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
