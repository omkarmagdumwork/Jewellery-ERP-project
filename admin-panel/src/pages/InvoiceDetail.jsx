import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { money } from "../utils/billing";
import { openInvoicePdf } from "../utils/openInvoicePdf";
import toast from "react-hot-toast";

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [invoice, setInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data.invoice || data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoice");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!invoice) return <p>{error || "Loading..."}</p>;

  const cancelled = invoice.status === "cancelled";

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");
    const amount = Number(payAmount);
    if (!(amount > 0)) return setError("Enter an amount greater than 0");
    if (amount > invoice.dueAmount) return setError("Amount cannot exceed the due amount");

    setBusy(true);
    try {
      await api.post(`/invoices/${id}/payment`, { amount });
      setPayAmount("");
      toast.success("Payment recorded");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this invoice? Stock will be added back.")) return;
    setError("");
    setBusy(true);
    try {
      await api.put(`/invoices/${id}/cancel`);
      toast.success("Invoice cancelled and stock restored");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to cancel invoice");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    try {
      await openInvoicePdf(id);
    } catch (error) {
      console.error(error);
      toast.error("Could not open the PDF");
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/invoices" className="text-sm text-blue-600">← Back to invoices</Link>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl font-semibold">
          {invoice.invoiceNo}
          {cancelled && <span className="ml-3 text-sm bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Cancelled</span>}
        </h1>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-amber-600 text-white px-4 py-2 rounded">
            Print / PDF
          </button>
          {isAdmin && !cancelled && (
            <button
              onClick={handleCancel}
              disabled={busy}
              className="border border-red-600 text-red-600 px-4 py-2 rounded disabled:opacity-50"
            >
              {busy ? "Cancelling..." : "Cancel Invoice"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow p-4 grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Customer</p>
          <p className="font-medium">{invoice.customer?.name}</p>
          <p>{invoice.customer?.phone}</p>
        </div>
        <div>
          <p className="text-gray-500">Date</p>
          <p className="font-medium">{new Date(invoice.date || invoice.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-gray-500">Payment mode</p>
          <p className="font-medium">{invoice.paymentMode}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Weight</th>
              <th className="p-3">Rate/g</th>
              <th className="p-3">Making</th>
              <th className="p-3">Wastage</th>
              <th className="p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-3">{it.product?.name || it.name || "-"}</td>
                <td className="p-3">{it.weight}g</td>
                <td className="p-3">{money(it.rate)}</td>
                <td className="p-3">{money(it.making)}</td>
                <td className="p-3">{money(it.wastage)}</td>
                <td className="p-3">{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Sub total</span><span>{money(invoice.subTotal)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{money(invoice.gst)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>- {money(invoice.discount)}</span></div>
          <div className="flex justify-between"><span>Old gold exchange</span><span>- {money(invoice.exchangeAmount)}</span></div>
          <hr />
          <div className="flex justify-between text-lg font-bold"><span>Grand total</span><span>{money(invoice.grandTotal)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{money(invoice.paidAmount)}</span></div>
          <div className="flex justify-between text-red-600 font-medium"><span>Due</span><span>{money(invoice.dueAmount)}</span></div>
        </div>

        {/* Collect due payment */}
        {!cancelled && invoice.dueAmount > 0 && (
          <form onSubmit={handlePayment} className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="font-medium">Collect payment</h2>
            <input
              type="number"
              min={1}
              max={invoice.dueAmount}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`Up to ${invoice.dueAmount}`}
              className="border p-2 rounded w-full"
              required
            />
            <button disabled={busy} className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {busy ? "Saving..." : "Add payment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}