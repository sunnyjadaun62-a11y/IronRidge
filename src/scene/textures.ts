import * as THREE from "three";
import { rng } from "@/lib/anim";

/** Procedural canvas textures — everything painted at boot, nothing downloaded. */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, srgb = true, wrap = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, light: string, dark: string) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() > 0.5 ? light : dark;
    ctx.globalAlpha = 0.05 + r() * 0.12;
    const s = 1 + r() * 2.5;
    ctx.fillRect(r() * w, r() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

/** road paint only (transparent): u across the road, v along it */
export function markingsTexture() {
  const [c, ctx] = canvas(256, 512);
  ctx.clearRect(0, 0, 256, 512);
  // tyre polish tracks darken the asphalt beneath
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(40, 0, 34, 512);
  ctx.fillRect(182, 0, 34, 512);
  // edge lines
  ctx.fillStyle = "#d9d6cc";
  ctx.fillRect(10, 0, 5, 512);
  ctx.fillRect(241, 0, 5, 512);
  // centre dashes
  ctx.fillStyle = "#f2b705";
  ctx.fillRect(124, 0, 8, 300);
  return tex(c);
}

/** lattice for crane mast & jib — alpha-tested */
export function latticeTexture() {
  const [c, ctx] = canvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "square";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 116, 116);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(6, 6);
  ctx.lineTo(122, 122);
  ctx.stroke();
  const t = tex(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** curtain-wall glazing: mullions + random lit offices (emissive) */
export function facadeTextures(cols = 16, rows = 1, seed = 1) {
  const W = 512;
  const H = 128;
  const [c, ctx] = canvas(W, H);
  const [e, ectx] = canvas(W, H);
  const r = rng(seed);
  const cw = W / cols;
  const rh = H / rows;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#5c6b78");
  g.addColorStop(1, "#2a333c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ectx.fillStyle = "#000";
  ectx.fillRect(0, 0, W, H);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (r() > 0.42) {
        const warm = r() > 0.25;
        ectx.fillStyle = warm ? `hsl(${34 + r() * 10}, 90%, ${55 + r() * 20}%)` : `hsl(200, 40%, ${60 + r() * 20}%)`;
        ectx.globalAlpha = 0.5 + r() * 0.5;
        ectx.fillRect(x * cw + 3, y * rh + 14, cw - 6, rh - 24);
      }
    }
  }
  ectx.globalAlpha = 1;
  // mullions + spandrel
  ctx.fillStyle = "#1a1d20";
  ectx.fillStyle = "#000";
  for (let x = 0; x <= cols; x++) {
    ctx.fillRect(x * cw - 2, 0, 4, H);
    ectx.fillRect(x * cw - 2, 0, 4, H);
  }
  for (let y = 0; y <= rows; y++) {
    ctx.fillRect(0, y * rh - 6, W, 12);
    ectx.fillRect(0, y * rh - 6, W, 12);
  }
  return { map: tex(c), emissive: tex(e) };
}

/** distant skyline windows — dense grid */
export function skylineTexture() {
  const [c, ctx] = canvas(128, 256);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 256);
  const r = rng(77);
  for (let y = 4; y < 256; y += 10) {
    for (let x = 4; x < 128; x += 9) {
      if (r() > 0.55) {
        ctx.fillStyle = r() > 0.3 ? "#ffcf8a" : "#bfe1ff";
        ctx.globalAlpha = 0.4 + r() * 0.6;
        ctx.fillRect(x, y, 5, 5);
      }
    }
  }
  return tex(c);
}

/** distant towers by day: tinted glass with spandrel bands and mullions */
export function skylineDayTexture() {
  const [c, ctx] = canvas(128, 256);
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "#5b6876");
  g.addColorStop(1, "#3c4652");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const r = rng(91);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = "rgba(25,30,36,0.55)";
    ctx.fillRect(0, y, 128, 3);
    for (let x = 0; x < 128; x += 9) {
      ctx.fillStyle = `rgba(200,215,230,${0.04 + r() * 0.1})`;
      ctx.fillRect(x + 1, y + 3, 7, 7);
    }
  }
  return tex(c);
}

/** compacted earth for the site pad */
export function dirtTexture() {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = "#8a7259";
  ctx.fillRect(0, 0, 512, 512);
  speckle(ctx, 512, 512, 26000, 9, "#b39a7c", "#4e3d2e");
  // tyre ruts
  const r = rng(4);
  ctx.strokeStyle = "rgba(60,45,32,0.25)";
  for (let i = 0; i < 14; i++) {
    ctx.lineWidth = 6 + r() * 8;
    ctx.beginPath();
    const y = r() * 512;
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(170, y + (r() - 0.5) * 160, 340, y + (r() - 0.5) * 160, 532, y + (r() - 0.5) * 60);
    ctx.stroke();
  }
  return tex(c);
}

/** hi-vis site fence mesh */
export function fenceTexture() {
  const [c, ctx] = canvas(128, 64);
  ctx.clearRect(0, 0, 128, 64);
  ctx.strokeStyle = "#ff6a1a";
  ctx.lineWidth = 2.5;
  for (let i = -64; i < 128; i += 10) {
    ctx.beginPath();
    ctx.moveTo(i, 64);
    ctx.lineTo(i + 64, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 64, 64);
    ctx.stroke();
  }
  ctx.fillStyle = "#ff6a1a";
  ctx.fillRect(0, 0, 128, 4);
  ctx.fillRect(0, 60, 128, 4);
  return tex(c);
}

/** corrugated shipping-container side */
export function corrugatedTexture(base: string) {
  const [c, ctx] = canvas(256, 64);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 64);
  for (let x = 0; x < 256; x += 8) {
    const g = ctx.createLinearGradient(x, 0, x + 8, 0);
    g.addColorStop(0, "rgba(255,255,255,0.12)");
    g.addColorStop(0.5, "rgba(0,0,0,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 8, 64);
  }
  speckle(ctx, 256, 64, 600, 12, "#fff", "#000");
  return tex(c);
}

/** soft round sprite for dust / stars */
export function softDot(inner = "rgba(255,255,255,1)", mid = "rgba(255,255,255,0.4)") {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return tex(c, true, false);
}
