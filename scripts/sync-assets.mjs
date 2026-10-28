// Copies generated images/videos from _assets/<folder>/ into public/.
// Normalises names: "p1-tower.jpg.jpg" → "p1-tower.jpg"; a .png is skipped
// when a .jpg of the same name exists. Usage: npm run assets
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "_assets";
const IMG = join("public", "images");
const VID = join("public", "video");
mkdirSync(IMG, { recursive: true });
mkdirSync(VID, { recursive: true });

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm)$/i;

let n = 0;
for (const dir of readdirSync(SRC)) {
  const d = join(SRC, dir);
  // "_old" and friends are archives, never synced
  if (dir.startsWith("_") || !statSync(d).isDirectory()) continue;
  for (const f of readdirSync(d)) {
    const isVideo = VIDEO_EXT.test(f);
    if (!isVideo && !IMAGE_EXT.test(f)) continue;
    // strip every trailing media extension, then add back the real one
    const ext = f.match(/\.[a-z0-9]+$/i)[0].toLowerCase().replace(".jpeg", ".jpg");
    let base = f;
    while (IMAGE_EXT.test(base) || VIDEO_EXT.test(base)) base = base.replace(/\.[a-z0-9]+$/i, "");
    if (ext === ".png" && readdirSync(d).some((o) => o !== f && o.toLowerCase().startsWith(`${base.toLowerCase()}.jp`))) {
      console.log(`· ${dir}/${f} skipped (jpg exists)`);
      continue;
    }
    const out = `${base}${ext}`;
    copyFileSync(join(d, f), join(isVideo ? VID : IMG, out));
    if (!isVideo && ext !== ".jpg") console.warn(`! ${out}: site expects .jpg`);
    console.log(`✓ ${dir}/${f} → ${out}`);
    n++;
  }
}
console.log(`${n} file(s) synced.`);
