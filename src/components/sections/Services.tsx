import Image from "next/image";
import { SERVICES } from "@/lib/content";

/**
 * Pinned: while the loader digs, a sidebar slides in from the right and
 * steps through the five service lines as you scroll.
 */
export default function Services() {
  return (
    <section id="dig" data-beat="dig" className="relative">
      <div className="svc-pin relative h-[100svh] overflow-hidden">
        <div className="absolute top-28 left-5 max-w-sm md:left-10">
          <p className="eyebrow">Phase 03 — Excavate</p>
          <h2 className="display mt-6 text-[14vw] md:text-[6.4vw]">
            What
            <br />
            we do
          </h2>
          <p className="mt-6 hidden max-w-xs text-[14px] leading-relaxed text-[var(--fg-mute)] md:block">
            Five disciplines under one roof — so the people who dig your foundations are the people who top out your
            tower.
          </p>
        </div>

        <aside className="svc-panel panel absolute top-0 right-0 bottom-0 flex w-full flex-col pt-24 sm:w-[min(500px,92vw)] lg:pt-28">
          <div className="relative mx-6 aspect-[4/3] overflow-hidden md:mx-8">
            {SERVICES.map((s, i) => (
              <div key={s.name} className="svc-img absolute inset-0" style={{ zIndex: i }}>
                <Image src={s.img} alt={s.name} fill loading="eager" sizes="(max-width: 640px) 90vw, 440px" className="object-cover" />
              </div>
            ))}
            <span className="mono absolute right-3 bottom-3 z-10 bg-black/60 px-2 py-1 text-[0.6rem]">
              <span className="svc-count">01</span> / 0{SERVICES.length}
            </span>
          </div>
          <ol className="mt-6 flex-1 overflow-hidden px-6 md:px-8">
            {SERVICES.map((s, i) => (
              <li key={s.name} className="svc-item border-t border-[var(--line)] py-4" data-i={i}>
                <div className="flex items-baseline gap-4">
                  <span className="mono text-[var(--fg-mute)]">0{i + 1}</span>
                  <h3 className="display-n text-xl md:text-2xl">{s.name}</h3>
                </div>
                <div className="svc-body grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-[var(--ease-out)]">
                  <div className="overflow-hidden">
                    <p className="pt-3 pl-9 text-[14px] leading-relaxed text-[var(--fg-mute)]">{s.body}</p>
                    <ul className="mono flex flex-wrap gap-2 pt-3 pl-9 text-[0.58rem]">
                      {s.tags.map((t) => (
                        <li key={t} className="border border-[var(--line)] px-2 py-1">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mx-6 mb-6 h-px bg-[var(--line)] md:mx-8">
            <div className="svc-progress h-px origin-left scale-x-0 bg-[var(--color-orange)]" />
          </div>
        </aside>
      </div>
    </section>
  );
}
