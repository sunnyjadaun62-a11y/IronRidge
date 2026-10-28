"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { BEATS, stage, type Beat } from "@/lib/stage";
import { clamp } from "@/lib/anim";
import SceneCanvas from "./SceneCanvas";
import Hud from "./Hud";
import Menu from "./Menu";
import Hero from "./sections/Hero";
import Haul from "./sections/Haul";
import Services from "./sections/Services";
import Frame from "./sections/Frame";
import Process from "./sections/Process";
import Projects from "./sections/Projects";
import Contact from "./sections/Contact";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  const loadTarget = useRef(0);
  const [menu, setMenu] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  const onProgress = useCallback((f: number) => {
    loadTarget.current = Math.max(loadTarget.current, f);
  }, []);
  const openMenu = useCallback(() => setMenu(true), []);
  const closeMenu = useCallback(() => setMenu(false), []);

  useEffect(() => {
    if (menu) lenisRef.current?.stop();
    else if (stage.ready) lenisRef.current?.start();
  }, [menu]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // dev aid: ?scene hides the HTML layer to inspect the 3D world
    if (new URLSearchParams(location.search).has("scene")) document.documentElement.classList.add("scene-only");
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    /* ------------------------------------------------ smooth scroll */
    const lenis = reduce ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.85 });
    lenisRef.current = lenis;
    const onTick = (t: number) => lenis?.raf(t * 1000);
    if (lenis) {
      lenis.on("scroll", (l: Lenis) => {
        stage.velocity = l.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    } else {
      document.documentElement.style.overflow = "hidden";
    }

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const target = a.getAttribute("href")!;
      const el = target === "#top" ? document.body : document.querySelector<HTMLElement>(target);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target === "#top" ? 0 : el, { duration: 2.4 });
      else el.scrollIntoView();
    };
    document.addEventListener("click", onAnchor);

    const onPointer = (e: PointerEvent) => {
      stage.px = (e.clientX / window.innerWidth) * 2 - 1;
      stage.py = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const ctx = gsap.context(() => {
      /* ------------------------------------------------ reticle cursor */
      const ret = document.querySelector<HTMLElement>(".reticle")!;
      const dot = document.querySelector<HTMLElement>(".reticle-dot")!;
      const rx = gsap.quickTo(ret, "x", { duration: 0.45, ease: "power3" });
      const ry = gsap.quickTo(ret, "y", { duration: 0.45, ease: "power3" });
      const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
      const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
      const move = (e: PointerEvent) => {
        rx(e.clientX);
        ry(e.clientY);
        dx(e.clientX);
        dy(e.clientY);
        ret.classList.toggle("is-hover", !!(e.target as HTMLElement).closest("a, button, input, select, textarea"));
      };
      window.addEventListener("pointermove", move);

      /* ------------------------------------------------ loader → hero */
      gsap.set(".hero-line", { yPercent: 110 });
      gsap.set(".hero-fade", { autoAlpha: 0, y: 24 });
      const shown = { v: 0 };
      const countEl = document.querySelector(".loader-count");
      const barEl = document.querySelector<HTMLElement>(".loader-bar");
      const started = performance.now();
      let lifted = false;
      const lift = () => {
        if (lifted) return;
        lifted = true;
        gsap.ticker.remove(loadTick);
        gsap
          .timeline()
          .to(".loader-inner", { autoAlpha: 0, y: -20, duration: 0.5 })
          .to(".loader", { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=0.1")
          .add(() => {
            stage.ready = true;
            if (lenis) lenis.start();
            else document.documentElement.style.overflow = "";
          }, "-=0.6")
          .to(".hero-line", { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12 }, "-=0.6")
          .to(".hero-fade", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, "-=1");
      };
      const loadTick = () => {
        shown.v += (loadTarget.current - shown.v) * 0.08;
        if (countEl) countEl.textContent = String(Math.round(shown.v * 100)).padStart(3, "0");
        if (barEl) barEl.style.transform = `scaleX(${shown.v})`;
        const elapsed = performance.now() - started;
        if ((shown.v > 0.985 && elapsed > 1200) || elapsed > 12000) lift();
      };
      gsap.ticker.add(loadTick);

      /* ------------------------------------------------ generic reveals */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 105,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 40,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const dec = Number(el.dataset.decimals ?? 0);
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString("en-IN");
          },
        });
      });

      /* ------------------------------------------------ services sidebar (pinned) */
      const items = gsap.utils.toArray<HTMLElement>(".svc-item");
      const imgs = gsap.utils.toArray<HTMLElement>(".svc-img");
      const svcCount = document.querySelector(".svc-count");
      gsap.set(imgs.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      let svcActive = -1;
      const setSvc = (i: number) => {
        if (i === svcActive) return;
        svcActive = i;
        items.forEach((el, k) => el.classList.toggle("is-active", k === i));
        if (svcCount) svcCount.textContent = String(i + 1).padStart(2, "0");
      };
      setSvc(0);
      const svc = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: ".svc-pin",
          start: "top top",
          end: "+=280%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const t = clamp((self.progress - 0.12) / 0.82);
            setSvc(Math.min(Math.floor(t * items.length), items.length - 1));
          },
        },
      });
      svc.from(".svc-panel", { xPercent: 105, duration: 0.6 });
      imgs.slice(1).forEach((img) => {
        svc
          .to(img, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6 }, "+=0.4")
          .fromTo(img.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 0.8 }, "<");
      });
      svc.to(".svc-progress", { scaleX: 1, duration: svc.duration(), ease: "none" }, 0);
      svc.to({}, { duration: 0.4 });

      /* ------------------------------------------------ frame headline */
      gsap.from(".frame-title", {
        autoAlpha: 0,
        y: 60,
        ease: "power3.out",
        scrollTrigger: { trigger: "#frame", start: "top 60%", end: "top 10%", scrub: 1 },
      });

      /* ------------------------------------------------ process timeline */
      const proc = gsap.timeline({
        scrollTrigger: { trigger: "#blueprint", start: "top 30%", end: "bottom bottom", scrub: 1 },
      });
      proc
        .from("#blueprint .eyebrow, #blueprint h2", { autoAlpha: 0, y: 40, stagger: 0.1, duration: 0.4 })
        .to(".proc-line", { scaleX: 1, ease: "none", duration: 1.2 }, 0.2)
        .from(".proc-step", { autoAlpha: 0, y: 30, stagger: 0.22, duration: 0.3 }, 0.2)
        .to("#blueprint .proc-pin", { autoAlpha: 0, duration: 0.25 }, "+=0.3");

      /* ------------------------------------------------ projects: horizontal pinned track */
      const tr = document.querySelector<HTMLElement>(".proj-track")!;
      const cards = gsap.utils.toArray<HTMLElement>(".proj-card");
      const projCount = document.querySelector(".proj-count");
      const dist = () => Math.max(tr.scrollWidth - window.innerWidth, 0);
      gsap.to(tr, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: ".proj-pin",
          start: "top top",
          end: () => `+=${dist() + window.innerHeight * 0.3}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const i = Math.min(Math.round(self.progress * (cards.length - 1)), cards.length - 1);
            if (projCount) projCount.textContent = String(i + 1).padStart(2, "0");
          },
        },
      });
      gsap.fromTo(
        ".about-img",
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: ".about-img", start: "top bottom", end: "bottom top", scrub: true },
        },
      );

      /* ------------------------------------------------ footer wordmark */
      const word = SplitText.create(".footer-word", { type: "chars" });
      gsap.from(word.chars, {
        yPercent: 100,
        stagger: 0.04,
        ease: "expo.out",
        duration: 1.4,
        scrollTrigger: { trigger: ".footer-word", start: "top 98%" },
      });

      /* ------------------------------------------------ scroll → world progress */
      // created last so every pin spacer above is already measured
      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]").map((sec, i, all) => {
        const key = sec.dataset.beat as Beat;
        const last = i === all.length - 1;
        const nextToLast = i === all.length - 2;
        const st = ScrollTrigger.create({
          trigger: sec,
          start: last ? "top bottom" : "top top",
          end: last || nextToLast ? "bottom bottom" : "bottom top",
        });
        return { st, range: BEATS[key] };
      });
      const sync = () => {
        const y = lenis ? lenis.scroll : window.scrollY;
        for (let i = 0; i < beats.length; i++) {
          const { st, range } = beats[i];
          if (y <= st.end || i === beats.length - 1) {
            const f = clamp((y - st.start) / Math.max(st.end - st.start, 1));
            stage.progress = range[0] + (range[1] - range[0]) * f;
            break;
          }
        }
        if (!lenis) stage.velocity = 0;
      };
      gsap.ticker.add(sync);

      return () => {
        window.removeEventListener("pointermove", move);
        gsap.ticker.remove(sync);
        gsap.ticker.remove(loadTick);
      };
    }, root);

    // fonts change line metrics → re-measure pins
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      document.removeEventListener("click", onAnchor);
      window.removeEventListener("pointermove", onPointer);
      if (lenis) {
        gsap.ticker.remove(onTick);
        lenis.destroy();
      }
      lenisRef.current = null;
    };
  }, []);

  return (
    <div ref={root}>
      <SceneCanvas onProgress={onProgress} />
      <div className="world-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="reticle" aria-hidden="true" />
      <div className="reticle-dot" aria-hidden="true" />

      {/* ---------------------------------------------------------- loader */}
      <div className="loader fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-ink)]">
        <div className="loader-inner w-[min(360px,76vw)]">
          <div className="flex items-end justify-between">
            <p className="display text-3xl">Ironridge</p>
            <p className="loader-count display text-3xl tabular-nums text-[var(--color-orange)]">000</p>
          </div>
          <div className="mt-5 h-[3px] w-full bg-white/10">
            <div className="loader-bar h-full origin-left scale-x-0 bg-[var(--color-orange)]" />
          </div>
          <p className="mono mt-4 text-[0.6rem] text-[var(--fg-mute)]">Surveying site · loading fleet</p>
        </div>
      </div>

      <Hud onMenu={openMenu} />
      <Menu open={menu} onClose={closeMenu} />

      <main className="with-hud">
        <Hero />
        <Haul />
        <Services />
        <Frame />
        <Process />
        <Projects />
        <Contact />
      </main>
    </div>
  );
}
