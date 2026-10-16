import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { LoadingButton } from "./Spinner";
import { isValidPhone, isValidEmail } from "../utils/validators";

const empty = { name: "", phone: "", email: "", address: "", city: "", dob: "", anniversary: "", notes: "" };

// Convert ISO date to yyyy-mm-dd for <input type="date">
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState(
    customer
      ? { ...empty, ...customer, dob: toDateInput(customer.dob), anniversary: toDateInput(customer.anniversary) }
      : empty
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear the error of the field being edited
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!isValidPhone(form.phone)) errs.phone = "Phone must be 10 digits";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = { ...form, dob: form.dob || undefined, anniversary: form.anniversary || undefined };

    setSaving(true);
    try {
      if (customer) await api.put(`/customers/${customer._id}`, payload);
      else await api.post("/customers", payload);
      toast.success(customer ? "Customer updated" : "Customer added");
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save customer";
      // Duplicate phone comes back as 400 from the backend
      if (err.response?.status === 400 && /phone/i.test(message)) {
        setErrors({ phone: message });
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, type = "text", extra = {}) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name] ?? ""}
        onChange={handleChange}
        className={`border p-2 rounded w-full ${errors[name] ? "border-red-500" : ""}`}
        {...extra}
      />
      {errors[name] && <p className="text-red-600 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} noValidate
        className="bg-white rounded-lg p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{customer ? "Edit Customer" : "Add Customer"}</h2>

        {field("name", "Name")}
        {field("phone", "Phone", "tel", { maxLength: 10, inputMode: "numeric" })}
        {field("email", "Email", "email")}
        {field("address", "Address")}
        {field("city", "City")}
        <div className="grid grid-cols-2 gap-3">
          {field("dob", "Date of Birth", "date")}
          {field("anniversary", "Anniversary", "date")}
        </div>
        <div>
          <label className="block text-sm mb-1">Notes</label>
          <textarea name="notes" value={form.notes ?? ""} onChange={handleChange}
            className="border p-2 rounded w-full" rows={2} />
        </div>

        <div className="flex gap-3 pt-2">
          <LoadingButton loading={saving}>Save</LoadingButton>
          <button type="button" onClick={onClose} className="border px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}