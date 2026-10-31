import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useSite } from "../context/SiteContext";
import usePageTitle from "../hooks/usePageTitle";
import { optimizeImage } from "../utils";
import HeroSlider from "../components/HeroSlider";
import RateBoard from "../components/RateBoard";
import CategoryArches from "../components/CategoryArches";
import MetalPanels from "../components/MetalPanels";
import ProductGrid, { ProductGridSkeleton } from "../components/ProductGrid";
import CtaLink from "../components/CtaLink";
import Testimonials from "../components/Testimonials";

// Normalize product images across all backend data formats
function normalizeProductList(items = []) {
  return items.map((p) => {
    let rawImages = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      rawImages = p.images;
    } else if (p.imageUrl) {
      rawImages = [p.imageUrl];
    } else if (p.image?.url) {
      rawImages = [p.image.url];
    }

    const images = rawImages
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean);

    return {
      ...p,
      images,
      imageUrl: images[0] || "",
    };
  });
}

// Featured pieces first. If fewer than four are marked, show the newest instead.
function useShowcase() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let { data } = await api.get("/public/products", {
          params: { featured: "true", limit: 8 },
        });

        let list = data.products || data || [];

        if (list.length < 4) {
          const res = await api.get("/public/products", {
            params: { limit: 8 },
          });
          list = res.data.products || res.data || [];
        }

        if (!cancelled) {
          setProducts(normalizeProductList(list));
        }
      } catch (err) {
        console.error("Failed to load showcase products:", err);
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return products;
}

const REASONS = [
  {
    title: "Priced at today's rate",
    text: "Every price is worked out from the day's gold and silver rate, shown at the top of this page.",
  },
  {
    title: "Hallmark details",
    text: "Hallmark and HUID details are listed on the pieces that carry them.",
  },
  {
    title: "Old gold exchange",
    text: "Bring your old jewellery to the store and use its value towards a new piece.",
  },
  {
    title: "Ask us anything",
    text: "Call, message on WhatsApp or send an enquiry and we will get back to you.",
  },
];

export default function Home() {
  const { banners = [], settings = {} } = useSite();
  const products = useShowcase();
  const promos = Array.isArray(banners)
    ? banners.filter((b) => b.placement === "promo")
    : [];

  usePageTitle(settings?.shopName ? `${settings.shopName}` : "");

  return (
    <>
      <HeroSlider />
      <RateBoard />
      <CategoryArches />
      <MetalPanels />

      <section className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl  text-velvet-900 md:text-4xl">
            New and featured pieces
          </h2>
          <Link to="/collection" className="btn-outline-dark btn-sm">
            See all jewellery
          </Link>
        </div>
        <div className="mt-8">
          {products === null && <ProductGridSkeleton />}
          {products && products.length === 0 && (
            <p className="py-10 text-center text-silver-600">
              Our showcase is being updated. Please check back soon.
            </p>
          )}
          {products && products.length > 0 && (
            <ProductGrid products={products} />
          )}
        </div>
      </section>

      <Testimonials />

      {promos.length > 0 && (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2">
          {promos.map((b) => (
            <div
              key={b._id || b.title}
              className="relative min-h-56 overflow-hidden bg-velvet-900"
            >
              {b.image && (
                <img
                  src={optimizeImage ? optimizeImage(b.image, 1000) : b.image}
                  alt={b.title || ""}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-velvet-950/85 via-velvet-950/30 to-transparent" />
              <div className="relative flex min-h-56 flex-col justify-end p-6">
                <h3 className="font-display text-2xl text-white">{b.title}</h3>
                {b.subtitle && (
                  <p className="mt-1 text-silver-100">{b.subtitle}</p>
                )}
                {b.ctaText && b.ctaLink && (
                  <div className="mt-4">
                    <CtaLink to={b.ctaLink} className="btn-gold btn-sm">
                      {b.ctaText}
                    </CtaLink>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <h2 className="font-display text-3xl text-velvet-900 md:text-4xl">
          Why buy from us
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {REASONS.map((r) => (
            <div key={r.title} className="border-t border-gold-500 pt-4">
              <dt className="font-display text-xl text-ink">{r.title}</dt>
              <dd className="mt-1 max-w-md text-silver-600">{r.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {(settings.about || settings.address) && (
        <section className="bg-silver-100">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            {settings.about && (
              <div>
                <h2 className="font-display text-3xl text-velvet-900">
                  About {settings.shopName}
                </h2>
                <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">
                  {settings.about}
                </p>
              </div>
            )}
            {settings.address && (
              <div id="visit-store">
                <h2 className="font-display text-3xl text-velvet-900">
                  Visit the store
                </h2>
                <p className="mt-4 whitespace-pre-line">{settings.address}</p>
                {settings.workingHours && (
                  <p className="mt-2 text-silver-600">{settings.workingHours}</p>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {settings.mapUrl && (
                    <a
                      href={settings.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-velvet"
                    >
                      Open in Maps
                    </a>
                  )}
                  {settings.phone && (
                    <a href={`tel:${settings.phone}`} className="btn-outline-dark">
                      Call {settings.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}