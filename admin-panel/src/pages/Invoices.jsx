import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { money } from "../utils/billing";
import { openInvoicePdf } from "../utils/openInvoicePdf";
import toast from "react-hot-toast";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Adjust param names (from/to) to match your backend
      const { data } = await api.get("/invoices", {
        params: { from: from || undefined, to: to || undefined, page, limit: 10 },
      });
      setInvoices(data.invoices || data.data || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || data.pages || 1);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message || "Failed to load invoices";

      setError(message);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [from, to, page]);

  useEffect(() => { load(); }, [load]);

const handlePrint = async (id) => {
  try {
    await openInvoicePdf(id);
  } catch (error) {
    console.error(error);
    toast.error("Could not open the PDF");
  }
};

  const clearFilters = () => { setFrom(""); setTo(""); setPage(1); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Invoices</h1>

      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm mb-1">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm mb-1">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="border p-2 rounded" />
        </div>
        <button onClick={clearFilters} className="border px-3 py-2 rounded">Clear</button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Invoice</th><th className="p-3">Date</th><th className="p-3">Customer</th>
              <th className="p-3">Total</th><th className="p-3">Due</th><th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3" colSpan={7}>Loading...</td></tr>}
            {!loading && invoices.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>No invoices found</td></tr>
            )}
            {invoices.map((i) => {
              const cancelled = i.status === "cancelled";
              return (
                <tr key={i._id} className={`border-t ${cancelled ? "text-gray-400" : ""}`}>
                  <td className="p-3">{i.invoiceNo}</td>
                  <td className="p-3">{new Date(i.date || i.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-3">{i.customer?.name || "-"}</td>
                  <td className={`p-3 ${cancelled ? "line-through" : ""}`}>{money(i.grandTotal)}</td>
                  <td className="p-3">{money(i.dueAmount)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${cancelled ? "bg-gray-200 text-gray-600"
                        : i.dueAmount > 0 ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-700"}`}>
                      {cancelled ? "Cancelled" : i.dueAmount > 0 ? "Due" : "Paid"}
                    </span>
                  </td>
                  <td className="p-3 space-x-3">
                    <Link to={`/invoices/${i._id}`} className="text-blue-600">View</Link>
                    <button onClick={() => handlePrint(i._id)} className="text-green-700">Print</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
          className="border px-3 py-1 rounded disabled:opacity-40">Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
          className="border px-3 py-1 rounded disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}