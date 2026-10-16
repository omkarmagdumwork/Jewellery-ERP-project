import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { PageLoader, LoadingButton } from "../components/Spinner";

function TestimonialModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    text: item?.text || "",
    place: item?.place || "",
    rating: item?.rating ?? 5,
    order: item?.order ?? 0,
    isActive: item?.isActive ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.text.trim()) errs.text = "Write what the customer said";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { ...form, rating: Number(form.rating), order: Number(form.order) };
    setSaving(true);
    try {
      if (item) await api.put(`/cms/testimonials/${item._id}`, payload);
      else await api.post("/cms/testimonials", payload);
      toast.success(item ? "Review updated" : "Review added");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg p-6 w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">{item ? "Edit review" : "Add review"}</h2>
        <p className="text-xs text-gray-500">Only add reviews that real customers gave you.</p>

        <div>
          <label className="block text-sm mb-1">Customer name</label>
          <input name="name" value={form.name} onChange={handleChange} maxLength={60}
            className={`border p-2 rounded w-full ${errors.name ? "border-red-500" : ""}`} />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">What they said</label>
          <textarea name="text" value={form.text} onChange={handleChange} rows={4} maxLength={300}
            className={`border p-2 rounded w-full ${errors.text ? "border-red-500" : ""}`} />
          {errors.text && <p className="text-red-600 text-xs mt-1">{errors.text}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">City</label>
            <input name="place" value={form.place} onChange={handleChange} maxLength={60} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Rating</label>
            <select name="rating" value={form.rating} onChange={handleChange} className="border p-2 rounded w-full">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} of 5</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Order</label>
            <input name="order" type="number" min={0} value={form.order} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          Show on website
        </label>

        <div className="flex gap-3 pt-2">
          <LoadingButton loading={saving}>Save</LoadingButton>
          <button type="button" onClick={onClose} className="border px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, item: null });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/cms/testimonials");
      setItems(data.testimonials || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (t) => {
    try {
      await api.put(`/cms/testimonials/${t._id}`, { isActive: !t.isActive });
      toast.success(t.isActive ? "Review hidden" : "Review shown");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review");
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete the review from ${t.name}?`)) return;
    try {
      await api.delete(`/cms/testimonials/${t._id}`);
      toast.success("Review deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Customer reviews</h1>
        <button onClick={() => setModal({ open: true, item: null })} className="bg-amber-600 text-white px-4 py-2 rounded">
          + Add review
        </button>
      </div>
      <p className="text-sm text-gray-600">Shown on the home page of the website. The first six active reviews are displayed.</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {items.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">No reviews yet. The section stays hidden on the website until you add one.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t) => (
            <div key={t._id} className={`bg-white rounded-lg shadow p-4 ${t.isActive ? "" : "opacity-60"}`}>
              <p className="text-amber-600" aria-label={`${t.rating} out of 5`}>{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</p>
              <p className="mt-1">{t.text}</p>
              <p className="mt-2 text-sm text-gray-500">{t.name}{t.place ? `, ${t.place}` : ""}</p>
              <div className="flex gap-3 pt-3 text-sm">
                <button onClick={() => setModal({ open: true, item: t })} className="text-blue-600">Edit</button>
                <button onClick={() => toggleActive(t)} className="text-gray-700">{t.isActive ? "Hide" : "Show"}</button>
                <button onClick={() => handleDelete(t)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <TestimonialModal
          item={modal.item}
          onClose={() => setModal({ open: false, item: null })}
          onSaved={() => { setModal({ open: false, item: null }); load(); }}
        />
      )}
    </div>
  );
}
