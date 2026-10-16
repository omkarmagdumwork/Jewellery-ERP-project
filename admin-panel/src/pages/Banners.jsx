import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { PageLoader, LoadingButton } from "../components/Spinner";

const PLACEMENTS = [
  { key: "hero", label: "Hero slider", hint: "Large banner at the top of the home page. Use a wide image, about 1920 x 800 px." },
  { key: "category", label: "Category tiles", hint: "Arch shaped tiles below the rates. Use a portrait image, about 800 x 1000 px." },
  { key: "promo", label: "Promotions", hint: "Wide offer banners near the bottom of the home page, about 1200 x 600 px." },
];

const CATEGORIES = { Ring: "Rings", Chain: "Chains", Bangle: "Bangles", Earring: "Earrings", Necklace: "Necklaces" };
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function BannerModal({ banner, placement, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: banner?.title || "",
    subtitle: banner?.subtitle || "",
    ctaText: banner?.ctaText || "",
    ctaLink: banner?.ctaLink || "",
    order: banner?.order ?? 0,
    isActive: banner?.isActive ?? true,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(banner?.image?.url || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Free the temporary preview URL when it changes or the modal closes
  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return setErrors((p) => ({ ...p, image: "Use a JPG, PNG or WebP image" }));
    if (f.size > MAX_SIZE) return setErrors((p) => ({ ...p, image: "Image must be smaller than 5 MB" }));
    setErrors((p) => ({ ...p, image: undefined }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // For category tiles, picking a category fills the title and the link
  const pickCategory = (e) => {
    const key = e.target.value;
    if (!key) return;
    setForm((f) => ({ ...f, title: CATEGORIES[key], ctaLink: `/collection?category=${key}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!banner && !file) errs.image = "Choose an image";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const fd = new FormData();
    Object.entries({ ...form, placement, isActive: String(form.isActive) }).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);

    setSaving(true);
    try {
      if (banner) await api.put(`/cms/banners/${banner._id}`, fd);
      else await api.post("/cms/banners", fd);
      toast.success(banner ? "Banner updated" : "Banner added");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const input = (name, label, props = {}) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input name={name} value={form[name]} onChange={handleChange}
        className={`border p-2 rounded w-full ${errors[name] ? "border-red-500" : ""}`} {...props} />
      {errors[name] && <p className="text-red-600 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} noValidate
        className="bg-white rounded-lg p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{banner ? "Edit banner" : "Add banner"}</h2>

        {placement === "category" && (
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select onChange={pickCategory} defaultValue="" className="border p-2 rounded w-full">
              <option value="">Choose a category</option>
              {Object.keys(CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {input("title", "Title", { maxLength: 80 })}
        {placement !== "category" && input("subtitle", "Subtitle", { maxLength: 160 })}
        {placement !== "category" && input("ctaText", "Button text", { maxLength: 30, placeholder: "Shop gold" })}
        {input("ctaLink", "Link", { placeholder: "/collection?metal=Gold" })}

        <div className="grid grid-cols-2 gap-3 items-end">
          {input("order", "Order (0 shows first)", { type: "number", min: 0 })}
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Show on website
          </label>
        </div>

        <div>
          <label className="block text-sm mb-1">Image</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="w-full text-sm" />
          {errors.image && <p className="text-red-600 text-xs mt-1">{errors.image}</p>}
          {preview && <img src={preview} alt="Preview" className="mt-2 max-h-40 rounded border object-cover" />}
        </div>

        <div className="flex gap-3 pt-2">
          <LoadingButton loading={saving}>Save</LoadingButton>
          <button type="button" onClick={onClose} className="border px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [tab, setTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, banner: null });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/cms/banners");
      setBanners(data.banners || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (b) => {
    try {
      await api.put(`/cms/banners/${b._id}`, { isActive: !b.isActive });
      toast.success(b.isActive ? "Banner hidden" : "Banner shown");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update banner");
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete "${b.title}"? The image is removed too.`)) return;
    try {
      await api.delete(`/cms/banners/${b._id}`);
      toast.success("Banner deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete banner");
    }
  };

  if (loading) return <PageLoader />;

  const current = PLACEMENTS.find((p) => p.key === tab);
  const list = banners.filter((b) => b.placement === tab);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Website banners</h1>
        <button onClick={() => setModal({ open: true, banner: null })}
          className="bg-amber-600 text-white px-4 py-2 rounded">+ Add banner</button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto whitespace-nowrap">
        {PLACEMENTS.map((p) => (
          <button key={p.key} onClick={() => setTab(p.key)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 ${
              tab === p.key ? "border-amber-600 text-amber-700 font-medium" : "border-transparent text-gray-600"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-600">{current.hint}</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {list.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">No banners here yet. Add one to show it on the website.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((b) => (
            <div key={b._id} className={`bg-white rounded-lg shadow overflow-hidden ${b.isActive ? "" : "opacity-60"}`}>
              <img src={b.image.url} alt={b.title} className="h-40 w-full object-cover" loading="lazy" />
              <div className="p-3 space-y-1">
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-gray-500">
                  Order {b.order}, {b.isActive ? "shown on website" : "hidden"}
                </p>
                <div className="flex gap-3 pt-2 text-sm">
                  <button onClick={() => setModal({ open: true, banner: b })} className="text-blue-600">Edit</button>
                  <button onClick={() => toggleActive(b)} className="text-gray-700">{b.isActive ? "Hide" : "Show"}</button>
                  <button onClick={() => handleDelete(b)} className="text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <BannerModal
          banner={modal.banner}
          placement={modal.banner?.placement || tab}
          onClose={() => setModal({ open: false, banner: null })}
          onSaved={() => { setModal({ open: false, banner: null }); load(); }}
        />
      )}
    </div>
  );
}
