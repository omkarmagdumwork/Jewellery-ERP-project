import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { useSite } from "../context/SiteContext";
import { useWishlist } from "../context/WishlistContext";
import usePageTitle from "../hooks/usePageTitle";
import { money, optimizeImage, purityLabel } from "../utils";
import ProductGrid from "../components/ProductGrid";
import EnquiryForm from "../components/EnquiryForm";
import { GemIcon, HeartIcon } from "../components/icons";

export default function ProductDetail() {
  const { id } = useParams();
  const { settings } = useSite();
  const { has, toggle } = useWishlist();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setNotFound(false);
    setSelected(0);
    api
      .get(`/public/products/${id}`)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id]);

  const product = data?.product;
  usePageTitle(product?.name || "");

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-velvet-900">This piece is no longer listed</h1>
        <p className="mt-3 text-silver-600">It may have been sold or removed from the website.</p>
        <Link to="/collection" className="btn-velvet mt-6">Browse all jewellery</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2" aria-busy="true">
        <div className="aspect-square animate-pulse bg-silver-200" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse bg-silver-200" />
          <div className="h-5 w-1/2 animate-pulse bg-silver-200" />
        </div>
      </div>
    );
  }

  // Normalize images across all possible format types (array of strings, array of objects, single string, or image object)
  const getNormalizedImages = (p) => {
    let list = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      list = p.images.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean);
    } else if (p.imageUrl) {
      list = [p.imageUrl];
    } else if (p.image?.url) {
      list = [p.image.url];
    }
    return list;
  };

  const images = getNormalizedImages(product);

  const specs = [
    ["Metal", product.metal],
    ["Purity", product.purity],
    ["Net weight", `${product.netWeight} g`],
    ["Gross weight", `${product.grossWeight} g`],
    product.stoneWeight > 0 ? ["Stone weight", `${product.stoneWeight} g`] : null,
    ["Hallmark", product.hallmarked ? "Hallmarked" : "Not listed"],
    product.huid ? ["HUID", product.huid] : null,
  ].filter(Boolean);

  const whatsapp = (settings.whatsapp || "").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hello, I am interested in ${product.name} (${purityLabel(product)}, ${product.netWeight} g).\n${window.location.href}`
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-silver-600">
        <Link to="/collection" className="hover:text-velvet-800">All jewellery</Link>
        <span className="mx-2">/</span>
        <Link to={`/collection?category=${product.category}`} className="hover:text-velvet-800">{product.category}</Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Main Product Gallery View */}
        <div>
          <div className="aspect-square overflow-hidden border border-silver-300 bg-silver-100">
            {images.length > 0 ? (
              <img 
                src={optimizeImage ? optimizeImage(images[selected], 1000) : images[selected]} 
                alt={product.name} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-b from-velvet-800 to-velvet-950 text-gold-400">
                <GemIcon className="h-20 w-20" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <li key={i}>
                  <button 
                    onClick={() => setSelected(i)} 
                    aria-label={`Show photo ${i + 1}`} 
                    aria-current={i === selected}
                    className={`block aspect-square w-full overflow-hidden border ${i === selected ? "border-gold-500" : "border-silver-300"}`}
                  >
                    <img 
                      src={optimizeImage ? optimizeImage(src, 200) : src} 
                      alt="" 
                      loading="lazy" 
                      className="h-full w-full object-cover" 
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Product Details Section */}
        <div>
          <h1 className="font-display text-4xl leading-tight text-velvet-900 md:text-5xl">{product.name}</h1>
          <p className="mt-2 text-lg text-silver-600">{purityLabel(product)}, {product.netWeight} g</p>

          {product.estimatedPrice ? (
            <div className="mt-6 border-y border-silver-300 py-4">
              <p className="font-display text-3xl text-velvet-800">{money(product.estimatedPrice)} <span className="text-base font-normal text-silver-600">approx.</span></p>
              <p className="mt-1 text-sm text-silver-600">
                Based on today's rate and includes GST. Stone value is not included. The final price is confirmed at the store.
              </p>
            </div>
          ) : (
            <p className="mt-6 border-y border-silver-300 py-4 text-silver-600">Ask us for today's price on this piece.</p>
          )}

          <p className={`mt-4 ${product.inStock ? "text-ink" : "text-[#b3261e]"}`}>
            {product.inStock ? "Available at the store" : "Currently sold out. Ask us if we can make it again."}
          </p>

          <dl className="mt-6 divide-y divide-silver-200 border-y border-silver-200">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-silver-600">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn-gold">
                Ask on WhatsApp
              </a>
            )}
            {settings.phone && <a href={`tel:${settings.phone}`} className="btn-outline-dark">Call the store</a>}
            <button type="button" onClick={() => toggle(product)} aria-pressed={has(product._id)} className="btn-outline-dark">
              <HeartIcon filled={has(product._id)} />
              {has(product._id) ? "Saved" : "Save this piece"}
            </button>
          </div>
        </div>
      </div>

      <section className="mt-16 max-w-xl" aria-labelledby="enquire">
        <h2 id="enquire" className="font-display text-2xl text-velvet-900">Send an enquiry about this piece</h2>
        <div className="mt-4"><EnquiryForm product={product} /></div>
      </section>

      {data.related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-velvet-900">More {product.category.toLowerCase()}s</h2>
          <div className="mt-6"><ProductGrid products={data.related} /></div>
        </section>
      )}
    </div>
  );
}