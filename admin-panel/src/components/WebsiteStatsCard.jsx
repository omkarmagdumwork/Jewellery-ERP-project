import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

// Drop into the Dashboard for admin and manager: <WebsiteStatsCard />
export default function WebsiteStatsCard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/cms/stats")
      .then(({ data }) => { if (!cancelled) setStats(data); })
      .catch(() => {}); // hidden for roles that cannot see it
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const items = [
    { label: "New enquiries", value: stats.newEnquiries, to: "/website/enquiries", warn: stats.newEnquiries > 0 },
    { label: "Products on website", value: stats.liveProducts, to: "/products" },
    { label: "Products without photos", value: stats.productsWithoutPhotos, to: "/products", warn: stats.productsWithoutPhotos > 0 },
    { label: "Active banners", value: stats.activeBanners, to: "/website/banners" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-medium mb-3">Website</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((i) => (
          <Link key={i.label} to={i.to} className="block rounded border p-3 hover:bg-gray-50">
            <p className="text-sm text-gray-500">{i.label}</p>
            <p className={`text-2xl font-bold ${i.warn ? "text-amber-700" : ""}`}>{i.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
