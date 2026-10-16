import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { PageLoader, LoadingButton } from "../components/Spinner";

const SECTIONS = [
  {
    title: "Shop",
    fields: [
      { name: "shopName", label: "Shop name" },
      { name: "tagline", label: "Tagline", help: "Shown on the home page when there are no hero banners." },
      { name: "announcement", label: "Announcement bar", help: "A short line at the very top of the site. Leave empty to hide it." },
      { name: "gstin", label: "GSTIN" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "phone", label: "Phone", help: "Digits only, for example 9876543210." },
      { name: "whatsapp", label: "WhatsApp number", help: "Digits with country code, for example 919876543210. Leave empty to hide the WhatsApp button." },
      { name: "email", label: "Email" },
      { name: "address", label: "Address", multiline: true },
      { name: "workingHours", label: "Working hours", help: "For example: Mon to Sat, 10 am to 8 pm." },
      { name: "mapUrl", label: "Google Maps link" },
    ],
  },
  {
    title: "About",
    fields: [{ name: "about", label: "About the shop", multiline: true, rows: 5 }],
  },
  {
    title: "Social",
    fields: [
      { name: "instagram", label: "Instagram link" },
      { name: "facebook", label: "Facebook link" },
    ],
  },
];

export default function SiteSettings() {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/cms/settings")
      .then(({ data }) => setForm(data.settings))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load settings"));
  }, []);

  if (!form) return <PageLoader />;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.shopName?.trim()) errs.shopName = "Shop name is required";
    ["phone", "whatsapp"].forEach((k) => {
      if (form[k] && !/^\d{10,15}$/.test(form[k])) errs[k] = "Use digits only, 10 to 15 characters";
    });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    ["mapUrl", "instagram", "facebook"].forEach((k) => {
      if (form[k] && !/^https?:\/\//i.test(form[k])) errs[k] = "Enter a full link starting with https://";
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Fix the highlighted fields");

    // Send only the fields the form edits
    const keys = SECTIONS.flatMap((s) => s.fields.map((f) => f.name)).concat(["showRates", "showPrices"]);
    const payload = Object.fromEntries(keys.map((k) => [k, form[k] ?? (k.startsWith("show") ? false : "")]));

    setSaving(true);
    try {
      const { data } = await api.put("/cms/settings", payload);
      setForm(data.settings);
      toast.success("Website settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    const Tag = f.multiline ? "textarea" : "input";
    return (
      <div key={f.name}>
        <label className="block text-sm mb-1">{f.label}</label>
        <Tag name={f.name} value={form[f.name] ?? ""} onChange={handleChange} rows={f.rows || 2}
          className={`border p-2 rounded w-full ${errors[f.name] ? "border-red-500" : ""}`} />
        {f.help && !errors[f.name] && <p className="text-xs text-gray-500 mt-1">{f.help}</p>}
        {errors[f.name] && <p className="text-red-600 text-xs mt-1">{errors[f.name]}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Website settings</h1>

      {SECTIONS.map((s) => (
        <div key={s.title} className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-medium">{s.title}</h2>
          {s.fields.map(renderField)}
        </div>
      ))}

      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="font-medium">What customers can see</h2>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="showRates" checked={!!form.showRates} onChange={handleChange} className="mt-1" />
          <span>
            Show today's gold and silver rates
            <span className="block text-xs text-gray-500">Taken from the Rates screen, so it is always current.</span>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="showPrices" checked={!!form.showPrices} onChange={handleChange} className="mt-1" />
          <span>
            Show approximate prices on products
            <span className="block text-xs text-gray-500">
              Calculated from today's rate, making charge, wastage and GST. Stone value is not included. If this is off, customers are asked to enquire.
            </span>
          </span>
        </label>
      </div>

      <LoadingButton loading={saving}>Save settings</LoadingButton>
    </form>
  );
}
