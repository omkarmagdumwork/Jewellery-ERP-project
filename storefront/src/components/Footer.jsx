import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";

export default function Footer() {
  const { settings } = useSite();

  return (
    <footer className="mt-20 bg-velvet-950 text-silver-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="gold-text font-display text-2xl">{settings.shopName}</p>
          {settings.tagline && <p className="mt-2 max-w-xs">{settings.tagline}</p>}
          {settings.gstin && <p className="mt-4 text-sm">GSTIN: {settings.gstin}</p>}
        </div>

        <div>
          <h2 className="font-display text-lg text-silver-100">Visit us</h2>
          <address className="mt-3 space-y-1 not-italic">
            {settings.address && <p>{settings.address}</p>}
            {settings.workingHours && <p>{settings.workingHours}</p>}
            {settings.phone && <p><a href={`tel:${settings.phone}`} className="hover:text-gold-300">{settings.phone}</a></p>}
            {settings.email && <p><a href={`mailto:${settings.email}`} className="hover:text-gold-300">{settings.email}</a></p>}
          </address>
        </div>

        <div>
          <h2 className="font-display text-lg text-silver-100">Browse</h2>
          <ul className="mt-3 space-y-1">
            <li><Link to="/collection?metal=Gold" className="hover:text-gold-300">Gold jewellery</Link></li>
            <li><Link to="/collection?metal=Silver" className="hover:text-gold-300">Silver jewellery</Link></li>
            <li><Link to="/collection" className="hover:text-gold-300">All jewellery</Link></li>
            <li><Link to="/contact" className="hover:text-gold-300">Contact</Link></li>
            {settings.instagram && <li><a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300">Instagram</a></li>}
            {settings.facebook && <li><a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300">Facebook</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-gold-700/30 py-4 text-center text-sm">
        &copy; {new Date().getFullYear()} {settings.shopName}. Prices shown are approximate. The final price is confirmed at the store.
      </div>
    </footer>
  );
}
