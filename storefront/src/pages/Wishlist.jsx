import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { useWishlist } from "../context/WishlistContext";
import usePageTitle from "../hooks/usePageTitle";
import { optimizeImage, purityLabel } from "../utils";
import EnquiryForm from "../components/EnquiryForm";
import { GemIcon } from "../components/icons";

export default function Wishlist() {
  usePageTitle("Saved pieces");
  const { settings } = useSite();
  const { items, remove, clear } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-velvet-900">No saved pieces yet</h1>
        <p className="mt-3 text-silver-600">Tap the heart on any piece to keep it here and enquire about several at once.</p>
        <Link to="/collection" className="btn-velvet mt-6">Browse jewellery</Link>
      </div>
    );
  }

  const list = items.map((i, n) => `${n + 1}. ${i.name} (${purityLabel(i)}, ${i.netWeight} g)`).join("\n");
  const links = items.map((i) => `${window.location.origin}/product/${i._id}`).join("\n");
  const whatsapp = (settings.whatsapp || "").replace(/\D/g, "");
  const waText = encodeURIComponent(`Hello, I would like to know more about these pieces:\n${list}\n\n${links}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-velvet-900 md:text-5xl">Saved pieces</h1>
          <p className="mt-2 text-silver-600">Saved on this device only. {items.length} {items.length === 1 ? "piece" : "pieces"}.</p>
        </div>
        <button onClick={clear} className="btn-outline-dark btn-sm">Clear all</button>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {items.map((i) => (
          <li key={i._id}>
            <Link to={`/product/${i._id}`} className="block">
              <div className="aspect-square overflow-hidden border border-silver-300 bg-silver-100">
                {i.image ? (
                  <img src={optimizeImage(i.image, 600)} alt={i.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-gradient-to-b from-velvet-800 to-velvet-950 text-gold-400">
                    <GemIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <h2 className="mt-3 font-display text-lg leading-snug text-ink">{i.name}</h2>
              <p className="text-sm text-silver-600">{purityLabel(i)}, {i.netWeight} g</p>
            </Link>
            <button onClick={() => remove(i._id)} className="mt-1 text-sm text-velvet-800 underline">Remove</button>
          </li>
        ))}
      </ul>

      <section className="mt-16 max-w-xl" aria-labelledby="send-list">
        <h2 id="send-list" className="font-display text-2xl text-velvet-900">Ask about these pieces</h2>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4">
            Send the list on WhatsApp
          </a>
        )}
        <div className="mt-6">
          <EnquiryForm defaultMessage={`I would like to know more about these pieces:\n${list}`} />
        </div>
      </section>
    </div>
  );
}
