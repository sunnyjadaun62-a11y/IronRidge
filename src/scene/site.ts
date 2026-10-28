import * as THREE from "three";
import { rng } from "@/lib/anim";
import { corrugatedTexture, fenceTexture } from "./textures";
import { PAD, ROAD } from "./terrain";
import { pbr } from "./pbr";

/** Site dressing: fence, cabins, materials, floodlights, spoil heap. */
export function buildSite() {
  const group = new THREE.Group();
  const r = rng(21);

  /* ------------------------------------------------ fence (gap = gate) */
  const fenceTex = fenceTexture();
  const fenceMat = new THREE.MeshStandardMaterial({
    map: fenceTex,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const postMat = new THREE.MeshStandardMaterial({ color: "#3a3d40" });
  const FH = 2.2;
  const runs: [number, number, number, number][] = [
    [PAD.x0, PAD.z0, PAD.x1, PAD.z0],
    [PAD.x1, PAD.z0, PAD.x1, PAD.z1],
    [PAD.x1, PAD.z1, -6, PAD.z1],
    [-24, PAD.z1, PAD.x0, PAD.z1],
    [PAD.x0, PAD.z1, PAD.x0, PAD.z0],
  ];
  const posts: THREE.Vector3[] = [];
  for (const [x0, z0, x1, z1] of runs) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const t = fenceTex.clone();
    t.repeat.set(len / 3.5, 1);
    t.needsUpdate = true;
    const mat = fenceMat.clone();
    mat.map = t;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, FH), mat);
    panel.position.set((x0 + x1) / 2, FH / 2, (z0 + z1) / 2);
    panel.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    panel.castShadow = true;
    group.add(panel);
    const n = Math.ceil(len / 3.5);
    for (let i = 0; i <= n; i++) posts.push(new THREE.Vector3(x0 + ((x1 - x0) * i) / n, 0, z0 + ((z1 - z0) * i) / n));
  }
  const postMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.06, 0.06, FH + 0.2, 5).translate(0, (FH + 0.2) / 2, 0),
    postMat,
    posts.length,
  );
  const m = new THREE.Matrix4();
  posts.forEach((p, i) => postMesh.setMatrixAt(i, m.makeTranslation(p.x, 0, p.z)));
  group.add(postMesh);

  /* ------------------------------------------------ site cabins (stacked containers) */
  const cab = (color: string, x: number, y: number, z: number, ry: number) => {
    const t = corrugatedTexture(color);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0.2 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 2.5), mat);
    mesh.position.set(x, y + 1.3, z);
    mesh.rotation.y = ry;
    mesh.castShadow = mesh.receiveShadow = true;
    // windows
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 0.9),
      new THREE.MeshStandardMaterial({ color: "#1d2832", emissive: "#ffcf8a", emissiveIntensity: 0, roughness: 0.2 }),
    );
    win.position.set(0, 0.3, 1.26);
    mesh.add(win);
    // ISO-container frame: dark corner posts and rails give the box its real silhouette
    const frame = new THREE.MeshStandardMaterial({ color: "#2b2d30", roughness: 0.6, metalness: 0.4 });
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.62, 0.16), frame);
        post.position.set(sx * 5.92, 0, sz * 1.17);
        mesh.add(post);
      }
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(12, 0.14, 0.14), frame);
        rail.position.set(0, sy * 1.24, sz * 1.18);
        mesh.add(rail);
      }
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 2.05),
      new THREE.MeshStandardMaterial({ color: "#5d6166", roughness: 0.5, metalness: 0.5 }),
    );
    door.position.set(4.6, -0.2, 1.255);
    mesh.add(door);
    group.add(mesh);
    return win.material as THREE.MeshStandardMaterial;
  };
  const cabinLights = [
    cab("#c9c6bf", -22, 0, -24, 0),
    cab("#2d5a7b", -22, 2.6, -24, 0),
    cab("#c9c6bf", -27.5, 0, -14, Math.PI / 2),
  ];

  /* ------------------------------------------------ materials yard */
  const steel = new THREE.MeshStandardMaterial({ color: "#c4471d", roughness: 0.6, metalness: 0.4 });
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 0.35), steel);
    b.position.set(25.5 + (i % 3) * 0.5, 0.25 + Math.floor(i / 3) * 0.45, 22);
    b.rotation.y = Math.PI / 2;
    b.castShadow = true;
    group.add(b);
  }
  const pipeMat = new THREE.MeshStandardMaterial({ color: "#6b6f74", roughness: 0.5, metalness: 0.5 });
  const pipeGeo = new THREE.CylinderGeometry(0.55, 0.55, 7, 14).rotateZ(Math.PI / 2);
  [
    [0, 0],
    [1.1, 0],
    [2.2, 0],
    [0.55, 0.95],
    [1.65, 0.95],
  ].forEach(([dz, dy]) => {
    const p = new THREE.Mesh(pipeGeo, pipeMat);
    p.position.set(26, 0.55 + dy, -20 + dz);
    p.rotation.y = Math.PI / 2;
    p.castShadow = true;
    group.add(p);
  });
  // pallets of block
  const block = pbr("rough_concrete", 1, 1, { color: "#d6d0c6" });
  for (let i = 0; i < 5; i++) {
    const pal = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), block);
    pal.position.set(-27 + (i % 3) * 2, 0.6 + (i > 2 ? 1.2 : 0), 16 + r());
    pal.castShadow = true;
    group.add(pal);
  }

  /* ------------------------------------------------ traffic cones along the gate approach */
  const coneProfile = [
    [0.02, 0.78],
    [0.045, 0.78],
    [0.17, 0.06],
    [0.17, 0.04],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const coneGeo = new THREE.LatheGeometry(coneProfile, 18);
  const conePvc = new THREE.MeshStandardMaterial({ color: "#ff5a12", roughness: 0.45 });
  const collarGeo = new THREE.CylinderGeometry(0.105, 0.125, 0.12, 18, 1, true);
  const collarMat = new THREE.MeshStandardMaterial({ color: "#f2f2ee", roughness: 0.25, metalness: 0.1, side: THREE.DoubleSide });
  const baseGeo = new THREE.BoxGeometry(0.44, 0.05, 0.44);
  const baseMat = new THREE.MeshStandardMaterial({ color: "#1d1e20", roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const t = Math.min(0.84 + i * 0.0135, 1);
    const pt = ROAD.getPointAt(t);
    const tan = ROAD.getTangentAt(t);
    const cone = new THREE.Group();
    const body = new THREE.Mesh(coneGeo, conePvc);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 0.42;
    const collar2 = new THREE.Mesh(collarGeo, collarMat);
    collar2.position.y = 0.6;
    collar2.scale.setScalar(0.62);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.025;
    cone.add(body, collar, collar2, base);
    cone.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    cone.position.set(pt.x - tan.z * 5.4, 0, pt.z + tan.x * 5.4);
    cone.rotation.y = r() * Math.PI;
    cone.scale.setScalar(1.15);
    group.add(cone);
  }

  /* ------------------------------------------------ floodlight masts */
  const lampMat = new THREE.MeshStandardMaterial({ color: "#fffaf0", emissive: "#fff1d6", emissiveIntensity: 0 });
  const mastMat = new THREE.MeshStandardMaterial({ color: "#45484c", metalness: 0.5, roughness: 0.5 });
  const lamps: THREE.SpotLight[] = [];
  [
    [PAD.x0 + 2, PAD.z1 - 2],
    [PAD.x1 - 2, PAD.z1 - 2],
    [PAD.x0 + 2, PAD.z0 + 2],
  ].forEach(([x, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 14, 6).translate(0, 7, 0), mastMat);
    pole.position.set(x, 0, z);
    pole.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.5), lampMat);
    head.position.set(0, 14, 0);
    head.lookAt(-x, 0, -z);
    pole.add(head);
    group.add(pole);
    const spot = new THREE.SpotLight("#ffe2b0", 0, 90, 0.7, 0.6, 1.2);
    spot.position.set(x, 14, z);
    spot.target.position.set(x * 0.2, 0, z * 0.2 - 4);
    group.add(spot, spot.target);
    lamps.push(spot);
  });

  /* ------------------------------------------------ spoil heap (shrinks as the loader works) */
  const heapGeo = new THREE.ConeGeometry(7, 5, 14, 3);
  const hp = heapGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < hp.count; i++) {
    if (hp.getY(i) > 2.4) continue;
    hp.setX(i, hp.getX(i) * (0.85 + r() * 0.3));
    hp.setZ(i, hp.getZ(i) * (0.85 + r() * 0.3));
  }
  heapGeo.translate(0, 2.5, 0);
  heapGeo.computeVertexNormals();
  const heap = new THREE.Mesh(
    heapGeo,
    pbr("excavated_soil_wall", 3, 3, { color: "#c9b8a4" }),
  );
  heap.position.set(-22, 0, 2);
  heap.castShadow = heap.receiveShadow = true;
  group.add(heap);

  function update(night: number, heapGrow: number) {
    for (const l of lamps) l.intensity = night * 260;
    lampMat.emissiveIntensity = night * 2.2;
    cabinLights.forEach((mat) => (mat.emissiveIntensity = night * 1.4));
    heap.scale.set(0.5 + heapGrow * 0.5, 0.25 + heapGrow * 0.75, 0.5 + heapGrow * 0.5);
  }

  return { group, update, heapPos: heap.position };
}
