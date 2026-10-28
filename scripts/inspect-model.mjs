// Dev aid: prints world-space bounds of every mesh node whose name matches a regex.
// usage: node scripts/inspect-model.mjs <file.glb> [regex]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/core";
const [file, pattern = "."] = process.argv.slice(2);
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(file);
const re = new RegExp(pattern, "i");
const root = doc.getRoot().listScenes()[0].listChildren()[0];
console.log("root", root.getName(), "T", root.getTranslation(), "R", root.getRotation(), "S", root.getScale());
const f = (v) => v.map((n) => n.toFixed(2)).join(",");
for (const n of doc.getRoot().listNodes()) {
  if (!n.getMesh() || !re.test(n.getName())) continue;
  const b = getBounds(n);
  const c = b.min.map((v, i) => (v + b.max[i]) / 2);
  console.log(n.getName().padEnd(60).slice(0, 60), "c", f(c), " min", f(b.min), " max", f(b.max));
}
