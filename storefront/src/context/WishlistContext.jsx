import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "jewellery-saved-pieces";
const MAX_ITEMS = 30;

// Saved pieces live in the visitor's own browser. No login, nothing is sent to the server.
function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const WishlistContext = createContext({ items: [], has: () => false, toggle: () => {}, remove: () => {}, clear: () => {} });

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Storage can be blocked (private mode). The list still works until the page closes.
    }
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      has: (id) => items.some((i) => i._id === id),
      toggle: (p) =>
        setItems((cur) =>
          cur.some((i) => i._id === p._id)
            ? cur.filter((i) => i._id !== p._id)
            : [
                ...cur,
                {
                  _id: p._id,
                  name: p.name,
                  metal: p.metal,
                  purity: p.purity,
                  netWeight: p.netWeight,
                  image: p.images?.[0] || "",
                },
              ].slice(-MAX_ITEMS)
        ),
      remove: (id) => setItems((cur) => cur.filter((i) => i._id !== id)),
      clear: () => setItems([]),
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
