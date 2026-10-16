import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const CATEGORIES = ["Ring", "Chain", "Bangle", "Earring", "Necklace"];
const LOW_STOCK_LIMIT = 2; // same as backend low-stock limit

export default function Products() {
  const { user } = useAuth();
  const canEdit = ["admin", "manager"].includes(user.role);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [metal, setMetal] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products", {
        params: { search, category, metal, page, limit: 10 },
      });
      // Adjust these keys to your backend response shape
      setProducts(data.products || data.data || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Products fetch failed");
    } finally {
      setLoading(false);
    }
  }, [search, category, metal, page]);

  // Debounce so we don't call the API on every keystroke
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this product?")) return;
  //   try {
  //     await api.delete(`/products/${id}`);
  //     load();
  //   } catch (err) {
  //     toast.error("Could not delete product");
  //   }
  // };


  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this product?")) {
  //     return;
  //   }

  //   try {
  //     await api.delete(`/products/${id}`);

  //     toast.success("Product deleted");
  //     load();
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Could not delete product");
  //   }
  // };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setDeletingId(id);

      await api.delete(`/products/${id}`);

      toast.success("Product deleted");

      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Inventory</h1>
        {canEdit && (
          <Link to="/products/new" className="bg-amber-600 text-white px-4 py-2 rounded">
            + Add Product
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="border p-2 rounded" placeholder="Search name / SKU / HUID"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="border p-2 rounded" value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="border p-2 rounded" value={metal}
          onChange={(e) => { setMetal(e.target.value); setPage(1); }}>
          <option value="">All metals</option>
          <option>Gold</option>
          <option>Silver</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">SKU</th><th className="p-3">Name</th><th className="p-3">Category</th>
              <th className="p-3">Metal</th><th className="p-3">Net Wt (g)</th>
              <th className="p-3">Qty</th>{canEdit && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3" colSpan={7}>Loading...</td></tr>}
            {!loading && products.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>No products found
              </td></tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{p.sku || p.barcode}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.metal} {p.purity}</td>
                <td className="p-3">{p.netWeight}</td>
                <td className="p-3">
                  {p.quantity}
                  {p.quantity <= LOW_STOCK_LIMIT && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Low</span>
                  )}
                </td>
                {canEdit && (
                  <td className="p-3 space-x-3">
                    <Link to={`/products/${p._id}/edit`} className="text-blue-600">Edit</Link>

                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId !== null}
                      className="text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === p._id ? "Deleting..." : "Delete"}
                    </button>

                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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