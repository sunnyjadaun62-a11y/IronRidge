import * as THREE from "three";
import { softDot } from "./textures";

/** Ring-buffer particle pool for tyre & shovel dust. Size + fade in the shader. */
export function buildDust(count: number) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count); // seconds remaining
  const age = new Float32Array(count);
  const maxLife = new Float32Array(count).fill(1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aAge", new THREE.BufferAttribute(age, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: softDot("rgba(205,180,145,0.9)", "rgba(180,155,120,0.35)") },
      uScale: { value: 300 },
      uTint: { value: new THREE.Color("#c8b393") },
    },
    vertexShader: /* glsl */ `
      attribute float aAge;
      uniform float uScale;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float grow = 1.0 + aAge * 4.0;
        gl_PointSize = uScale * grow / -mv.z;
        vA = aAge >= 1.0 ? 0.0 : (1.0 - aAge) * smoothstep(0.0, 0.08, aAge);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uTint;
      varying float vA;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(uTint, t.a * vA * 0.55);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  age.fill(1);

  let head = 0;
  function emit(x: number, y: number, z: number, spread: number, n: number, lift = 1.5) {
    for (let k = 0; k < n; k++) {
      const i = head;
      head = (head + 1) % count;
      pos[i * 3] = x + (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = y + Math.random() * 0.4;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
      vel[i * 3] = (Math.random() - 0.5) * 1.6;
      vel[i * 3 + 1] = lift * (0.4 + Math.random());
      vel[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      maxLife[i] = 1.6 + Math.random() * 1.8;
      life[i] = maxLife[i];
    }
  }

  function update(dt: number, wind: THREE.Vector3) {
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) {
        age[i] = 1;
        continue;
      }
      life[i] -= dt;
      age[i] = 1 - life[i] / maxLife[i];
      vel[i * 3 + 1] *= 0.97;
      pos[i * 3] += (vel[i * 3] + wind.x) * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += (vel[i * 3 + 2] + wind.z) * dt;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAge.needsUpdate = true;
  }

  return { points, emit, update, material: mat };
}
