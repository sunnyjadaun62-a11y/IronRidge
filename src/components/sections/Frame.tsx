const STATS = [
  { n: "12", label: "Floors framed", suffix: "" },
  { n: "41", label: "Days to top-out", suffix: "" },
  { n: "1840", label: "Tonnes of steel", suffix: "t" },
  { n: "0", label: "Lost-time incidents", suffix: "" },
];

export default function Frame() {
  return (
    <section id="frame" data-beat="frame" className="relative h-[320svh] px-5 md:px-10">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end pb-20 lg:pb-12">
        <p className="eyebrow">Phase 04 — Frame</p>
        <h2 className="frame-title display mt-6 text-[13vw] md:text-[7.4vw]">
          Steel. Concrete.
          <br />
          <span className="text-[var(--color-orange)]">Certainty.</span>
        </h2>
      </div>
      <div className="absolute top-[110svh] right-5 left-5 md:right-10 md:left-auto md:w-[min(440px,40vw)]">
        <div data-fade className="panel ticks p-7 md:p-8">
          <p className="mono text-[var(--color-orange)]">Riverside Tower · structural record</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse border-t border-[var(--line)] pt-4">
                <dt className="mono mt-2 text-[0.6rem] text-[var(--fg-mute)]">{s.label}</dt>
                <dd className="display text-4xl xl:text-5xl">
                  <span data-count={s.n}>0</span>
                  {s.suffix && <span className="ml-1 text-xl text-[var(--fg-mute)]">{s.suffix}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 text-[14px] leading-relaxed text-[var(--fg-mute)]">
            A four-day floor cycle with self-climbing core formwork. The crane you&apos;re watching lifts 6.4 tonnes at
            a 46-metre reach.
          </p>
        </div>
      </div>
    </section>
  );
}
