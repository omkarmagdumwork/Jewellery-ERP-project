import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "../components/Spinner";

const STATUSES = ["new", "contacted", "closed"];
const LABELS = { new: "New", contacted: "Contacted", closed: "Closed" };

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cms/enquiries", { params: { status: status || undefined, page, limit: 15 } });
      setEnquiries(data.enquiries || []);
      setTotalPages(data.totalPages || 1);
      setNewCount(data.newCount || 0);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, next) => {
    try {
      await api.put(`/cms/enquiries/${id}`, { status: next });
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleConvert = async (id) => {
    try {
      const { data } = await api.post(`/cms/enquiries/${id}/convert`);
      toast.success(data.created ? "Added as a new customer" : "This phone number is already a customer");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add customer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await api.delete(`/cms/enquiries/${id}`);
      toast.success("Enquiry deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete enquiry");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Enquiries
          {newCount > 0 && (
            <span className="ml-3 text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{newCount} new</span>
          )}
        </h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border p-2 rounded">
          <option value="">All enquiries</option>
          {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Date</th><th className="p-3">Name</th><th className="p-3">Phone</th>
              <th className="p-3">Product</th><th className="p-3">Message</th>
              <th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-6" colSpan={7}><div className="flex justify-center"><Spinner /></div></td></tr>
            )}
            {!loading && enquiries.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>No enquiries yet</td></tr>
            )}
            {!loading && enquiries.map((q) => (
              <tr key={q._id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{new Date(q.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-3">{q.name}</td>
                <td className="p-3"><a href={`tel:${q.phone}`} className="text-blue-600">{q.phone}</a></td>
                <td className="p-3">{q.productName || "-"}</td>
                <td className="p-3 max-w-xs">{q.message || "-"}</td>
                <td className="p-3">
                  <select value={q.status} onChange={(e) => changeStatus(q._id, e.target.value)}
                    className="border p-1 rounded">
                    {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="p-3 whitespace-nowrap space-x-3">
                  {q.customer ? (
                    <Link to={`/customers/${q.customer}/history`} className="text-green-700">Customer</Link>
                  ) : (
                    <button onClick={() => handleConvert(q._id)} className="text-blue-600">Add as customer</button>
                  )}
                  <button onClick={() => handleDelete(q._id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
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
