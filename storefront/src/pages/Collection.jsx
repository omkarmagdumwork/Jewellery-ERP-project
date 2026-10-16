import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import usePageTitle from "../hooks/usePageTitle";
import { CATEGORIES } from "../utils";
import ProductGrid, { ProductGridSkeleton } from "../components/ProductGrid";

const SORTS = [
  { value: "new", label: "Newest first" },
  { value: "weightAsc", label: "Weight, low to high" },
  { value: "weightDesc", label: "Weight, high to low" },
];

export default function Collection() {
  const [params, setParams] = useSearchParams();
  const metal = params.get("metal") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "new";
  const q = params.get("q") || "";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const [search, setSearch] = useState(q);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const title = metal ? `${metal} jewellery` : category ? `${category}s` : "All jewellery";
  usePageTitle(title);

  // Keep the search box in step with the address bar (for example after "Clear filters")
  useEffect(() => { setSearch(q); }, [q]);

  // Change filters through the URL so links can be shared and the back button works
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    api
      .get("/public/products", { params: { metal, category, sort, search: q, page, limit: 12 } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError("We could not load the jewellery. Please try again."); });
    window.scrollTo({ top: 0 });
    return () => { cancelled = true; };
  }, [metal, category, sort, q, page]);

  const hasFilters = metal || category || q;

  // Safe products check
  const productsList = data?.products || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl text-velvet-900 md:text-5xl">{title}</h1>
      {data && <p className="mt-2 text-silver-600">{data.total} {data.total === 1 ? "piece" : "pieces"}</p>}

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-end gap-4 border-y border-silver-300 py-4">
        <div role="group" aria-label="Metal" className="flex border border-silver-300">
          {[["", "All"], ["Gold", "Gold"], ["Silver", "Silver"]].map(([value, label]) => (
            <button key={label} onClick={() => update({ metal: value })} aria-pressed={metal === value}
              className={`px-4 py-2 text-sm ${metal === value ? "bg-velvet-900 text-gold-300" : "bg-white text-ink hover:bg-silver-100"}`}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm text-silver-600">Category</label>
          <select id="category" value={category} onChange={(e) => update({ category: e.target.value })} className="field w-auto">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-sm text-silver-600">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === "new" ? "" : e.target.value })} className="field w-auto">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }); }} className="flex flex-1 items-end gap-2 sm:max-w-xs">
          <div className="flex-1">
            <label htmlFor="search" className="mb-1 block text-sm text-silver-600">Search by name</label>
            <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="field" />
          </div>
          <button className="btn-velvet btn-sm py-[0.7rem]">Search</button>
        </form>
      </div>

      {/* Results */}
      <div className="mt-8">
        {error && <p className="py-10 text-center text-[#b3261e]" role="alert">{error}</p>}
        {!error && data === null && <ProductGridSkeleton count={8} />}
        {data && productsList.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl text-ink">No pieces match these filters</p>
            {hasFilters && (
              <button className="btn-outline-dark mt-5" onClick={() => setParams(new URLSearchParams())}>Clear filters</button>
            )}
          </div>
        )}
        {data && productsList.length > 0 && <ProductGrid products={productsList} />}
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="btn-outline-dark btn-sm">Previous</button>
          <span className="text-silver-600">Page {page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => update({ page: String(page + 1) })} className="btn-outline-dark btn-sm">Next</button>
        </nav>
      )}
    </div>
  );
}