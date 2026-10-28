"use client";

import { useEffect, useRef } from "react";
import { BEATS, stage } from "@/lib/stage";
import { PHASES } from "@/lib/content";
import { clamp, lerp, range } from "@/lib/anim";
import Logo from "./Logo";

/**
 * Left "site log" sidebar. Readouts are written straight to the DOM every
 * frame from stage.progress — no React renders while scrolling.
 */
export default function Hud({ onMenu }: { onMenu: () => void }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const phases = Array.from(el.querySelectorAll<HTMLElement>("[data-phase]"));
    const bars = phases.map((p) => p.querySelector<HTMLElement>(".bar i")!);
    const q = (k: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-read="${k}"]`));
    const day = q("day");
    const floors = q("floors");
    const clock = q("clock");
    const haul = q("haul");
    const phaseName = q("phase");
    const meter = q("meter");
    let raf = 0;
    let last = -1;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = stage.progress;
      if (Math.abs(p - last) < 0.0004) return;
      last = p;

      let active = 0;
      phases.forEach((ph, i) => {
        const [a, b] = BEATS[PHASES[i].beat];
        const f = clamp((p - a) / (b - a));
        bars[i].style.transform = `scaleX(${f})`;
        if (p >= a) active = i;
        ph.classList.toggle("is-done", p >= b);
      });
      phases.forEach((ph, i) => ph.classList.toggle("is-active", i === active));

      const set = (els: HTMLElement[], v: string) => els.forEach((e) => (e.textContent = v));
      set(day, String(Math.round(lerp(1, 412, p))).padStart(3, "0"));
      set(floors, `${String(Math.floor(12 * range(p, 0.44, 0.7))).padStart(2, "0")}/12`);
      set(haul, `${(lerp(0, 42.6, range(p, 0.07, 0.31))).toFixed(1)} km`);
      const mins = Math.round(lerp(5 * 60 + 40, 21 * 60 + 15, p));
      set(clock, `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
      set(phaseName, `${PHASES[active].no} ${PHASES[active].name}`);
      meter.forEach((m) => (m.style.transform = `scaleX(${p})`));
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* desktop sidebar */}
      <aside ref={root} className="hud hidden lg:flex" aria-label="Project progress">
        <a href="#top" aria-label="Ironridge — back to top">
          <Logo />
        </a>
        <p className="mono mt-2 text-[0.6rem] text-[var(--fg-mute)]">Constructions · Est. 1987</p>

        <div className="mt-12">
          <p className="mono mb-3 text-[0.6rem] text-[var(--fg-mute)]">Build sequence</p>
          <ol>
            {PHASES.map((ph) => (
              <li key={ph.no}>
                <a href={`#${ph.beat}`} data-phase className="hud-phase mono text-[0.66rem]">
                  <span className="dot" />
                  <span>{ph.name}</span>
                  <span className="opacity-60">{ph.no}</span>
                  <span className="bar">
                    <i />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <dl className="mono mt-auto grid grid-cols-2 gap-y-3 text-[0.62rem]">
          <dt className="text-[var(--fg-mute)]">Day</dt>
          <dd className="text-right tabular-nums" data-read="day">001</dd>
          <dt className="text-[var(--fg-mute)]">Site time</dt>
          <dd className="text-right tabular-nums" data-read="clock">05:40</dd>
          <dt className="text-[var(--fg-mute)]">Haul</dt>
          <dd className="text-right tabular-nums" data-read="haul">0.0 km</dd>
          <dt className="text-[var(--fg-mute)]">Floors</dt>
          <dd className="text-right tabular-nums" data-read="floors">00/12</dd>
        </dl>
        <div className="hazard mt-6 h-1.5 w-full opacity-80" />
      </aside>

      {/* top bar: menu on all sizes, logo + phase on mobile */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 lg:left-[var(--hud-w)] lg:px-8 lg:py-6">
        <a href="#top" className="lg:hidden" aria-label="Ironridge — back to top">
          <Logo />
        </a>
        <p className="mono hidden text-[var(--fg-mute)] lg:block">
          Site 014 · Riverside Tower · <span className="text-[var(--fg)]" data-read="phase">01 Mobilise</span>
        </p>
        <div className="flex items-center gap-3">
          <a href="#contact" className="btn btn-orange hidden !py-3 sm:inline-flex">
            Start a project
          </a>
          <button
            onClick={onMenu}
            className="btn btn-ghost !px-4 !py-3"
            aria-label="Open menu"
            aria-haspopup="dialog"
          >
            Menu
            <span className="flex flex-col gap-[3px]" aria-hidden="true">
              <i className="block h-px w-4 bg-current" />
              <i className="block h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </header>

      {/* mobile progress strip */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-[var(--line)] bg-[rgba(12,13,14,0.75)] px-4 py-2.5 backdrop-blur lg:hidden">
        <span className="mono text-[0.6rem]" data-read="phase">01 Mobilise</span>
        <span className="relative h-px flex-1 bg-[var(--line)]">
          <i data-read="meter" className="absolute inset-0 origin-left scale-x-0 bg-[var(--color-orange)]" />
        </span>
        <span className="mono text-[0.6rem] tabular-nums" data-read="floors">00/12</span>
      </div>
    </>
  );
}
