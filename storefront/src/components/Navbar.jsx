import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { useWishlist } from "../context/WishlistContext";
import { MenuIcon, CloseIcon } from "./icons";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Gold", to: "/collection?metal=Gold" },
  { label: "Silver", to: "/collection?metal=Silver" },
  { label: "All jewellery", to: "/collection" },
  { label: "Saved", to: "/wishlist" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const { settings } = useSite();
  const { items } = useWishlist();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after any navigation
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  const isActive = (to) => {
    const url = new URL(to, "http://local");
    if (url.pathname !== location.pathname) return false;
    if (url.pathname !== "/collection") return true;
    const current = new URLSearchParams(location.search).get("metal") || "";
    return (url.searchParams.get("metal") || "") === current;
  };

  const labelFor = (l) => (l.to === "/wishlist" && items.length > 0 ? `Saved (${items.length})` : l.label);

  const linkClass = (to) =>
    `block px-3 py-2 transition-colors ${isActive(to) ? "text-gold-300" : "text-silver-100 hover:text-gold-300"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-gold-700/40 bg-velvet-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="gold-text font-display text-2xl leading-none">
          {settings.shopName}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)} aria-current={isActive(l.to) ? "page" : undefined}>
              {labelFor(l)}
            </Link>
          ))}
          {settings.phone && (
            <a href={`tel:${settings.phone}`} className="btn-gold btn-sm ml-3">Call us</a>
          )}
        </nav>

        <button
          className="p-2 text-gold-300 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-gold-700/40 bg-velvet-900 px-4 pb-4 pt-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`${linkClass(l.to)} text-lg`}>{labelFor(l)}</Link>
          ))}
          {settings.phone && (
            <a href={`tel:${settings.phone}`} className="btn-gold mt-3 w-full">Call us</a>
          )}
        </nav>
      )}
    </header>
  );
}
