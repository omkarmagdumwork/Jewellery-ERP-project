import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useRates } from "../context/RateContext";

const ALL = ["admin", "manager", "salesman"];
const STAFF = ["admin", "manager"];

// section = a small heading, badge = a live count shown next to the label
const menu = [
  { to: "/", label: "Dashboard", roles: ALL },
  { to: "/rates", label: "Rates", roles: ALL },
  { to: "/products", label: "Inventory", roles: ALL },
  { to: "/customers", label: "Customers", roles: ALL },
  { to: "/billing", label: "Billing", roles: ALL },
  { to: "/invoices", label: "Invoices", roles: ALL },
  { to: "/suppliers", label: "Suppliers", roles: STAFF },
  { to: "/purchases", label: "Purchases", roles: STAFF },
  { to: "/reports", label: "Reports", roles: STAFF },
  { section: "Website", roles: STAFF },
  { to: "/website/banners", label: "Banners", roles: STAFF },
  { to: "/website/testimonials", label: "Testimonials", roles: STAFF },
  { to: "/website/enquiries", label: "Enquiries", roles: STAFF, badge: true },
  { to: "/website/settings", label: "Website settings", roles: STAFF },
];

// Address of the customer website, set in admin-panel/.env
const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL;

export default function Layout() {
  const { user, logout } = useAuth();
  const { latestRates } = useRates();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newEnquiries, setNewEnquiries] = useState(0);

  const isStaff = STAFF.includes(user.role);

  // Keep the Enquiries badge fresh while the admin panel is open
  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    const load = () =>
      api
        .get("/cms/stats")
        .then(({ data }) => { if (!cancelled) setNewEnquiries(data.newEnquiries || 0); })
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [isStaff]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visible = menu.filter((m) => m.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 text-white p-4 overflow-y-auto flex flex-col transform transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-lg font-bold mb-4">Jewellery ERP</h2>

        <nav className="space-y-1 flex-1">
          {visible.map((m) =>
            m.section ? (
              <p key={m.section} className="px-3 pt-5 pb-1 text-xs text-gray-400">{m.section}</p>
            ) : (
              <NavLink
                key={m.to}
                to={m.to}
                end={m.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded ${isActive ? "bg-amber-600" : "hover:bg-gray-700"}`
                }
              >
                <span>{m.label}</span>
                {m.badge && newEnquiries > 0 && (
                  <span className="bg-amber-500 text-gray-900 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {newEnquiries}
                  </span>
                )}
              </NavLink>
            )
          )}
        </nav>

        {STOREFRONT_URL && (
          <a href={STOREFRONT_URL} target="_blank" rel="noopener noreferrer"
            className="mt-4 block px-3 py-2 rounded border border-gray-600 text-center text-sm hover:bg-gray-700">
            View website
          </a>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow px-4 py-3 flex items-center gap-3">
          <button className="md:hidden text-2xl leading-none" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>

          <div className="flex-1 flex gap-4 text-sm text-gray-700 overflow-x-auto whitespace-nowrap">
            {latestRates.length === 0 && <span className="text-gray-400">Rate not set</span>}
            {latestRates.map((r) => (
              <span key={r._id}>
                {r.metal} {r.purity}: <b>₹{r.ratePerGram}</b>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm hidden sm:inline">{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="text-sm text-red-600">Logout</button>
          </div>
        </header>

        <main className="p-4 md:p-6 bg-gray-50 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
