"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { COMPANY, PHASES } from "@/lib/content";
import { Mark } from "./Logo";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#dig", label: "Services" },
  { href: "#blueprint", label: "Process" },
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

/** Right-hand slide-in sidebar navigation. */
export default function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`drawer ${open ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer-panel">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-10">
          <span className="mono text-black/50">Index</span>
          <button ref={closeBtn} onClick={onClose} className="mono flex items-center gap-3" aria-label="Close menu">
            Close
            <span className="relative block h-4 w-4" aria-hidden="true">
              <i className="absolute top-1/2 left-0 block h-px w-4 rotate-45 bg-current" />
              <i className="absolute top-1/2 left-0 block h-px w-4 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8 md:px-10" data-lenis-prevent>
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={onClose}
                  className="drawer-link display text-[13vw] sm:text-6xl"
                  style={{ transitionDelay: open ? `${0.12 + i * 0.05}s` : "0s" }}
                >
                  <span className="mono text-[0.65rem] text-black/40">0{i + 1}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid grid-cols-[96px_1fr] gap-5">
            <div className="relative aspect-square overflow-hidden bg-black/10">
              <Image src="/images/about-detail.jpg" alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div className="mono space-y-1.5 text-[0.65rem] leading-relaxed text-black/60">
              <p className="text-black">{COMPANY.full}</p>
              <p>{COMPANY.address}</p>
              <p>
                <a href={`mailto:${COMPANY.email}`} className="hover:text-[var(--color-orange)]">{COMPANY.email}</a>
              </p>
              <p>{COMPANY.phone}</p>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4 md:px-10">
          <Mark className="h-6 w-6 text-black" />
          <p className="mono text-[0.6rem] text-black/50">{PHASES.length} phases · 1 accountable team</p>
        </div>
      </div>
    </div>
  );
}
