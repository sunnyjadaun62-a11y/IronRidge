"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muted background loop that never competes with the 3D world: it only
 * fetches when scrolled near, pauses off-screen, and stays a still poster for
 * reduced-motion or data-saver visitors. The video fades in over the poster
 * once it is actually playing.
 */
export default function AmbientVideo({ src, poster, className = "" }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setAllowed(true);
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster under the video */}
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <video
        ref={ref}
        src={allowed ? src : undefined}
        muted
        loop
        playsInline
        preload="none"
        onPlaying={() => setPlaying(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1.4s] ${playing ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
