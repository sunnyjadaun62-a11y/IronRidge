import * as THREE from "three";

/**
 * "Blueprint scan": a front sweeps across the world along +x; everything it has
 * passed renders as a glowing cyan drawing on blueprint paper. A second front
 * sweeps it back to reality. Shared uniforms → one value drives every material.
 */
export const blueprint = {
  uBpIn: { value: -1000 },
  uBpOut: { value: -1000 },
  uTime: { value: 0 },
};

const patched = new WeakSet<THREE.Material>();

export function patchBlueprint(mat: THREE.Material) {
  if (patched.has(mat)) return mat;
  patched.add(mat);
  // optional road grime: dust caked on low surfaces of machines (userData.grime 0..1)
  const grime = Number(mat.userData.grime ?? 0);
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${prevKey()}|bp|g${grime.toFixed(2)}`;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, blueprint);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBpWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 bpW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          bpW = instanceMatrix * bpW;
        #endif
        vBpWorld = (modelMatrix * bpW).xyz;`,
      );
    if (grime > 0) {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          float grimeK = ${grime.toFixed(3)} * grimeAmount(vBpWorld);
          float grimeN = bpHash(floor(vBpWorld * vec3(7.0, 5.0, 7.0)));
          grimeK *= 0.45 * smoothstep(0.25, 0.9, grimeN + 0.35);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.37, 0.3) * (0.85 + 0.3 * grimeN), grimeK);`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 1.0, grimeK);`,
        );
    }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vBpWorld;
        float bpHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        // dust is heaviest near the ground, with a faint film everywhere
        float grimeAmount(vec3 w) { return 0.12 + 0.88 * (1.0 - smoothstep(0.1, 1.9, w.y)); }
        uniform float uBpIn;
        uniform float uBpOut;
        uniform float uTime;
        float bpGrid(vec3 p, float s, float w) {
          vec3 g = abs(fract(p / s - 0.5) - 0.5) * s;
          float m = min(min(g.x, g.y), g.z);
          return 1.0 - smoothstep(0.0, w, m);
        }`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        {
          float diag = vBpWorld.x + vBpWorld.z * 0.35;
          float k = smoothstep(uBpIn, uBpIn - 4.0, diag) * smoothstep(uBpOut - 4.0, uBpOut, diag);
          if (k > 0.001) {
            float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 paper = vec3(0.035, 0.11, 0.24) + lum * 0.12;
            float fine = bpGrid(vBpWorld, 1.0, 0.04);
            float major = bpGrid(vBpWorld, 5.0, 0.09);
            vec3 ink = vec3(0.55, 0.85, 1.0);
            vec3 bp = paper + ink * (fine * 0.18 + major * 0.75);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, bp, k);
          }
          // the scanning edges glow hazard-orange
          float edge = exp(-abs(diag - uBpIn) * 0.9) + exp(-abs(diag - uBpOut) * 0.9);
          gl_FragColor.rgb += vec3(1.0, 0.42, 0.1) * edge * 1.6;
        }`,
      );
  };
  mat.needsUpdate = true;
  return mat;
}

/** patch every material under an object */
export function patchTree(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mat) => {
      if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) patchBlueprint(mat);
    });
  });
}
