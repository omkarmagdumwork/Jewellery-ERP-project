import { useState, useMemo } from "react";
import api from "../api/axios";
import { useRates } from "../context/RateContext";
import SearchPicker from "../components/SearchPicker";
import { findRate, calcItem, calcTotals, money, GST_PERCENT } from "../utils/billing";
import { openInvoicePdf } from "../utils/openInvoicePdf";
import toast from "react-hot-toast";

const CUSTOMER_KEYS = ["customers", "data"];
const PRODUCT_KEYS = ["products", "data"];

export default function Billing() {
  const { latestRates } = useRates();

  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]); // [{ product, qty }]
  const [discount, setDiscount] = useState(0);
  const [exchangeAmount, setExchangeAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null); // saved invoice from server

  // Preview lines
  const lines = useMemo(
    () =>
      items.map(({ product, qty }) => {
        const rate = findRate(latestRates, product.metal, product.purity);
        const c = calcItem(product, rate);
        return { product, qty, rate, ...c, amount: c.amount * qty };
      }),
    [items, latestRates]
  );

  const totals = calcTotals(lines, Number(discount) || 0, Number(exchangeAmount) || 0);
  const paid = paidAmount === "" ? totals.grandTotal : Number(paidAmount);
  const due = Math.max(totals.grandTotal - paid, 0);

  const addProduct = (p) => {
    if (p.quantity < 1) return toast.error(`${p.name} is out of stock`);
    setError("");
    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === p._id);
      if (existing) {
        if (existing.qty + 1 > p.quantity) {
          toast.error("Quantity cannot exceed available stock");
          return prev;
        }
        return prev.map((i) => (i.product._id === p._id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const changeQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product._id === id ? { ...i, qty: Math.min(Math.max(qty, 1), i.product.quantity) } : i
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product._id !== id));

  const reset = () => {
    setCustomer(null); setItems([]); setDiscount(0); setExchangeAmount(0);
    setPaymentMode("Cash"); setPaidAmount(""); setSaved(null); setError("");
  };

  const handleSave = async () => {
    setError("");
    if (!customer) return setError("Select a customer");
    if (items.length === 0) return setError("Add at least one product");
    if (paid > totals.grandTotal) return setError("Paid amount cannot exceed the grand total");

    // Adjust field names to match your create-invoice API
    const payload = {
      customer: customer._id,
      items: items.map((i) => ({ product: i.product._id, quantity: i.qty })),
      discount: Number(discount) || 0,
      exchangeAmount: Number(exchangeAmount) || 0,
      paymentMode,
      paidAmount: paid,
    };

    setSaving(true);
    try {
      const { data } = await api.post("/invoices", payload);
      setSaved(data.invoice || data.data || data);
      toast.success("Invoice created");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not save invoice");
    } finally {
      setSaving(false);
    }
  };

  const openPdf = async () => {
    try {
      await openInvoicePdf(saved._id);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error(err.response?.data?.message || "Could not open the PDF");
    }
  };

  // Success screen after save
  if (saved) {
    return (
      <div className="bg-white rounded-lg shadow p-6 max-w-md space-y-3">
        <h1 className="text-xl font-semibold text-green-700">Invoice saved</h1>
        <p>Invoice No: <b>{saved.invoiceNo}</b></p>
        <p>Grand Total (server): <b>{money(saved.grandTotal)}</b></p>
        <p>Due: <b>{money(saved.dueAmount)}</b></p>
        <div className="flex gap-3 pt-2">
          <button onClick={openPdf} className="bg-amber-600 text-white px-4 py-2 rounded">Print / PDF</button>
          <button onClick={reset} className="border px-4 py-2 rounded">New Bill</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Bill</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-medium">1. Customer</h2>
          {customer ? (
            <div className="flex justify-between items-center bg-amber-50 p-2 rounded">
              <span>{customer.name} ({customer.phone})</span>
              <button className="text-sm text-red-600" onClick={() => setCustomer(null)}>Change</button>
            </div>
          ) : (
            <SearchPicker endpoint="/customers" placeholder="Search customer name / phone"
              listKeys={CUSTOMER_KEYS} onSelect={setCustomer}
              renderItem={(c) => `${c.name} - ${c.phone}`} />
          )}
        </div>

        {/* Product search */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-medium">2. Add Product</h2>
          <SearchPicker endpoint="/products" placeholder="Search name / SKU / scan barcode"
            listKeys={PRODUCT_KEYS} onSelect={addProduct}
            renderItem={(p) => `${p.name} | ${p.sku || p.barcode} | ${p.netWeight}g | Qty ${p.quantity}`} />
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Item</th><th className="p-3">Net Wt</th><th className="p-3">Rate/g</th>
              <th className="p-3">Making</th><th className="p-3">Wastage</th><th className="p-3">Qty</th>
              <th className="p-3">Amount</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={8}>Add a product to start billing</td></tr>
            )}
            {lines.map((l) => (
              <tr key={l.product._id} className="border-t">
                <td className="p-3">{l.product.name} <span className="text-gray-400">({l.product.metal} {l.product.purity})</span></td>
                <td className="p-3">{l.product.netWeight}g</td>
                <td className="p-3">
                  {l.rate ? money(l.rate) : <span className="text-red-600">Rate not set</span>}
                </td>
                <td className="p-3">{money(l.making)}</td>
                <td className="p-3">{money(l.wastage)}</td>
                <td className="p-3">
                  <input type="number" min={1} max={l.product.quantity} value={l.qty}
                    onChange={(e) => changeQty(l.product._id, Number(e.target.value))}
                    className="border p-1 rounded w-16" />
                </td>
                <td className="p-3">{money(l.amount)}</td>
                <td className="p-3">
                  <button className="text-red-600" onClick={() => removeItem(l.product._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + payment */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-medium">3. Payment</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Discount (₹)</label>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Old gold exchange (₹)</label>
              <input type="number" min={0} value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)}
                className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Payment mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                className="border p-2 rounded w-full">
                {["Cash", "UPI", "Card", "Mixed"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Paid amount (₹)</label>
              <input type="number" min={0} value={paidAmount} placeholder={String(Math.round(totals.grandTotal))}
                onChange={(e) => setPaidAmount(e.target.value)} className="border p-2 rounded w-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-medium">Summary (preview)</h2>
          <div className="flex justify-between"><span>Taxable</span><span>{money(totals.taxable)}</span></div>
          <div className="flex justify-between"><span>GST ({GST_PERCENT}%)</span><span>{money(totals.gst)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>- {money(discount)}</span></div>
          <div className="flex justify-between"><span>Old gold</span><span>- {money(exchangeAmount)}</span></div>
          <hr />
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total</span><span>{money(totals.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-600"><span>Due</span><span>{money(due)}</span></div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-amber-600 text-white py-2 rounded disabled:opacity-50 mt-2">
            {saving ? "Saving..." : "Save Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}