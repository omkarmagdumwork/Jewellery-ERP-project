import { Link } from "react-router-dom";

// Two brushed metal panels: this is where the site's gold and silver identity is loudest
export default function MetalPanels() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2">
      <div className="gold-panel brushed flex min-h-64 flex-col justify-end p-8 md:min-h-80">
        <h2 className="font-display text-3xl text-velvet-950 md:text-4xl">Gold jewellery</h2>
        <p className="mt-2 max-w-sm text-velvet-900">
          Rings, chains, bangles and more in 24K, 22K and 18K, priced at today's rate.
        </p>
        <div className="mt-5">
          <Link to="/collection?metal=Gold" className="btn-velvet">Shop gold</Link>
        </div>
      </div>

      <div className="silver-panel brushed flex min-h-64 flex-col justify-end p-8 md:min-h-80">
        <h2 className="font-display text-3xl text-ink md:text-4xl">Silver jewellery</h2>
        <p className="mt-2 max-w-sm text-ink">
          Pure 999 and 925 sterling silver for everyday wear and gifting.
        </p>
        <div className="mt-5">
          <Link to="/collection?metal=Silver" className="btn-velvet">Shop silver</Link>
        </div>
      </div>
    </section>
  );
}
