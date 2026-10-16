import { useEffect } from "react";
import { useSite } from "../context/SiteContext";

export default function usePageTitle(title) {
  const { settings } = useSite();
  useEffect(() => {
    document.title = title ? `${title} | ${settings.shopName}` : settings.shopName;
  }, [title, settings.shopName]);
}
