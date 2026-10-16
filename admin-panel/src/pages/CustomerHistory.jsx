import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

export default function CustomerHistory() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/customers/${id}/history`)
      .then(({ data }) => {
        // Adjust to your response shape, e.g. { customer, invoices }
        setCustomer(data.customer || null);
        setInvoices(data.invoices || data.bills || data.history || (Array.isArray(data) ? data : []));
      })
      .catch((err) => setError(err.response?.data?.message || "History load zali nahi"))
      .finally(() => setLoading(false));
  }, [id]);

  const totalSpent = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalDue = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.dueAmount || 0), 0);

  return (
    <div className="space-y-4">
      <Link to="/customers" className="text-sm text-blue-600">← Back to customers</Link>
      <h1 className="text-xl font-semibold">
        {customer ? `${customer.name} (${customer.phone})` : "Customer History"}
      </h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Purchase</p>
          <p className="text-xl font-bold">₹{totalSpent}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Due</p>
          <p className="text-xl font-bold text-red-600">₹{totalDue}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Invoice</th><th className="p-3">Date</th><th className="p-3">Total</th>
              <th className="p-3">Paid</th><th className="p-3">Due</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3" colSpan={6}>Loading...</td></tr>}
            {!loading && invoices.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={6}>Ajun bill nahi</td></tr>
            )}
            {invoices.map((i) => (
              <tr key={i._id} className="border-t">
                <td className="p-3">{i.invoiceNo}</td>
                <td className="p-3">{new Date(i.date || i.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">₹{i.grandTotal}</td>
                <td className="p-3">₹{i.paidAmount}</td>
                <td className="p-3">₹{i.dueAmount}</td>
                <td className="p-3">{i.status || "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}