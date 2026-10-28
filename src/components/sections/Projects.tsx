import Image from "next/image";
import { CLIENTS, PROJECTS } from "@/lib/content";
import AmbientVideo from "../AmbientVideo";

export default function Projects() {
  return (
    <section id="projects" data-beat="projects" className="relative">
      {/* fade from the world into solid ground */}
      <div className="pointer-events-none h-[40svh] bg-gradient-to-b from-transparent to-[var(--color-ink)]" />

      <div className="bg-[var(--color-ink)]">
        {/* pinned horizontal gallery */}
        <div className="proj-pin relative h-[100svh] overflow-hidden">
          {/* drone footage band behind the heading — the 3D world is hidden here anyway */}
          <div className="absolute inset-x-0 top-0 h-[54svh]">
            <AmbientVideo src="/video/drone-loop.mp4" poster="/video/drone-loop.jpg" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(18,19,20,0.55)] via-[rgba(18,19,20,0.45)] to-[var(--color-ink)]" />
          </div>
          <div className="absolute top-24 right-5 left-5 z-10 flex items-end justify-between md:right-10 md:left-10 lg:top-28">
            <div>
              <p className="eyebrow">Phase 06 — Portfolio</p>
              <h2 className="display mt-5 text-[13vw] md:text-[6vw]">Selected work</h2>
            </div>
            <p className="mono hidden text-[var(--fg-mute)] md:block">
              <span className="proj-count">01</span> / 0{PROJECTS.length}
            </p>
          </div>
          <div className="proj-track absolute bottom-16 left-0 z-10 flex gap-5 pr-[10vw] pl-5 md:gap-8 md:pl-10 lg:bottom-12">
            {PROJECTS.map((p, i) => (
              <a key={p.name} href="#contact" className="proj-card group block w-[78vw] shrink-0 sm:w-[46vw] lg:w-[34vw]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={p.img}
                    alt={`${p.name}, ${p.place}`}
                    fill
                    loading="eager"
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 34vw"
                    className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-out)] group-hover:scale-[1.05]"
                  />
                  <span className="mono absolute top-3 left-3 bg-[var(--color-orange)] px-2 py-1 text-[0.58rem] text-[var(--color-ink)]">
                    {String(i + 1).padStart(2, "0")} · {p.year}
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
                  <div>
                    <h3 className="display-n text-2xl md:text-3xl">{p.name}</h3>
                    <p className="mono mt-2 text-[0.6rem] text-[var(--fg-mute)]">
                      {p.place} · {p.type}
                    </p>
                  </div>
                  <p className="mono shrink-0 text-[0.62rem] text-[var(--color-orange)]">{p.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* about */}
        <div id="about" className="grid gap-12 px-5 py-[16vh] md:grid-cols-12 md:px-10">
          <div className="md:col-span-6">
            <p className="eyebrow">About Ironridge</p>
            <h2 data-reveal className="display-n mt-6 text-5xl md:text-[4.4vw]">
              Founded on a single highway contract in 1987. Still run by the people who pour the concrete.
            </h2>
            <figure data-fade className="mt-12 grid grid-cols-[88px_1fr] gap-5 border-t border-[var(--line)] pt-8">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src="/images/about-founder.jpg" alt="Ironridge's founding engineer on site" fill sizes="88px" className="object-cover" />
              </div>
              <div>
                <blockquote className="text-lg leading-snug md:text-xl">
                  &ldquo;We don&apos;t sub out the hard parts. If our name is on the hoarding, our crews are on the
                  slab.&rdquo;
                </blockquote>
                <figcaption className="mono mt-4 text-[0.6rem] text-[var(--fg-mute)]">
                  R. Deshpande — Founder &amp; Chief Engineer
                </figcaption>
              </div>
            </figure>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <div data-fade className="relative aspect-[3/2] overflow-hidden">
              <div className="about-img absolute -inset-y-[8%] inset-x-0">
                <Image src="/images/about-team.jpg" alt="Ironridge engineers reviewing drawings on site" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
              </div>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-4">
              {[
                ["38", "Years"],
                ["2400", "Crew"],
                ["186", "Handovers"],
              ].map(([n, l]) => (
                <div key={l} className="flex flex-col-reverse border-t border-[var(--line)] pt-3">
                  <dt className="mono mt-1 text-[0.58rem] text-[var(--fg-mute)]">{l}</dt>
                  <dd className="display text-3xl md:text-4xl" data-count={n}>0</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* clients marquee */}
        <div className="overflow-hidden border-y border-[var(--line)] py-6">
          <div className="marquee flex w-max gap-14 whitespace-nowrap">
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={i} className="display-n flex items-center gap-14 text-3xl text-[var(--fg-mute)] md:text-4xl">
                {c}
                <span className="h-2 w-2 rotate-45 bg-[var(--color-orange)]" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* fade back out into the night scene */}
      <div className="pointer-events-none h-[40svh] bg-gradient-to-t from-transparent to-[var(--color-ink)]" />
    </section>
  );
}
