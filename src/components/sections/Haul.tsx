const CARDS = [
  {
    no: "02.1",
    title: "Our own fleet.",
    body: "140 haulers, 38 tower cranes and 220 pieces of earth-moving plant — owned, maintained and dispatched by us. No rental queues between the plan and the pour.",
    pos: "md:ml-auto md:mr-[4vw]",
  },
  {
    no: "02.2",
    title: "Timed to the hour.",
    body: "Every load is sequenced against the crane schedule. Steel arrives the morning it's lifted — never the week before, never the hour after.",
    pos: "md:ml-[2vw]",
  },
];

export default function Haul() {
  return (
    <section id="haul" data-beat="haul" className="relative px-5 pt-[55svh] pb-[45svh] md:px-10">
      <p data-fade className="eyebrow">Phase 02 — Haul</p>
      <div className="mt-8 space-y-[75svh]">
        {CARDS.map((c) => (
          <article key={c.no} data-fade className={`panel ticks max-w-md p-7 md:p-9 ${c.pos}`}>
            <p className="mono text-[var(--color-orange)]">{c.no}</p>
            <h2 className="display-n mt-4 text-4xl md:text-5xl">{c.title}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--fg-mute)]">{c.body}</p>
          </article>
        ))}
        <div data-fade className="md:ml-auto md:mr-[4vw] md:max-w-xl md:text-right">
          <p className="display text-[22vw] leading-none md:text-[11vw]">
            <span data-count="2.4" data-decimals="1">0</span>M
          </p>
          <p className="mono mt-3 text-[var(--fg-mute)]">Tonnes of material moved last year</p>
        </div>
      </div>
    </section>
  );
}
