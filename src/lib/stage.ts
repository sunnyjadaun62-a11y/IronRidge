/**
 * Shared, mutable state between the scroll system (GSAP) and the WebGL world.
 * Written by ScrollTriggers, read every frame by the scene — kept outside React
 * so scrolling never triggers a re-render.
 */
export const stage = {
  /** 0 → 1 across the whole page; the scene derives everything from this */
  progress: 0,
  /** Lenis scroll velocity, px/frame */
  velocity: 0,
  /** pointer in -1..1 */
  px: 0,
  py: 0,
  /** set once the loader curtain lifts */
  ready: false,
};

/**
 * Story beats — each page section maps its scroll range onto one of these
 * progress windows. Scene choreography and the HUD both key off them.
 */
export const BEATS = {
  hero: [0, 0.08],
  haul: [0.08, 0.32],
  dig: [0.32, 0.46],
  frame: [0.46, 0.7],
  blueprint: [0.7, 0.8],
  projects: [0.8, 0.92],
  contact: [0.92, 1],
} as const;

export type Beat = keyof typeof BEATS;
