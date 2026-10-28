import * as THREE from "three";
import { clamp, smooth } from "@/lib/anim";
import { facadeTextures } from "./textures";
import { pbr } from "./pbr";

export const FLOORS = 12;
export const FH = 3.4;
export const BLD = { x: 0, z: -6, w: 24, d: 16 };

const COL_X = [-12, -6, 0, 6, 12];
const COL_Z = [-8, 0, 8];

/**
 * A 12-storey commercial tower that assembles itself: columns grow, slabs
 * drop in from the crane, curtain wall follows a few floors behind, and at
 * night the offices light up.
 */
export function buildBuilding() {
  const group = new THREE.Group();
  group.position.set(BLD.x, 0, BLD.z);

  // cast-in-place concrete: separate tilings so 0.7 m columns and 25 m slabs share a grain size
  const colConcrete = pbr("rough_concrete", 0.35, 1.7, { color: "#cfcac1" });
  const slabConcrete = pbr("rough_concrete", 8, 5, { color: "#cfcac1" });
  const concrete = slabConcrete;
  const steel = new THREE.MeshStandardMaterial({ color: "#d4541c", roughness: 0.55, metalness: 0.35 });
  const coreMat = pbr("concrete_wall_008", 1.5, 12, { color: "#c9c4bb" });

  const tmp = new THREE.Object3D();

  /* columns */
  const perFloor = COL_X.length * COL_Z.length;
  const cols = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.7, FH, 0.7).translate(0, FH / 2, 0),
    colConcrete,
    perFloor * FLOORS,
  );
  cols.castShadow = cols.receiveShadow = true;

  /* slabs */
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(BLD.w + 1, 0.5, BLD.d + 1), concrete, FLOORS);
  slabs.castShadow = slabs.receiveShadow = true;

  /* perimeter steel — 4 per floor */
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.6, 0.4), steel, FLOORS * 4);
  beams.castShadow = true;

  /* lift core leads the structure */
  const core = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 5).translate(0, 0.5, 0), coreMat);
  core.position.set(4, 0, -1.5);
  core.castShadow = core.receiveShadow = true;

  group.add(cols, slabs, beams, core);

  /* curtain wall, one box per floor, open top & bottom */
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const glassMats: THREE.MeshStandardMaterial[] = [];
  const glazing: THREE.Mesh[] = [];
  const glassGeo = new THREE.BoxGeometry(BLD.w - 0.1, FH - 0.5, BLD.d - 0.1).translate(0, (FH - 0.5) / 2 + 0.25, 0);
  for (let i = 0; i < FLOORS; i++) {
    const long = facadeTextures(16, 1, 100 + i);
    const short = facadeTextures(11, 1, 300 + i);
    const mk = (t: { map: THREE.Texture; emissive: THREE.Texture }) => {
      const mat = new THREE.MeshStandardMaterial({
        map: t.map,
        emissiveMap: t.emissive,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0,
        metalness: 0.55,
        roughness: 0.16,
        envMapIntensity: 1.2,
      });
      glassMats.push(mat);
      return mat;
    };
    const mz = mk(long);
    const mx = mk(short);
    const g = new THREE.Mesh(glassGeo, [mx, mx, hidden, hidden, mz, mz]);
    g.position.y = i * FH;
    g.castShadow = true;
    g.scale.y = 0.0001;
    glazing.push(g);
    group.add(g);
  }

  /* rooftop crown: plant screen + mast */
  const crown = new THREE.Group();
  const screen = new THREE.Mesh(new THREE.BoxGeometry(BLD.w - 4, 3, BLD.d - 4), steel);
  screen.position.y = 1.5;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 12, 6), concrete);
  mast.position.set(-6, 6, 2);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 8),
    new THREE.MeshStandardMaterial({ color: "#ff2a1a", emissive: "#ff2a1a", emissiveIntensity: 0 }),
  );
  beacon.position.set(-6, 12.2, 2);
  crown.add(screen, mast, beacon);
  crown.position.y = FLOORS * FH;
  crown.scale.setScalar(0.0001);
  group.add(crown);

  const S = new THREE.Vector3();
  /**
   * @param f      structure progress in floors (0..FLOORS)
   * @param glassF curtain-wall progress in floors
   * @param night  0..1 office lights
   * @param top    0..1 rooftop crown
   */
  function update(f: number, glassF: number, night: number, top: number, time: number) {
    for (let i = 0; i < FLOORS; i++) {
      const local = clamp(f - i);
      const grow = smooth(clamp(local * 2));
      const drop = smooth(clamp(local * 2 - 1));
      const y0 = i * FH;

      for (let c = 0; c < perFloor; c++) {
        const cx = COL_X[c % COL_X.length];
        const cz = COL_Z[Math.floor(c / COL_X.length)];
        tmp.position.set(cx, y0, cz);
        const on = grow > 0.001 ? 1 : 0.0001;
        tmp.scale.set(on, Math.max(grow, 0.0001), on);
        tmp.updateMatrix();
        cols.setMatrixAt(i * perFloor + c, tmp.matrix);
      }

      const vis = local > 0.5 ? 1 : 0.0001;
      const slabY = y0 + FH + (1 - drop) * 7;
      tmp.position.set(0, slabY, 0);
      tmp.scale.setScalar(vis);
      tmp.updateMatrix();
      slabs.setMatrixAt(i, tmp.matrix);

      const by = slabY - 0.45;
      const edges: [number, number, number, number][] = [
        [0, by, BLD.d / 2 + 0.3, BLD.w + 1],
        [0, by, -BLD.d / 2 - 0.3, BLD.w + 1],
        [BLD.w / 2 + 0.3, by, 0, BLD.d + 1],
        [-BLD.w / 2 - 0.3, by, 0, BLD.d + 1],
      ];
      edges.forEach(([x, y, z, len], k) => {
        tmp.position.set(x, y, z);
        tmp.rotation.set(0, k < 2 ? 0 : Math.PI / 2, 0);
        tmp.scale.set(len * vis, vis, vis);
        tmp.updateMatrix();
        beams.setMatrixAt(i * 4 + k, tmp.matrix);
      });
      tmp.rotation.set(0, 0, 0);

      const gl = smooth(clamp(glassF - i));
      glazing[i].scale.y = Math.max(gl, 0.0001);
      glazing[i].visible = gl > 0.001;
    }
    cols.instanceMatrix.needsUpdate = true;
    slabs.instanceMatrix.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;

    core.scale.y = Math.max(Math.min(f + 1.3, FLOORS + 0.6) * FH, 0.01);

    for (const m of glassMats) m.emissiveIntensity = night * 1.5;

    crown.scale.copy(S.setScalar(Math.max(smooth(top), 0.0001)));
    (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity =
      night * top * (Math.sin(time * 3) > 0.2 ? 6 : 0.4);
  }

  /** world-space height of the current top slab */
  const topY = (f: number) => Math.max(Math.floor(f), 0) * FH + FH + 0.3;

  update(0, 0, 0, 0, 0);
  return { group, update, topY };
}
