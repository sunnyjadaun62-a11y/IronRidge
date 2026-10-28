"use client";

import { useState } from "react";
import { COMPANY } from "@/lib/content";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = ["name", "email", "company", "type", "budget", "message"]
      .map((k) => `${k[0].toUpperCase() + k.slice(1)}: ${f.get(k) ?? ""}`)
      .join("\n");
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent("Project enquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section id="contact" data-beat="contact" className="relative px-5 pt-[20vh] pb-24 md:px-10 lg:pb-10">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="eyebrow">Phase 07 — Handover</p>
          <h2 data-reveal className="display mt-6 text-[14vw] md:text-[6.6vw]">
            Let&apos;s build
            <br />
            <span className="text-[var(--color-orange)]">yours.</span>
          </h2>
          <div className="mono mt-10 space-y-2 text-[var(--fg-mute)]">
            <p>
              <a href={`mailto:${COMPANY.email}`} className="text-[var(--fg)] hover:text-[var(--color-orange)]">
                {COMPANY.email}
              </a>
            </p>
            <p>{COMPANY.phone}</p>
            <p>{COMPANY.address}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} data-fade className="panel ticks p-6 md:col-span-6 md:p-9">
          <p className="mono text-[var(--color-orange)]">Project enquiry</p>
          <div className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <label className="sr-only" htmlFor="c-name">Name</label>
            <input id="c-name" name="name" required className="field" placeholder="Your name" autoComplete="name" />
            <label className="sr-only" htmlFor="c-email">Email</label>
            <input id="c-email" name="email" type="email" required className="field" placeholder="Email" autoComplete="email" />
            <label className="sr-only" htmlFor="c-company">Company</label>
            <input id="c-company" name="company" className="field" placeholder="Company" autoComplete="organization" />
            <label className="sr-only" htmlFor="c-type">Project type</label>
            <select id="c-type" name="type" className="field" defaultValue="">
              <option value="" disabled>Project type</option>
              <option>Commercial building</option>
              <option>Residential</option>
              <option>Roads &amp; highways</option>
              <option>Bridge / infrastructure</option>
              <option>Industrial / logistics</option>
            </select>
            <label className="sr-only" htmlFor="c-budget">Budget</label>
            <select id="c-budget" name="budget" className="field sm:col-span-2" defaultValue="">
              <option value="" disabled>Indicative budget</option>
              <option>Under ₹ 50 Cr</option>
              <option>₹ 50 – 200 Cr</option>
              <option>₹ 200 – 1,000 Cr</option>
              <option>₹ 1,000 Cr +</option>
            </select>
            <label className="sr-only" htmlFor="c-msg">Message</label>
            <textarea id="c-msg" name="message" rows={3} className="field resize-none sm:col-span-2" placeholder="Tell us about the site" />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-orange">
              Send enquiry <span className="arrow">→</span>
            </button>
            <p className="mono text-[0.6rem] text-[var(--fg-mute)]" aria-live="polite">
              {sent ? "Opening your mail app…" : "Reply within one working day"}
            </p>
          </div>
        </form>
      </div>

      <footer className="mt-[16vh]">
        <div className="hazard h-2 w-full opacity-90" />
        <div className="mono mt-6 flex flex-wrap justify-between gap-4 text-[0.6rem] text-[var(--fg-mute)]">
          <p>© 2026 {COMPANY.full}</p>
          <p>ISO 9001 · ISO 45001 · ISO 14001</p>
          <p>Built for the long haul</p>
        </div>
        <p className="footer-word display mt-8 overflow-hidden text-center text-[12.4vw] leading-[0.8] whitespace-nowrap lg:text-[calc((100vw-var(--hud-w))*0.138)]">
          Ironridge
        </p>
      </footer>
    </section>
  );
}
