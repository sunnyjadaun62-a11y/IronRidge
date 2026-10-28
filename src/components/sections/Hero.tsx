export default function Hero() {
  return (
    <section id="hero" data-beat="hero" className="relative flex h-[100svh] flex-col justify-end px-5 pt-24 pb-16 md:px-10 lg:pb-12">
      <p className="hero-fade eyebrow">Infrastructure · Commercial · Since 1987</p>
      <h1 className="hero-title display mt-6 text-[17vw] md:text-[10.5vw] lg:text-[8.8vw]">
        <span className="line-mask"><span className="hero-line block">We build</span></span>
        <span className="line-mask"><span className="hero-line block">what <span className="text-[var(--color-orange)]">holds.</span></span></span>
      </h1>
      <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
        <p className="hero-fade max-w-md text-[15px] leading-relaxed text-[var(--fg-mute)] md:col-span-5">
          Highways, bridges, towers and campuses. Ironridge surveys, hauls, excavates and frames the structures
          cities grow around — with our own fleet, our own crews, and one accountable team.
        </p>
        <div className="hero-fade flex flex-wrap gap-3 md:col-span-4">
          <a href="#contact" className="btn btn-orange">
            Start a project <span className="arrow">→</span>
          </a>
          <a href="#haul" className="btn btn-ghost">
            Watch the build <span className="arrow">↓</span>
          </a>
        </div>
        <dl className="hero-fade mono hidden text-[0.62rem] leading-relaxed text-[var(--fg-mute)] md:col-span-3 md:block md:text-right">
          <dt className="sr-only">Site</dt>
          <dd className="text-[var(--fg)]">Site 014 — Riverside Tower</dd>
          <dt className="sr-only">Coordinates</dt>
          <dd>18.5204° N, 73.8567° E</dd>
          <dd>Scroll to build ↓</dd>
        </dl>
      </div>
    </section>
  );
}
