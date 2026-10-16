import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SearchPicker from "../components/SearchPicker";
import { money } from "../utils/billing";
import toast from "react-hot-toast";

const CATEGORIES = ["Ring", "Chain", "Bangle", "Earring", "Necklace"];
const PURITIES = { Gold: ["24K", "22K", "18K"], Silver: ["999", "925"] };
const SUPPLIER_KEYS = ["suppliers", "data"];
const PRODUCT_KEYS = ["products", "data"];

const emptyNewProduct = {
  name: "", sku: "", category: "Ring", metal: "Gold", purity: "22K",
  grossWeight: "", netWeight: "", stoneWeight: 0,
  makingChargeType: "perGram", makingCharge: "", wastagePercent: 0,
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]); // { key, mode, product?, newProduct?, quantity, costPrice }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);

  const addExisting = (product) => {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), mode: "existing", product, quantity: 1, costPrice: "" }]);
  };

  const addNew = () => {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), mode: "new", newProduct: { ...emptyNewProduct }, quantity: 1, costPrice: "" }]);
  };

  const updateItem = (key, patch) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const updateNewProduct = (key, name, value) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const np = { ...i.newProduct, [name]: value };
        if (name === "metal") np.purity = PURITIES[value][0];
        return { ...i, newProduct: np };
      })
    );

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!supplier) return setError("Select a supplier");
    if (items.length === 0) return setError("Add at least one item");

    for (const i of items) {
      if (!(Number(i.quantity) >= 1)) return setError("Quantity must be at least 1");
      if (!(Number(i.costPrice) > 0)) return setError("Enter a cost price for every item");
      if (i.mode === "new") {
        const np = i.newProduct;
        if (!np.name || !np.sku) return setError("New products need a name and SKU");
        if (Number(np.netWeight) > Number(np.grossWeight)) return setError("Net weight cannot exceed gross weight");
      }
    }

    // Adjust the field names to match your purchase API
    const payload = {
      supplier: supplier._id,
      supplierInvoiceNo,
      date,
      items: items.map((i) => {
        const base = { quantity: Number(i.quantity), costPrice: Number(i.costPrice) };
        if (i.mode === "existing") return { ...base, product: i.product._id };
        const np = { ...i.newProduct };
        ["grossWeight", "netWeight", "stoneWeight", "makingCharge", "wastagePercent"].forEach(
          (k) => (np[k] = Number(np[k]))
        );
        return { ...base, newProduct: np };
      }),
    };

    setSaving(true);
    try {
      await api.post("/purchases", payload);
      toast.success("Purchase saved, stock updated");
      navigate("/purchases");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not save purchase");
    } finally {
      setSaving(false);
    }
  };

  const numInput = (value, onChange, props = {}) => (
    <input type="number" min={0} value={value} onChange={onChange}
      className="border p-2 rounded w-full" {...props} />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">New Purchase</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Supplier</label>
          {supplier ? (
            <div className="flex justify-between items-center bg-amber-50 p-2 rounded">
              <span>{supplier.name}</span>
              <button type="button" className="text-sm text-red-600" onClick={() => setSupplier(null)}>Change</button>
            </div>
          ) : (
            <SearchPicker endpoint="/suppliers" placeholder="Search supplier" listKeys={SUPPLIER_KEYS}
              onSelect={setSupplier} renderItem={(s) => `${s.name} - ${s.phone}`} />
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Supplier bill no</label>
          <input value={supplierInvoiceNo} onChange={(e) => setSupplierInvoiceNo(e.target.value)}
            className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded w-full" />
        </div>
      </div>

      {/* Add items */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="font-medium">Items</h2>
        <div className="flex flex-wrap gap-3 items-start">
          <div className="w-full md:w-80">
            <SearchPicker endpoint="/products" placeholder="Add existing product (name / SKU)"
              listKeys={PRODUCT_KEYS} onSelect={addExisting}
              renderItem={(p) => `${p.name} | ${p.sku || p.barcode} | Stock ${p.quantity}`} />
          </div>
          <button type="button" onClick={addNew} className="border px-3 py-2 rounded">+ New product</button>
        </div>

        {items.length === 0 && <p className="text-sm text-gray-500">No items added yet</p>}

        {items.map((i) => (
          <div key={i.key} className="border rounded p-3 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-medium">
                {i.mode === "existing"
                  ? `${i.product.name} (current stock ${i.product.quantity})`
                  : "New product"}
              </p>
              <button type="button" onClick={() => removeItem(i.key)} className="text-red-600 text-sm">Remove</button>
            </div>

            {i.mode === "new" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input placeholder="Name" value={i.newProduct.name} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "name", e.target.value)} />
                <input placeholder="SKU / Barcode" value={i.newProduct.sku} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "sku", e.target.value)} />
                <select value={i.newProduct.category} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={i.newProduct.metal} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "metal", e.target.value)}>
                  {Object.keys(PURITIES).map((m) => <option key={m}>{m}</option>)}
                </select>
                <select value={i.newProduct.purity} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "purity", e.target.value)}>
                  {PURITIES[i.newProduct.metal].map((p) => <option key={p}>{p}</option>)}
                </select>
                {numInput(i.newProduct.grossWeight, (e) => updateNewProduct(i.key, "grossWeight", e.target.value),
                  { placeholder: "Gross wt (g)", step: "0.001" })}
                {numInput(i.newProduct.netWeight, (e) => updateNewProduct(i.key, "netWeight", e.target.value),
                  { placeholder: "Net wt (g)", step: "0.001" })}
                {numInput(i.newProduct.makingCharge, (e) => updateNewProduct(i.key, "makingCharge", e.target.value),
                  { placeholder: "Making charge", step: "0.01" })}
                <select value={i.newProduct.makingChargeType} className="border p-2 rounded"
                  onChange={(e) => updateNewProduct(i.key, "makingChargeType", e.target.value)}>
                  <option value="perGram">Making: per gram</option>
                  <option value="fixed">Making: fixed</option>
                </select>
                {numInput(i.newProduct.wastagePercent, (e) => updateNewProduct(i.key, "wastagePercent", e.target.value),
                  { placeholder: "Wastage %", step: "0.01" })}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div>
                <label className="block text-xs mb-1">Quantity</label>
                {numInput(i.quantity, (e) => updateItem(i.key, { quantity: e.target.value }), { min: 1 })}
              </div>
              <div>
                <label className="block text-xs mb-1">Cost price (each)</label>
                {numInput(i.costPrice, (e) => updateItem(i.key, { costPrice: e.target.value }), { step: "0.01" })}
              </div>
              <div>
                <label className="block text-xs mb-1">Line total</label>
                <p className="p-2">{money((Number(i.quantity) || 0) * (Number(i.costPrice) || 0))}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <p className="text-lg font-bold">Total: {money(total)}</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/purchases")} className="border px-4 py-2 rounded">Cancel</button>
          <button disabled={saving} className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </div>
    </form>
  );
}