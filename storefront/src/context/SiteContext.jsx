import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const defaults = {
  shopName: "Jewellery",
  tagline: "",
  announcement: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  workingHours: "",
  mapUrl: "",
  about: "",
  instagram: "",
  facebook: "",
  gstin: "",
  showRates: true,
  showPrices: false,
};

const initial = { settings: defaults, banners: [], rates: [], testimonials: [], loading: true, error: "" };
const SiteContext = createContext(initial);

// Loads shop settings, banners and today's rates once for the whole site
export function SiteProvider({ children }) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/public/site")
      .then(({ data }) => {
        if (cancelled) return;
        setState({
          settings: { ...defaults, ...data.settings },
          banners: data.banners || [],
          rates: data.rates || [],
          testimonials: data.testimonials || [],
          loading: false,
          error: "",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: "We could not load the shop details. Please refresh the page." }));
      });
    return () => { cancelled = true; };
  }, []);

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
