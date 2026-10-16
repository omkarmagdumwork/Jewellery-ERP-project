import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { money } from "../utils/billing";

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/purchases")
      .then(({ data }) => setPurchases(data.purchases || data.data || (Array.isArray(data) ? data : [])))
      .catch((err) => setError(err.response?.data?.message || "Failed to load purchases"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Purchases</h1>
        <Link to="/purchases/new" className="bg-amber-600 text-white px-4 py-2 rounded">+ New Purchase</Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Date</th><th className="p-3">Supplier</th><th className="p-3">Bill No</th>
              <th className="p-3">Items</th><th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3" colSpan={5}>Loading...</td></tr>}
            {!loading && purchases.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={5}>No purchases yet</td></tr>
            )}
            {purchases.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{new Date(p.date || p.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">{p.supplier?.name || "-"}</td>
                <td className="p-3">{p.supplierInvoiceNo || "-"}</td>
                <td className="p-3">{p.items?.length || 0}</td>
                <td className="p-3">{money(p.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}