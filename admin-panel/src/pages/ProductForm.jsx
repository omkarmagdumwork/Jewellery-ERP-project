import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

// Standard categories and purity standards mapping
const CATEGORIES = ["Ring", "Chain", "Bangle", "Earring", "Necklace"];
const PURITIES = { Gold: ["24K", "22K", "18K"], Silver: ["999", "925"] };

// Default initial state for form fields
const empty = {
  name: "",
  category: "Ring",
  metal: "Gold",
  purity: "22K",
  grossWeight: "",
  netWeight: "",
  stoneWeight: 0,
  makingChargeType: "perGram",
  makingCharge: "",
  wastagePercent: 0,
  hallmarkNo: "",
  huid: "",
  quantity: 1,
  sku: "",
  imageUrl: "",
  images: [],
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch product data if editing an existing product
  useEffect(() => {
    if (!id) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.product || data.data || data;
        setForm({ ...empty, ...p });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load product details");
      });
  }, [id]);

  // Handle standard form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "metal" && PURITIES[value]) {
        next.purity = PURITIES[value][0];
      }
      return next;
    });
  };

  // Handle form submission and payload construction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Number(form.netWeight) > Number(form.grossWeight)) {
      return setError("Net weight cannot exceed gross weight");
    }

    setSaving(true);
    try {
      const formData = new FormData();

      // Append form fields to FormData
      Object.entries(form).forEach(([key, value]) => {
        if (key === "images" && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Attach file if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      if (id) {
        await api.put(`/products/${id}`, formData, config);
      } else {
        await api.post("/products", formData, config);
      }

      toast.success(id ? "Product updated successfully" : "Product added successfully");
      navigate("/products");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to generate labeled inputs
  const input = (name, label, type = "text", extra = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name] ?? ""}
        onChange={handleChange}
        className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
        {...extra}
      />
    </div>
  );

  // Compute current image URL for display
  const currentImageUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : form.imageUrl || (form.images && form.images[0]) || "";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 max-w-3xl space-y-4 border border-gray-200">
      <h1 className="text-xl font-bold text-gray-800">{id ? "Edit Product" : "Add Product"}</h1>
      {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {input("name", "Product Name", "text", { required: true })}
        {input("sku", "SKU / Barcode", "text", { required: true })}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metal</label>
          <select
            name="metal"
            value={form.metal}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {Object.keys(PURITIES).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
          <select
            name="purity"
            value={form.purity}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {PURITIES[form.metal]?.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {input("quantity", "Quantity", "number", { min: 0, required: true })}
        {input("grossWeight", "Gross Weight (g)", "number", { step: "0.001", min: 0, required: true })}
        {input("netWeight", "Net Weight (g)", "number", { step: "0.001", min: 0, required: true })}
        {input("stoneWeight", "Stone Weight (g)", "number", { step: "0.001", min: 0 })}
        {input("wastagePercent", "Wastage %", "number", { step: "0.01", min: 0 })}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge Type</label>
          <select
            name="makingChargeType"
            value={form.makingChargeType}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="perGram">Per Gram</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>

        {input("makingCharge", "Making Charge (₹)", "number", { step: "0.01", min: 0, required: true })}
        {input("hallmarkNo", "Hallmark No")}
        {input("huid", "HUID")}
      </div>

      {/* Image Preview & File Upload Input */}
      <div className="space-y-2 pt-2">
        <label className="block text-sm font-medium text-gray-700">Product Image</label>

        {currentImageUrl && (
          <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-md max-w-xs bg-gray-50">
            <img src={currentImageUrl} alt="Product Preview" className="h-16 w-16 object-cover rounded-md" />
            <span className="text-xs text-gray-500">{imageFile ? "New Image Selected" : "Current Image"}</span>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}