
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import CustomerModal from "../components/CustomerModal";
import toast from "react-hot-toast";

export default function Customers() {
  const { user } = useAuth();
  const canDelete = ["admin", "manager"].includes(user?.role);

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    open: false,
    customer: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/customers", {
        params: { search, page, limit: 10 },
      });

      setCustomers(
        data.customers ||
          data.data ||
          (Array.isArray(data) ? data : [])
      );

      setTotalPages(data.totalPages || data.pages || 1);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message || "Customers fetch failed";

      setError(message);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Ha customer delete karaycha?")) return;

    try {
      await api.delete(`/customers/${id}`);

      toast.success("Customer deleted");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete customer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Customers</h1>

        <button
          onClick={() =>
            setModal({ open: true, customer: null })
          }
          className="bg-amber-600 text-white px-4 py-2 rounded"
        >
          + Add Customer
        </button>
      </div>

      <input
        className="border p-2 rounded w-full md:w-80"
        placeholder="Search name / phone"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">City</th>
              <th className="p-3">Total Purchase</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-3" colSpan={5}>
                  Loading...
                </td>
              </tr>
            )}

            {!loading && customers.length === 0 && (
              <tr>
                <td
                  className="p-3 text-gray-500"
                  colSpan={5}
                >
                  Customer sapdla nahi
                </td>
              </tr>
            )}

            {customers.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.city}</td>
                <td className="p-3">
                  ₹{c.totalPurchase || 0}
                </td>

                <td className="p-3 space-x-3">
                  <Link
                    to={`/customers/${c._id}/history`}
                    className="text-green-700"
                  >
                    History
                  </Link>

                  <button
                    onClick={() =>
                      setModal({ open: true, customer: c })
                    }
                    className="text-blue-600"
                  >
                    Edit
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {modal.open && (
        <CustomerModal
          customer={modal.customer}
          onClose={() =>
            setModal({ open: false, customer: null })
          }
          onSaved={() => {
            setModal({ open: false, customer: null });
            load();
          }}
        />
      )}
    </div>
  );
}
