import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { clamp, damp, lerp, range, rangeLin, track } from "@/lib/anim";
import { stage } from "@/lib/stage";
import { blueprint, patchTree } from "./blueprint";
import { BLD, FLOORS, buildBuilding } from "./building";
import { buildDust } from "./dust";
import { buildSite } from "./site";
import { ROAD, buildTerrain, heightAt } from "./terrain";
import { softDot } from "./textures";
import { initPbr, pbr } from "./pbr";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { gravelMoundGeometry, loadMachines } from "./machines";

/**
 * The whole film. Every visual is a pure function of stage.progress (plus a
 * little time-based life), so scrolling backwards rewinds the build exactly.
 */

const DEG = Math.PI / 180;

/* ---------------------------------------------------------------- site layout */
const CRANE_POS = new THREE.Vector3(20, 0, 4);
const YARD = new THREE.Vector3(24, 0, 17);
const EXCAVATOR_POS = new THREE.Vector3(-19, 0, -18);

/* ---------------------------------------------------------------- tracks */
// [p, elevation°, azimuth°]
const SUN = [
  [0, 2, 128],
  [0.1, 8, 135],
  [0.3, 28, 160],
  [0.48, 44, 190],
  [0.66, 20, 222],
  [0.76, 6, 236],
  [0.84, -2, 242],
  [0.9, -9, 246],
  [1, -12, 250],
];
// [p, r, g, b] horizon haze
const FOG = [
  [0, 0.86, 0.62, 0.47],
  [0.12, 0.78, 0.68, 0.6],
  [0.3, 0.62, 0.7, 0.8],
  [0.6, 0.68, 0.68, 0.66],
  [0.74, 0.86, 0.56, 0.4],
  [0.84, 0.25, 0.2, 0.28],
  [0.92, 0.05, 0.06, 0.1],
];
// fixed camera: [p, px, py, pz, lx, ly, lz, fov]
const CAM = [
  [0, -78, 34, 132, 14, 26, -70, 46],
  [0.05, -170, 60, 230, -200, 6, 150, 42],
  [0.32, -40, 14, 50, -6, 2, 0, 40],
  [0.36, -38, 10, 34, -8, 2, -2, 40],
  [0.42, -4, 6, 20, -12, 2, -2, 38],
  [0.47, -52, 22, 52, 2, 12, -8, 40],
  [0.56, -58, 30, 46, 10, 28, -6, 40],
  [0.64, 52, 46, 48, 0, 28, -8, 40],
  [0.7, 70, 92, 58, 0, 16, -6, 40],
  [0.745, 8, 170, 46, 0, 0, -8, 36],
  [0.8, -46, 78, 118, 0, 22, -6, 40],
  [0.87, -76, 14, 96, 0, 24, -8, 40],
  [0.93, -34, 7, 70, 0, 30, -6, 42],
  [1, 42, 11, 84, 0, 26, -6, 42],
];
// truck-relative orbit: [p, angle° (0 = right, 90 = ahead, 180 = left, 270 = behind), distance, height, lookUp]
const CHASE = [
  [0.07, 35, 15, 2.6, 2],
  [0.14, 115, 14, 3.4, 2],
  [0.21, 195, 16, 6, 2.5],
  [0.27, 250, 22, 11, 3],
  [0.31, 285, 26, 17, 2],
];
// blueprint fronts: [p, value]
const BP_IN = [
  [0.7, -650],
  [0.716, -60],
  [0.736, 60],
  [0.746, 650],
];
const BP_OUT = [
  [0.776, -650],
  [0.79, -60],
  [0.808, 60],
  [0.818, 650],
];

export interface WorldHandle {
  dispose: () => void;
}

export async function createWorld(
  host: HTMLElement,
  onProgress: (f: number) => void,
): Promise<WorldHandle> {
  const small = window.innerWidth < 768;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ renderer */
  const renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 4000);
  scene.fog = new THREE.Fog(0xd8a079, 260, 1500);

  /* ------------------------------------------------------------ sky + env */
  const sky = new Sky();
  sky.scale.setScalar(3000);
  const su = sky.material.uniforms;
  su.turbidity.value = 3.6;
  su.rayleigh.value = 1.35;
  su.mieCoefficient.value = 0.004;
  su.mieDirectionalG.value = 0.86;
  su.cloudCoverage.value = 0.32;
  su.cloudDensity.value = 0.35;
  scene.add(sky);

  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(50);
  envSky.material.uniforms.turbidity.value = 3.6;
  envSky.material.uniforms.rayleigh.value = 1.35;
  envSky.material.uniforms.cloudCoverage.value = 0;
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT: THREE.WebGLRenderTarget | null = null;
  let envElev = 999;

  const sunDir = new THREE.Vector3();
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -75;
  sc.right = sc.top = 75;
  sc.near = 10;
  sc.far = 400;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x5a4a3a, 0.8);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fa8ff, 0);
  moon.position.set(-100, 160, 80);
  scene.add(moon);

  // stars
  const STARS = 1600;
  const starPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.9 + 0.05;
    v.normalize().multiplyScalar(2400);
    starPos.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    sizeAttenuation: false,
    map: softDot(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // blueprint "paper" that replaces the sky while the scan is active
  const bpDome = new THREE.Mesh(
    new THREE.SphereGeometry(2800, 32, 16),
    new THREE.MeshBasicMaterial({ color: "#071833", side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false }),
  );
  scene.add(bpDome);

  /* ------------------------------------------------------------ world */
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, loaded, total) => onProgress(loaded / total);
  initPbr(manager);

  const terrain = buildTerrain();
  const site = buildSite();
  const building = buildBuilding();
  scene.add(terrain.group, site.group, building.group);

  const machines = await loadMachines(manager);
  const { truck, loader, excavator } = machines;
  const crane = machines.crane(54);
  crane.root.position.copy(CRANE_POS);
  scene.add(truck.root, loader.root, excavator.root, crane.root);

  // excavator cutting a service trench beside the tower
  excavator.root.position.copy(EXCAVATOR_POS);
  excavator.root.rotation.y = Math.PI / 2;

  // gravel the truck tips at the end of the haul road
  const roadEnd = ROAD.getPointAt(1);
  const roadEndTan = ROAD.getTangentAt(0.999);
  const pile = new THREE.Mesh(
    gravelMoundGeometry(6, 5, 1.9, 5),
    new THREE.MeshStandardMaterial({ color: "#8c8378", roughness: 1 }),
  );
  pile.userData.gravel = true;
  pile.position.copy(roadEnd).addScaledVector(roadEndTan, -7.6);
  pile.rotation.y = Math.atan2(roadEndTan.x, roadEndTan.z) + Math.PI / 2;
  pile.castShadow = pile.receiveShadow = true;
  scene.add(pile);

  // beam bundle waiting in the materials yard for the crane
  const bundle = new THREE.Group();
  const beamMat = new THREE.MeshStandardMaterial({ color: "#c4471d", roughness: 0.55, metalness: 0.4 });
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 6.4), beamMat);
    b.position.set(-0.55 + (i % 3) * 0.55, 0.25 + Math.floor(i / 3) * 0.5, 0);
    b.castShadow = true;
    bundle.add(b);
  }
  const slingGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 3.2, 0),
    new THREE.Vector3(0, 1, 2.8),
    new THREE.Vector3(0, 3.2, 0),
    new THREE.Vector3(0, 1, -2.8),
  ]);
  const slings = new THREE.LineSegments(slingGeo, new THREE.LineBasicMaterial({ color: "#222" }));
  bundle.add(slings);
  scene.add(bundle);

  // loose material everywhere shares one gravel surface
  const gravel = pbr("gravel_floor_02", 1.5, 1.5, { color: "#d8d2c8" });
  scene.traverse((o) => {
    if (o.userData.gravel) (o as THREE.Mesh).material = gravel;
  });

  const dust = buildDust(small ? 500 : 1100);
  scene.add(dust.points);

  patchTree(scene);

  /* ------------------------------------------------------------ post */
  // MSAA target: the composer otherwise drops the canvas antialiasing
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: small ? 0 : 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // ground-truth AO: contact shadows under machines, in slab joints and around the core
  const gtao = small ? null : new GTAOPass(scene, camera, 1, 1);
  if (gtao) {
    gtao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 2, scale: 1.1, samples: 12 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ------------------------------------------------------------ sizing */
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    gtao?.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
  };
  resize();
  window.addEventListener("resize", resize);

  /* ------------------------------------------------------------ choreography state */
  const roadLen = ROAD.getLength();
  const truckPos = new THREE.Vector3();
  const truckTan = new THREE.Vector3();
  const truckRight = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const rearWheel = new THREE.Vector3();
  const bucketPos = new THREE.Vector3();
  let lastTruckD = 0;

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const curPos = new THREE.Vector3(-60, 92, 150);
  const curLook = new THREE.Vector3(-14, 4, -4);
  const camRight = new THREE.Vector3();
  const chasePos = new THREE.Vector3();
  const chaseLook = new THREE.Vector3();
  const out8 = new Array(8).fill(0);
  const out4 = new Array(4).fill(0);
  const out3 = new Array(3).fill(0);
  const fogCol = new THREE.Color();
  const bpCol = new THREE.Color("#071833");
  const sunWarm = new THREE.Color("#ff9a52");
  const sunNoon = new THREE.Color("#fff3e2");
  const wind = new THREE.Vector3(1.2, 0, -0.4);

  const LOADER_A = new THREE.Vector3(-3, 0, -3);
  const LOADER_B = new THREE.Vector3(-13, 0, 2);
  const LOADER_PARK = new THREE.Vector3(-8, 0, -22);

  // crane keyframes (mutable so the drop height can follow the building)
  const craneKeys = [
    [0, 0, 20, 50],
    [0.18, 0, 0, 50],
    [0.3, 0, 0, 0],
    [0.36, 0, 0, 0],
    [0.5, 0, 0, 50],
    [0.7, 0, 0, 50],
    [0.82, 0, 0, 0],
    [0.88, 0, 0, 0],
    [1, 0, 16, 52],
  ];
  const DROP = new THREE.Vector3(BLD.x - 3, 0, BLD.z + 1);
  const wrap = (a: number, ref: number) => {
    while (a - ref > Math.PI) a -= Math.PI * 2;
    while (a - ref < -Math.PI) a += Math.PI * 2;
    return a;
  };

  // dev aid: ?p=0.5 freezes the film at a progress value
  const pinned = new URLSearchParams(location.search).get("p");
  const pinnedP = pinned === null ? null : Number(pinned);

  let time = 0;
  // tall screens need a longer lens throw to keep the truck in frame
  const portrait = () => (camera.aspect < 1 ? 1.6 : 1);
  let curP = pinnedP ?? stage.progress;
  let vel = 0;

  /* ------------------------------------------------------------ frame */
  const timer = new THREE.Timer();
  let raf = 0;

  const frame = (ts?: number) => {
    raf = requestAnimationFrame(frame);
    timer.update(ts);
    const dt = Math.min(timer.getDelta(), 0.1);
    time += dt;
    if (pinnedP !== null) stage.progress = pinnedP;
    curP += (stage.progress - curP) * damp(reduce ? 20 : 5, dt);
    vel += (stage.velocity - vel) * damp(4, dt);
    const p = curP;

    /* ---------- sky & light */
    track(SUN, p, out3);
    const elev = out3[0];
    const azim = out3[1];
    sunDir.setFromSphericalCoords(1, (90 - elev) * DEG, azim * DEG);
    su.sunPosition.value.copy(sunDir);
    su.time.value = time;
    envSky.material.uniforms.sunPosition.value.copy(sunDir);

    const day = clamp((elev + 6) / 20);
    const night = range(p, 0.8, 0.9);
    sun.position.copy(sunDir).multiplyScalar(220);
    sun.target.position.set(0, 0, 0);
    sun.intensity = Math.sin(Math.max(elev, 0) * DEG) * 1.9 + day * 0.6;
    sun.color.copy(sunWarm).lerp(sunNoon, clamp(elev / 30));
    hemi.intensity = lerp(0.14, 0.38, day);
    moon.intensity = night * 0.9;
    starMat.opacity = night;
    (terrain.skyline.material as THREE.MeshStandardMaterial).emissiveIntensity = night * 1.3;

    track(FOG, p, out4);
    fogCol.setRGB(out4[0], out4[1], out4[2]);

    if (Math.abs(elev - envElev) > 1.5) {
      envElev = elev;
      envRT?.dispose();
      envRT = pmrem.fromScene(envScene, 0.02);
      scene.environment = envRT.texture;
    }
    scene.environmentIntensity = lerp(0.12, 0.55, day);

    /* ---------- blueprint scan */
    blueprint.uBpIn.value = track(BP_IN, p, out3)[0];
    blueprint.uBpOut.value = track(BP_OUT, p, out3)[0];
    const bp = range(p, 0.714, 0.74) * (1 - range(p, 0.788, 0.81));
    (bpDome.material as THREE.MeshBasicMaterial).opacity = bp;
    fogCol.lerp(bpCol, bp);
    (scene.fog as THREE.Fog).color.copy(fogCol);
    renderer.toneMappingExposure = lerp(0.72, 0.95, night) + bp * 0.15;
    bloom.strength = night * 0.9 + bp * 0.35;
    bloom.enabled = bloom.strength > 0.01;

    /* ---------- truck: haul, then tip the gravel */
    const tt = range(p, 0.07, 0.31);
    const d = tt * roadLen;
    ROAD.getPointAt(tt, truckPos);
    ROAD.getTangentAt(Math.min(tt, 0.999), truckTan);
    truck.root.position.copy(truckPos);
    truck.root.rotation.y = Math.atan2(truckTan.x, truckTan.z);
    const speed = Math.abs(d - lastTruckD) / Math.max(dt, 1e-3);
    lastTruckD = d;
    truck.root.position.y = Math.sin(time * 18) * Math.min(speed, 20) * 0.0015;
    truck.roll(d);
    const tipT = range(p, 0.315, 0.36) * (1 - range(p, 0.41, 0.45));
    const poured = range(p, 0.33, 0.39);
    truck.tip(tipT, poured);
    pile.scale.set(0.3 + poured * 0.7, Math.max(poured, 0.02), 0.3 + poured * 0.7);
    pile.visible = poured > 0.01;
    truck.root.updateMatrixWorld();
    if (speed > 1.5 && !reduce) {
      for (const side of [-1, 1]) {
        rearWheel.set(side * 1.1, 0.2, -3.4).applyMatrix4(truck.root.matrixWorld);
        dust.emit(rearWheel.x, rearWheel.y, rearWheel.z, 1.6, Math.min(Math.ceil(speed * 0.15), 4), 1.2);
      }
    }
    if (!reduce && poured > 0.02 && poured < 0.98) {
      rearWheel.set(0, 1.4, -5.2).applyMatrix4(truck.root.matrixWorld);
      dust.emit(rearWheel.x, rearWheel.y, rearWheel.z, 2.4, 3, 0.9);
    }
    truckRight.crossVectors(truckTan, up).normalize();

    /* ---------- loader (dig beat) */
    const enter = range(p, 0.27, 0.315);
    const leave = range(p, 0.46, 0.5);
    const cyc = rangeLin(p, 0.315, 0.46) * 3;
    const fr = cyc >= 3 ? 1 : cyc % 1;
    let lx: number, lz: number, yaw: number;
    let lift = 0.1;
    let curl = 0.2;
    let full = 0;
    if (p < 0.315) {
      lx = lerp(LOADER_PARK.x, LOADER_A.x, enter);
      lz = lerp(LOADER_PARK.z, LOADER_A.z, enter);
      yaw = lerp(0, Math.PI / 2, enter);
    } else if (p > 0.46) {
      lx = lerp(LOADER_A.x, LOADER_PARK.x, leave);
      lz = lerp(LOADER_A.z, LOADER_PARK.z, leave);
      yaw = lerp(Math.PI / 2, Math.PI, leave);
    } else {
      const go = range(fr, 0.2, 0.5) * (1 - range(fr, 0.65, 0.95));
      lx = lerp(LOADER_A.x, LOADER_B.x, go);
      lz = lerp(LOADER_A.z, LOADER_B.z, go) + Math.sin(go * Math.PI) * 4;
      yaw = lerp(Math.PI / 2, -Math.PI / 2, range(fr, 0.22, 0.48) * (1 - range(fr, 0.67, 0.93)));
      const scoop = range(fr, 0.04, 0.18);
      const raise = range(fr, 0.18, 0.5) * (1 - range(fr, 0.66, 0.85));
      const dump = range(fr, 0.52, 0.6) * (1 - range(fr, 0.64, 0.72));
      lift = lerp(0, 0.35, scoop) + raise * 0.65;
      curl = lerp(-0.1, 1, scoop) - dump * 2;
      full = scoop * (1 - range(fr, 0.53, 0.62));
      if (!reduce && ((fr > 0.04 && fr < 0.16) || (fr > 0.53 && fr < 0.64))) {
        const sx = lx + Math.sin(yaw) * 4.2;
        const sz = lz + Math.cos(yaw) * 4.2;
        dust.emit(sx, fr > 0.5 ? 2.2 : 0.5, sz, 2.5, 3, 1.6);
      }
    }
    loader.root.position.set(lx, 0, lz);
    loader.root.rotation.y = yaw;
    loader.pose(lift, curl, full);
    loader.roll(Math.hypot(lx, lz) + yaw * 2);
    site.update(night, 0.25 + range(p, 0.315, 0.46) * 0.75);

    /* ---------- excavator: endless trench cycle */
    const ex = (time / 9) % 1;
    const exSlew = lerp(0, 1.7, range(ex, 0.38, 0.55) * (1 - range(ex, 0.75, 0.95)));
    const exBoom = lerp(-0.6, 0.55, range(ex, 0.22, 0.4) * (1 - range(ex, 0.72, 0.95))) + range(ex, 0, 0.08) * 0.3;
    const exDip = lerp(-0.4, 0.75, range(ex, 0.02, 0.2)) * (1 - range(ex, 0.85, 1)) - 0.4 * range(ex, 0.85, 1);
    const exBkt = lerp(-0.5, 0.9, range(ex, 0.08, 0.22)) - 1.5 * range(ex, 0.58, 0.66) * (1 - range(ex, 0.7, 0.8));
    excavator.pose(exSlew, exBoom, exDip, exBkt);
    if (!reduce && ((ex > 0.06 && ex < 0.18) || (ex > 0.6 && ex < 0.68))) {
      excavator.bucketWorld(bucketPos);
      dust.emit(bucketPos.x, Math.max(bucketPos.y - 0.5, 0.3), bucketPos.z, 1.4, 1, 1.2);
    }

    /* ---------- building */
    const floors = FLOORS * range(p, 0.44, 0.7);
    const glaze = FLOORS * range(p, 0.5, 0.79);
    building.update(floors, Math.min(glaze, floors - 0.5), night, range(p, 0.69, 0.74), time);

    /* ---------- crane */
    const c = rangeLin(p, 0.42, 0.62);
    const aT = crane.aim(YARD.x, YARD.z);
    const aD = crane.aim(DROP.x, DROP.z);
    const yawD = aD.yaw;
    const yawT = wrap(aT.yaw, yawD);
    const yawRest = yawD - 0.9;
    const topY = building.topY(floors);
    const high = crane.height() - 8;
    const k = craneKeys;
    k[0][1] = yawRest; k[0][3] = high;
    k[1][1] = yawT; k[1][2] = aT.reach; k[1][3] = high;
    k[2][1] = yawT; k[2][2] = aT.reach; k[2][3] = YARD.y + 4.4;
    k[3][1] = yawT; k[3][2] = aT.reach; k[3][3] = YARD.y + 4.4;
    k[4][1] = yawT; k[4][2] = aT.reach; k[4][3] = high - 4;
    k[5][1] = yawD; k[5][2] = aD.reach; k[5][3] = high - 4;
    k[6][1] = yawD; k[6][2] = aD.reach; k[6][3] = topY + 4.4;
    k[7][1] = yawD; k[7][2] = aD.reach; k[7][3] = topY + 4.4;
    k[8][1] = yawD + 0.5; k[8][3] = Math.max(high, topY + 16);
    track(k, c, out4);
    const idle = p > 0.62 ? Math.sin(time * 0.25) * 0.08 : 0;
    crane.set(out4[0] + idle, out4[1], out4[2]);
    crane.night(night, time);

    /* ---------- bundle */
    if (c < 0.33) {
      bundle.visible = true;
      bundle.position.copy(YARD);
      bundle.rotation.y = 0;
      slings.visible = c > 0.28;
    } else if (c < 0.86) {
      bundle.visible = true;
      slings.visible = true;
      bundle.position.set(crane.hookWorld.x, crane.hookWorld.y - 3.2, crane.hookWorld.z);
      bundle.rotation.y = Math.sin(time * 0.9) * 0.04 + range(c, 0.4, 0.7) * 0.3;
    } else {
      bundle.visible = false;
    }

    /* ---------- dust */
    dust.update(dt, wind);

    /* ---------- camera */
    track(CAM, p, out8);
    camPos.set(out8[0], out8[1], out8[2]);
    camLook.set(out8[3], out8[4], out8[5]);
    const follow = range(p, 0.045, 0.095) * (1 - range(p, 0.29, 0.335));
    if (follow > 0) {
      track(CHASE, p, out4);
      const ang = out4[0] * DEG;
      const reach = out4[1] * portrait();
      chasePos
        .copy(truckPos)
        .addScaledVector(truckRight, Math.cos(ang) * reach)
        .addScaledVector(truckTan, Math.sin(ang) * reach)
        .addScaledVector(up, out4[2]);
      chaseLook.copy(truckPos).addScaledVector(up, out4[3]).addScaledVector(truckTan, 3);
      camPos.lerp(chasePos, follow);
      camLook.lerp(chaseLook, follow);
    }
    // pointer parallax + scroll-speed shake
    camRight.subVectors(camLook, camPos).cross(up).normalize();
    const par = reduce ? 0 : 1;
    camPos.addScaledVector(camRight, stage.px * 2.2 * par);
    camPos.y += stage.py * 1.4 * par;
    const shake = reduce ? 0 : Math.min(Math.abs(vel), 60) * 0.004;
    camPos.y += Math.sin(time * 31) * shake;
    camPos.x += Math.cos(time * 27) * shake;

    // never let the camera dip into a hillside
    camPos.y = Math.max(camPos.y, heightAt(camPos.x, camPos.z) + 2.5);

    const e = pinnedP !== null ? 1 : damp(6, dt);
    curPos.lerp(camPos, e);
    curLook.lerp(camLook, e);
    camera.position.copy(curPos);
    camera.lookAt(curLook);
    const fov = out8[6] * (camera.aspect < 1 ? 1.4 : 1);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    blueprint.uTime.value = time;
    composer.render();
  };

  renderer.compile(scene, camera);
  onProgress(1);
  frame();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
      });
      envRT?.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    },
  };
}
