import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { optimizeImage } from "../utils";
import { GemIcon } from "./icons";

// Used until the admin adds category banners with photos
const DEFAULTS = [
  { _id: "Ring", title: "Rings", ctaLink: "/collection?category=Ring" },
  { _id: "Chain", title: "Chains", ctaLink: "/collection?category=Chain" },
  { _id: "Bangle", title: "Bangles", ctaLink: "/collection?category=Bangle" },
  { _id: "Earring", title: "Earrings", ctaLink: "/collection?category=Earring" },
  { _id: "Necklace", title: "Necklaces", ctaLink: "/collection?category=Necklace" },
];

export default function CategoryArches() {
  const { banners } = useSite();
  const custom = banners.filter((b) => b.placement === "category");
  const tiles = custom.length > 0 ? custom : DEFAULTS;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:py-20">
      <h2 className="font-display text-3xl text-velvet-900 md:text-4xl">Shop by category</h2>
      <p className="mt-2 text-silver-600">Rings, chains, bangles, earrings and necklaces.</p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t._id} to={t.ctaLink || "/collection"} className="group block">
            <div className="aspect-[4/5] overflow-hidden rounded-t-full border border-silver-300 bg-gradient-to-b from-velvet-800 to-velvet-950">
              {t.image ? (
                <img src={optimizeImage(t.image, 500)} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-gold-400">
                  <GemIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <span className="mt-3 block text-center font-display text-lg text-ink group-hover:text-velvet-800">
              {t.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
