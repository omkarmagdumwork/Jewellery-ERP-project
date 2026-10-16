
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const empty = { name: "", phone: "", gstin: "", address: "" };
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

function SupplierModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState(
    supplier ? { ...empty, ...supplier } : empty
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "gstin" ? value.toUpperCase() : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.phone)) {
      return setError("Phone must be 10 digits");
    }

    if (form.gstin && !GSTIN_REGEX.test(form.gstin)) {
      return setError("Invalid GSTIN format");
    }

    setSaving(true);

    try {
      if (supplier) {
        await api.put(`/suppliers/${supplier._id}`, form);
      } else {
        await api.post("/suppliers", form);
      }

      toast.success("Saved");
      onSaved();
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message || "Failed to save supplier";

      setError(message);
      toast.error("Could not save supplier");
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, extra = {}) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        {...extra}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 w-full max-w-md space-y-3"
      >
        <h2 className="text-lg font-semibold">
          {supplier ? "Edit Supplier" : "Add Supplier"}
        </h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {field("name", "Name", { required: true })}
        {field("phone", "Phone", {
          required: true,
          maxLength: 10,
          type: "tel",
        })}
        {field("gstin", "GSTIN", {
          maxLength: 15,
          placeholder: "Optional",
        })}
        {field("address", "Address")}

        <div className="flex gap-3 pt-2">
          <button
            disabled={saving}
            className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    open: false,
    supplier: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/suppliers", {
        params: { search },
      });

      setSuppliers(
        data.suppliers ||
          data.data ||
          (Array.isArray(data) ? data : [])
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load suppliers");
      setError(
        err.response?.data?.message || "Failed to load suppliers"
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;

    try {
      await api.delete(`/suppliers/${id}`);

      toast.success("Supplier deleted");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete supplier");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Suppliers</h1>

        <button
          onClick={() =>
            setModal({ open: true, supplier: null })
          }
          className="bg-amber-600 text-white px-4 py-2 rounded"
        >
          + Add Supplier
        </button>
      </div>

      <input
        className="border p-2 rounded w-full md:w-80"
        placeholder="Search name / phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">GSTIN</th>
              <th className="p-3">Address</th>
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

            {!loading && suppliers.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No suppliers found
                </td>
              </tr>
            )}

            {suppliers.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3">{s.gstin || "-"}</td>
                <td className="p-3">{s.address || "-"}</td>

                <td className="p-3 space-x-3">
                  <button
                    onClick={() =>
                      setModal({ open: true, supplier: s })
                    }
                    className="text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(s._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <SupplierModal
          supplier={modal.supplier}
          onClose={() =>
            setModal({ open: false, supplier: null })
          }
          onSaved={() => {
            setModal({ open: false, supplier: null });
            load();
          }}
        />
      )}
    </div>
  );
}
