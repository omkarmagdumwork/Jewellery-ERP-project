import { useSite } from "../context/SiteContext";

export default function Testimonials() {
  const { testimonials } = useSite();
  if (!testimonials.length) return null;

  return (
    <section className="bg-silver-100">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <h2 className="font-display text-3xl text-velvet-900 md:text-4xl">What customers say</h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {testimonials.slice(0, 6).map((t) => (
            <li key={t._id} className="border-l-2 border-gold-500 pl-5">
              <p className="text-gold-700">
                <span aria-hidden="true">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
                <span className="sr-only">{t.rating} out of 5</span>
              </p>
              <blockquote className="mt-2 font-display text-lg leading-snug text-ink">{t.text}</blockquote>
              <p className="mt-3 text-sm text-silver-600">{t.name}{t.place ? `, ${t.place}` : ""}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
