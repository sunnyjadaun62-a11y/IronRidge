import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Rigged construction machines. The GLBs are pre-processed by
 * scripts/optimize-models.mjs so each moving group's origin sits on its hinge;
 * here we just find those groups and expose intent-level controls.
 *
 * Source models face +X (truck, loader) or −X (excavator arm); every rig is
 * wrapped so its public `root` faces +Z like the rest of the world code.
 */

const ORANGE = new THREE.Color("#ff6a1a");

function prep(scene: THREE.Object3D, paint?: THREE.Color, grime = 0.6) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (paint && /yellow outdoor paint/i.test(mat.name)) {
      mat.map = null;
      mat.color.copy(paint);
      mat.roughness = 0.5;
    }
    if (mat.transparent) {
      mat.depthWrite = false;
      mat.envMapIntensity = 1.5;
    } else {
      mat.userData.grime = grime;
    }
  });
}

function wrap(model: THREE.Object3D, faceYaw: number, scale = 1) {
  const root = new THREE.Group();
  model.rotation.y = faceYaw;
  model.scale.setScalar(scale);
  root.add(model);
  return root;
}

const req = (o: THREE.Object3D, name: string) => {
  const n = o.getObjectByName(name);
  if (!n) throw new Error(`rig part missing: ${name}`);
  return n;
};

/* -------------------------------------------------------------- dump truck */
export function rigTruck(gltf: THREE.Group) {
  prep(gltf, ORANGE);
  const root = wrap(gltf, -Math.PI / 2);
  const wheels = [1, 2, 3].flatMap((a) => ["left", "right"].map((s) => req(gltf, `wheel_${a}_${s}`)));
  const hopper = req(gltf, "hopper");
  const ram = req(gltf, "ram");

  // load of gravel riding in the hopper (hopper-local: hinge at origin, body runs +x)
  const load = new THREE.Mesh(
    gravelMoundGeometry(4.9, 2.3, 0.9, 11),
    new THREE.MeshStandardMaterial({ color: "#8c8378", roughness: 1 }),
  );
  load.position.set(2.7, 0.75, 0);
  load.castShadow = load.receiveShadow = true;
  load.userData.gravel = true;
  hopper.add(load);

  const R = 0.52;
  const H = new THREE.Vector2(-4.15, 1.29); // hinge
  const BASE = new THREE.Vector2(0.95, 1.14); // ram base eye
  const TOP = new THREE.Vector2(1.02, 2.49); // ram rod eye at rest
  const rest = TOP.clone().sub(BASE);
  const restLen = rest.length();
  const restAng = Math.atan2(rest.y, rest.x);
  const tmp = new THREE.Vector2();

  return {
    root,
    load,
    /** distance travelled (m) → wheel spin */
    roll(d: number) {
      for (const w of wheels) w.rotation.z = -d / R;
    },
    /** 0 = hopper down, 1 = fully tipped; `empty` 0..1 shrinks the load */
    tip(t: number, empty: number) {
      const a = t * 0.85;
      hopper.rotation.z = a;
      tmp.copy(TOP).sub(H).rotateAround(new THREE.Vector2(), a).add(H).sub(BASE);
      ram.rotation.z = Math.atan2(tmp.y, tmp.x) - restAng;
      ram.scale.y = tmp.length() / restLen;
      load.scale.set(1, Math.max(1 - empty, 0.02), 1);
      load.visible = empty < 0.98;
    },
  };
}

/* -------------------------------------------------------------- wheel loader */
export function rigLoader(gltf: THREE.Group) {
  prep(gltf, undefined, 0.75);
  const root = wrap(gltf, -Math.PI / 2);
  const wheels = [0, 1].flatMap((a) => ["left", "right"].map((s) => req(gltf, `wheel_${a}_${s}`)));
  const arm = req(gltf, "arm");
  const bucket = req(gltf, "bucket");
  const rams = [req(gltf, "liftram_l"), req(gltf, "liftram_r")];

  const R = 0.77;
  const ARM = new THREE.Vector2(-0.1, 2.2);
  const BASE = new THREE.Vector2(0.05, 1.08);
  const EYE = new THREE.Vector2(1.13, 2.16);
  const rest = EYE.clone().sub(BASE);
  const restLen = rest.length();
  const restAng = Math.atan2(rest.y, rest.x);
  const tmp = new THREE.Vector2();

  // dirt carried in the bucket
  const scoop = new THREE.Mesh(
    gravelMoundGeometry(1.1, 2.6, 0.55, 7),
    new THREE.MeshStandardMaterial({ color: "#6e5440", roughness: 1 }),
  );
  scoop.position.set(0.55, 0.15, 0);
  scoop.userData.gravel = true;
  bucket.add(scoop);

  return {
    root,
    roll(d: number) {
      for (const w of wheels) w.rotation.z = -d / R;
    },
    /** lift 0 (on ground) → 1 (raised); curl −1 (dump) → 1 (crowd back) */
    pose(lift: number, curl: number, full: number) {
      const a = lift * 0.95 - 0.05;
      arm.rotation.z = a;
      bucket.rotation.z = curl * 0.6 - a;
      tmp.copy(EYE).sub(ARM).rotateAround(new THREE.Vector2(), a).add(ARM).sub(BASE);
      for (const r of rams) {
        r.rotation.z = Math.atan2(tmp.y, tmp.x) - restAng;
        r.scale.y = tmp.length() / restLen;
      }
      scoop.visible = full > 0.02;
      scoop.scale.setScalar(Math.max(full, 0.02));
    },
  };
}

/* -------------------------------------------------------------- excavator */
export function rigExcavator(gltf: THREE.Group) {
  prep(gltf, undefined, 0.8);
  // arm points −X in the source; turn it to +Z and scale to a mid-size machine
  const root = wrap(gltf, Math.PI / 2, 1.7);
  const upper = req(gltf, "upper");
  const boom = req(gltf, "boom");
  const dipper = req(gltf, "dipper");
  const bucket = req(gltf, "bucket");
  return {
    root,
    /** slew (rad), boom/dipper/bucket in −1..1 */
    pose(slew: number, b: number, d: number, k: number) {
      upper.rotation.y = slew;
      boom.rotation.z = -b * 0.55;
      dipper.rotation.z = d * 0.7;
      bucket.rotation.z = k * 1.1;
    },
    bucketWorld(out: THREE.Vector3) {
      return bucket.getWorldPosition(out);
    },
  };
}

/* -------------------------------------------------------------- tower crane */
export function rigCrane(gltf: THREE.Group, height: number) {
  prep(gltf, undefined, 0.25);
  const root = new THREE.Group();
  root.add(gltf);
  const mast = req(gltf, "mast");
  const slew = req(gltf, "slew");
  const trolley = req(gltf, "trolley");
  const hook = req(gltf, "hook");
  const rope = req(gltf, "rope");

  // stack a second mast section and stretch both to reach `height`
  const SECTION = 23.35;
  const s = height / (SECTION * 2 + 0.65);
  mast.scale.y = s;
  const mast2 = mast.clone();
  mast2.position.y = SECTION * s;
  mast.parent!.add(mast2);
  slew.position.y = (SECTION * 2 + 0.65) * s + 0.21;

  // aircraft warning lights
  const warnMat = new THREE.MeshStandardMaterial({ color: "#ff2a1a", emissive: "#ff2a1a", emissiveIntensity: 0 });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), warnMat);
  tip.position.set(30, 2.3, 0);
  const tail = tip.clone();
  tail.position.set(-8, 2.3, 0);
  slew.add(tip, tail);

  const TROLLEY_Y = 24.6 - 24.21; // trolley pivot above slew pivot
  const ROPE_LEN = 24.47 - 16.18;
  const HOOK_TOP = 16.36;
  const pivotY = () => slew.position.y;
  const hookWorld = new THREE.Vector3();

  function set(yaw: number, reach: number, hookY: number) {
    slew.rotation.y = yaw;
    trolley.position.x = Math.min(Math.max(reach, 3), 29);
    const trolleyY = pivotY() + TROLLEY_Y;
    const drop = Math.max(trolleyY - hookY, 2);
    hook.position.y = -drop;
    rope.position.y = -0.13;
    rope.scale.y = Math.max(drop - (24.6 - HOOK_TOP) + ROPE_LEN, 0.5) / ROPE_LEN;
    // real 30 mm wire vanishes below a pixel at this distance — thicken it a little
    rope.scale.x = rope.scale.z = 3;
    hookWorld.set(Math.cos(yaw) * reach, hookY - 1.15, -Math.sin(yaw) * reach).add(root.position);
  }

  function aim(x: number, z: number) {
    const dx = x - root.position.x;
    const dz = z - root.position.z;
    return { yaw: Math.atan2(-dz, dx), reach: Math.hypot(dx, dz) };
  }

  function night(n: number, time: number) {
    warnMat.emissiveIntensity = 0.3 + n * (Math.sin(time * 2.4) > 0 ? 6 : 0.3);
  }

  return { root, set, aim, hookWorld, night, height: () => pivotY() };
}

/* -------------------------------------------------------------- loader */
export async function loadMachines(manager: THREE.LoadingManager) {
  const loader = new GLTFLoader(manager);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const [truck, loaderM, excavator, crane] = await Promise.all(
    ["dump-truck", "wheel-loader", "excavator", "tower-crane"].map((n) => loader.loadAsync(`/models/${n}.glb`)),
  );
  return {
    truck: rigTruck(truck.scene),
    loader: rigLoader(loaderM.scene),
    excavator: rigExcavator(excavator.scene),
    crane: (height: number) => rigCrane(crane.scene, height),
  };
}

/* -------------------------------------------------------------- helpers */
/** a lumpy heap of loose material: length (x) × width (z) × height (y) */
export function gravelMoundGeometry(len: number, wid: number, hgt: number, seed: number) {
  const g = new THREE.PlaneGeometry(len, wid, 18, 10).rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) / len) * 2;
    const v = (p.getZ(i) / wid) * 2;
    const dome = Math.max(0, 1 - u * u) * Math.max(0, 1 - v * v);
    p.setY(i, hgt * Math.pow(dome, 0.6) * (0.85 + r() * 0.3));
  }
  g.computeVertexNormals();
  return g;
}
