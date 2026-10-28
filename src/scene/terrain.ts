import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clamp, fbm, rng, smooth } from "@/lib/anim";
import { markingsTexture, skylineDayTexture, skylineTexture } from "./textures";
import { pbr } from "./pbr";

/**
 * World layout (metres). The site sits at the origin; the haul road sweeps in
 * from the south-west, so most shots look north toward the rising tower.
 */
export const ROAD = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-330, 0, 260),
    new THREE.Vector3(-230, 0, 205),
    new THREE.Vector3(-150, 0, 120),
    new THREE.Vector3(-95, 0, 92),
    new THREE.Vector3(-52, 0, 58),
    new THREE.Vector3(-30, 0, 34),
    new THREE.Vector3(-14, 0, 22),
    new THREE.Vector3(2, 0, 18),
    new THREE.Vector3(10, 0, 18),
  ],
  false,
  "centripetal",
);
export const ROAD_WIDTH = 9;

/** site pad bounds */
export const PAD = { x0: -32, x1: 32, z0: -32, z1: 28 };

const roadPts = ROAD.getSpacedPoints(260);

function distToRoad(x: number, z: number) {
  let best = Infinity;
  for (let i = 0; i < roadPts.length; i++) {
    const dx = roadPts[i].x - x;
    const dz = roadPts[i].z - z;
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function distToPad(x: number, z: number) {
  const dx = Math.max(PAD.x0 - x, 0, x - PAD.x1);
  const dz = Math.max(PAD.z0 - z, 0, z - PAD.z1);
  return Math.hypot(dx, dz);
}

/** terrain height: rolling hills, flattened under the pad and along the road */
export function heightAt(x: number, z: number) {
  const r = Math.hypot(x, z);
  const hills = fbm(x * 0.011, z * 0.011) * 16 + fbm(x * 0.004 + 9, z * 0.004) * 30;
  const rise = clamp((r - 120) / 260) * 34; // ground climbs toward the horizon
  const flat = Math.min(smooth(clamp((distToRoad(x, z) - 9) / 55)), smooth(clamp(distToPad(x, z) / 40)));
  return (Math.max(hills, -4) + rise) * flat - 0.05;
}

export function buildTerrain() {
  const group = new THREE.Group();

  /* ------------------------------------------------ ground */
  const SIZE = 1500;
  const SEG = 190;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  // vertex colours tint the photo texture: near-white = untouched grassland
  const grass = new THREE.Color("#d8dccb");
  const dry = new THREE.Color("#f2e6c4");
  const earth = new THREE.Color("#a68a6c");
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const h = heightAt(x, z);
    p.setY(i, h);
    const n = fbm(x * 0.02 + 3, z * 0.02) * 0.5 + 0.5;
    c.copy(grass).lerp(dry, clamp(n * 1.2 - 0.1 + h * 0.01));
    // worn earth near the road & pad
    const worn = 1 - smooth(clamp(Math.min(distToRoad(x, z) - 5, distToPad(x, z)) / 14));
    c.lerp(earth, worn * 0.85);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, pbr("aerial_grass_rock", 42, 42, { vertexColors: true }));
  ground.receiveShadow = true;
  group.add(ground);

  /* ------------------------------------------------ site pad */
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(PAD.x1 - PAD.x0 + 6, PAD.z1 - PAD.z0 + 6).rotateX(-Math.PI / 2),
    pbr("brown_mud_dry", 9, 8, { color: "#c4a483" }),
  );
  pad.position.set((PAD.x0 + PAD.x1) / 2, 0.02, (PAD.z0 + PAD.z1) / 2);
  pad.receiveShadow = true;
  group.add(pad);

  /* ------------------------------------------------ road ribbon */
  const N = 400;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const len = ROAD.getLength();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = ROAD.getPointAt(t);
    ROAD.getTangentAt(t, tan);
    side.crossVectors(up, tan).normalize().multiplyScalar(ROAD_WIDTH / 2);
    pos.push(pt.x + side.x, 0.06, pt.z + side.z, pt.x - side.x, 0.06, pt.z - side.z);
    const v = (t * len) / ROAD_WIDTH;
    uv.push(0, v, 1, v);
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  roadGeo.setIndex(idx);
  roadGeo.computeVertexNormals();
  const road = new THREE.Mesh(roadGeo, pbr("asphalt_02", 1, 1));
  road.receiveShadow = true;
  group.add(road);
  // paint sits on a second ribbon so the asphalt can tile square while dashes keep their 14 m rhythm
  const paint = markingsTexture();
  paint.repeat.set(1, ROAD_WIDTH / 14);
  const lines = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({
      map: paint,
      transparent: true,
      depthWrite: false,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  lines.receiveShadow = true;
  group.add(lines);

  /* ------------------------------------------------ trees */
  const r = rng(11);
  const TREES = 520;
  // three jittered tiers read as a real conifer instead of a single cone
  const crownGeo = mergeGeometries(
    [
      [2.7, 4.2, 4.2],
      [2.1, 3.8, 6.3],
      [1.4, 3.4, 8.3],
    ].map(([rad, h, y], i) => {
      const g = new THREE.ConeGeometry(rad, h, 9, 2).translate(0, y, 0);
      const gp = g.attributes.position as THREE.BufferAttribute;
      const jr = rng(40 + i);
      for (let k = 0; k < gp.count; k++) {
        if (gp.getY(k) > y + h / 2 - 0.01) continue;
        const j = 0.75 + jr() * 0.5;
        gp.setX(k, gp.getX(k) * j);
        gp.setZ(k, gp.getZ(k) * j);
        gp.setY(k, gp.getY(k) + (jr() - 0.5) * 0.5);
      }
      g.deleteAttribute("uv");
      return g;
    }),
  )!;
  crownGeo.computeVertexNormals();
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 5).translate(0, 1.5, 0);
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ color: "#2f4029", roughness: 0.95 }),
    TREES,
  );
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: "#4a3a2c" }), TREES);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();
  const tint = new THREE.Color();
  let placed = 0;
  for (let tries = 0; placed < TREES && tries < 6000; tries++) {
    const x = (r() - 0.5) * 760;
    const z = (r() - 0.5) * 760;
    if (distToRoad(x, z) < 14 || distToPad(x, z) < 22) continue;
    // clump into groves
    if (fbm(x * 0.012, z * 0.012) < -0.05) continue;
    const k = 0.7 + r() * 0.9;
    q.setFromAxisAngle(up, r() * Math.PI);
    m.compose(v.set(x, heightAt(x, z), z), q, s.set(k, k * (0.8 + r() * 0.5), k));
    crowns.setMatrixAt(placed, m);
    trunks.setMatrixAt(placed, m);
    crowns.setColorAt(placed, tint.setHSL(0.26 + r() * 0.07, 0.28 + r() * 0.1, 0.42 + r() * 0.16));
    placed++;
  }
  crowns.count = trunks.count = placed;
  crowns.castShadow = trunks.castShadow = true;
  group.add(crowns, trunks);

  /* ------------------------------------------------ skyline (north) */
  const BLD = 70;
  const sky = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({
      map: skylineDayTexture(),
      color: "#8a96a3",
      roughness: 0.4,
      metalness: 0.2,
      emissive: "#ffffff",
      emissiveMap: skylineTexture(),
      emissiveIntensity: 0,
    }),
    BLD,
  );
  for (let i = 0; i < BLD; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.5;
    const d = 560 + r() * 160;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const w = 14 + r() * 22;
    const h = 26 + Math.pow(r(), 2.2) * 95 * (1 - Math.abs(a + Math.PI / 2) / 0.9);
    m.compose(v.set(x, heightAt(x, z) - 2, z), q.identity(), s.set(w, Math.max(h, 24), 10 + r() * 20));
    sky.setMatrixAt(i, m);
  }
  group.add(sky);

  return { group, skyline: sky };
}
