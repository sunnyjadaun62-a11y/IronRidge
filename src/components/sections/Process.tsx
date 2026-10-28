import { PROCESS } from "@/lib/content";

/** Over the blueprint scan: the method, drawn as a technical timeline. */
export default function Process() {
  return (
    <section id="blueprint" data-beat="blueprint" className="relative h-[260svh] px-5 md:px-10">
      <div className="proc-pin sticky top-0 flex h-[100svh] flex-col justify-center py-24">
        <p className="eyebrow">Phase 05 — Engineer</p>
        <h2 className="display mt-6 max-w-4xl text-[11vw] text-[var(--color-cyan)] md:text-[5.6vw]">
          Drawn twice.
          <br />
          Built once.
        </h2>

        <div className="relative mt-14">
          <div className="absolute top-[7px] right-0 left-0 hidden h-px bg-[rgba(140,217,255,0.2)] md:block">
            <div className="proc-line h-px origin-left scale-x-0 bg-[var(--color-cyan)]" />
          </div>
          <ol className="grid gap-6 md:grid-cols-5 md:gap-8">
            {PROCESS.map((s) => (
              <li key={s.no} className="proc-step">
                <span className="relative z-10 block h-[15px] w-[15px] rotate-45 border border-[var(--color-cyan)] bg-[var(--color-blueprint)]" />
                <p className="mono mt-5 text-[var(--color-cyan)]">{s.no}</p>
                <h3 className="display-n mt-2 text-2xl">{s.name}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[rgba(220,238,255,0.7)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
