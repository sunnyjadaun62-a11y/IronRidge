// Dev aid: writes one embedded texture of a GLB to disk. usage: node scripts/dump-texture.mjs <glb> <nameRegex> <out.png>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { writeFileSync } from "node:fs";
const [file, pattern, out] = process.argv.slice(2);
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(file);
for (const m of doc.getRoot().listMaterials()) {
  if (!new RegExp(pattern, "i").test(m.getName())) continue;
  console.log(m.getName(), "baseColor", m.getBaseColorFactor(), "rough", m.getRoughnessFactor(), "metal", m.getMetallicFactor());
  const slots = { base: m.getBaseColorTexture(), mr: m.getMetallicRoughnessTexture(), normal: m.getNormalTexture() };
  for (const [k, t] of Object.entries(slots)) if (t) console.log(" ", k, t.getName(), t.getMimeType(), t.getImage().byteLength);
  const t = m.getBaseColorTexture();
  if (t) writeFileSync(out, t.getImage());
}
