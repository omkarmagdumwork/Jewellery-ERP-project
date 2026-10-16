import { useState } from "react";
import api from "../api/client";

// Works on the Contact page and on a product page (pass the product to prefill)
export default function EnquiryForm({ product, defaultMessage = "" }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: product ? `I am interested in ${product.name}.` : defaultMessage,
    website: "", // honeypot: real visitors never see or fill this
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle, sending, sent
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter your name";
    if (!/^\d{10}$/.test(form.phone)) errs.phone = "Enter a 10 digit phone number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("sending");
    setServerError("");
    try {
      await api.post("/public/enquiries", {
        ...form,
        productId: product?._id,
        productName: product?.name,
      });
      setStatus("sent");
    } catch (err) {
      setServerError(err.response?.data?.message || "We could not send your enquiry. Please call us instead.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div className="border border-gold-500 bg-white p-6">
        <p className="font-display text-xl text-velvet-900">Thank you, we have your enquiry.</p>
        <p className="mt-1 text-silver-600">We will call you on {form.phone} soon.</p>
        <button className="btn-outline-dark mt-4 btn-sm" onClick={() => { setStatus("idle"); setForm((f) => ({ ...f, message: "" })); }}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="enq-name" className="mb-1 block text-sm">Your name</label>
        <input id="enq-name" name="name" value={form.name} onChange={handleChange} autoComplete="name"
          className={`field ${errors.name ? "field-error" : ""}`} />
        {errors.name && <p className="mt-1 text-sm text-[#b3261e]">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="enq-phone" className="mb-1 block text-sm">Phone number</label>
        <input id="enq-phone" name="phone" type="tel" inputMode="numeric" maxLength={10}
          value={form.phone} onChange={handleChange} autoComplete="tel-national"
          className={`field ${errors.phone ? "field-error" : ""}`} />
        {errors.phone && <p className="mt-1 text-sm text-[#b3261e]">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="enq-message" className="mb-1 block text-sm">Message (optional)</label>
        <textarea id="enq-message" name="message" rows={4} maxLength={1000}
          value={form.message} onChange={handleChange} className="field" />
      </div>

      <input name="website" value={form.website} onChange={handleChange} tabIndex={-1}
        autoComplete="off" aria-hidden="true" className="hidden" />

      {serverError && <p className="text-sm text-[#b3261e]" role="alert">{serverError}</p>}

      <button type="submit" disabled={status === "sending"} className="btn-velvet">
        {status === "sending" ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
