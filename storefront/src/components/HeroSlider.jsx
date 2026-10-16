import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { optimizeImage } from "../utils";
import CtaLink from "./CtaLink";
import { ChevronIcon } from "./icons";

// Shown until the admin adds a hero banner
function FallbackHero() {
  const { settings } = useSite();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-velvet-950 via-velvet-900 to-velvet-800">
      {/* A ring, drawn in two gold strokes */}
      <svg aria-hidden="true" viewBox="0 0 400 400" className="absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 text-gold-400/50 md:right-10">
        <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="6" />
        <circle cx="200" cy="200" r="148" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M200 20l26 34h-52z" fill="currentColor" />
      </svg>
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
        <h1 className="max-w-2xl font-display text-4xl leading-tight text-white md:text-6xl">
          {settings.tagline || "Gold and silver jewellery, priced at today's rate"}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/collection" className="btn-gold">Browse jewellery</Link>
          <Link to="/contact" className="btn-outline">Visit the store</Link>
        </div>
      </div>
    </section>
  );
}

export default function HeroSlider() {
  const { banners } = useSite();
  const slides = banners.filter((b) => b.placement === "hero");
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = count ? index % count : 0;

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const prev = useCallback(() => setIndex((i) => i + count - 1), [count]);

  // Auto advance, unless the visitor prefers reduced motion or is hovering
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [count, paused, next]);

  if (count === 0) return <FallbackHero />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative h-[420px] overflow-hidden bg-velvet-900 sm:h-[480px] lg:h-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s._id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <img
            src={optimizeImage(s.image, 1600)}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority={i === 0 ? "high" : "auto"}
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-velvet-950/85 via-velvet-950/45 to-transparent" />
          <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-14 md:justify-center md:pb-0">
            <h2 className="max-w-2xl font-display text-4xl leading-tight text-white md:text-6xl">{s.title}</h2>
            {s.subtitle && <p className="mt-3 max-w-xl text-lg text-silver-100">{s.subtitle}</p>}
            {s.ctaText && s.ctaLink && (
              <div className="mt-6">
                <CtaLink to={s.ctaLink} className="btn-gold">{s.ctaText}</CtaLink>
              </div>
            )}
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button onClick={prev} aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-silver-300/60 bg-velvet-950/50 p-2 text-silver-100 hover:bg-velvet-950/80 md:block">
            <ChevronIcon direction="left" />
          </button>
          <button onClick={next} aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-silver-300/60 bg-velvet-950/50 p-2 text-silver-100 hover:bg-velvet-950/80 md:block">
            <ChevronIcon />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button key={s._id} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-gold-400" : "w-2 bg-silver-300/70"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
