import { useEffect, useState } from "react";
import api from "../api/axios";

// Generic search box that calls an API and shows a dropdown of results
export default function SearchPicker({ endpoint, placeholder, renderItem, onSelect, listKeys }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(endpoint, { params: { search: q, limit: 8 } });
        const list = listKeys.map((k) => data[k]).find(Array.isArray) || (Array.isArray(data) ? data : []);
        setResults(list);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, endpoint, listKeys]);

  return (
    <div className="relative">
      <input className="border p-2 rounded w-full" placeholder={placeholder} value={q}
        onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)} />
      {open && results.length > 0 && (
        <ul className="absolute z-20 bg-white border rounded w-full mt-1 max-h-60 overflow-y-auto shadow">
          {results.map((r) => (
            <li key={r._id} className="px-3 py-2 hover:bg-amber-50 cursor-pointer text-sm"
              onClick={() => { onSelect(r); setQ(""); setOpen(false); }}>
              {renderItem(r)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}