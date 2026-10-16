import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import api from "../api/axios";
import { PageLoader } from "../components/Spinner";
import { money } from "../utils/billing";
import { downloadCsv } from "../utils/csv";

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const thisMonthStr = () => todayStr().slice(0, 7);

// Return the first defined value among the given keys
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  return 0;
};
const unwrap = (data) => data?.report ?? data?.data ?? data;
const asArray = (v) => (Array.isArray(v) ? v : []);
const sum = (rows, fn) => rows.reduce((s, r) => s + (Number(fn(r)) || 0), 0);

// Fetch a report whenever the endpoint or params change
function useReport(endpoint, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get(endpoint, { params })
      .then(({ data }) => { if (!cancelled) setData(unwrap(data)); })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err.response?.data?.message || "Failed to load report");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey]);

  return { data, loading, error };
}

// ---------- small UI pieces ----------
function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ReportTable({ columns, rows, footer, emptyText = "No data found" }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>{columns.map((c) => <th key={c.label} className="p-3">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="p-3 text-gray-500" colSpan={columns.length}>{emptyText}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => <td key={c.label} className="p-3">{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
        {footer && rows.length > 0 && (
          <tfoot className="bg-gray-50 font-semibold">
            <tr>{footer.map((f, i) => <td key={i} className="p-3">{f}</td>)}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// Wrapper that handles loading and error states
function State({ loading, error, children }) {
  if (loading) return <PageLoader />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  return children;
}

// ---------- 1. Daily ----------
function DailyReport() {
  const [date, setDate] = useState(todayStr());
  const { data, loading, error } = useReport("/reports/daily", { date });

  return (
    <div className="space-y-4">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 rounded" />
      <State loading={loading} error={error}>
        {/* Adjust keys to match your daily report response */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat label="Total bills" value={pick(data, "totalBills", "count", "bills")} />
          <Stat label="Total amount" value={money(pick(data, "totalAmount", "total"))} />
          <Stat label="Cash" value={money(pick(data, "cash", "cashTotal"))} />
          <Stat label="UPI" value={money(pick(data, "upi", "upiTotal"))} />
          <Stat label="Card" value={money(pick(data, "card", "cardTotal"))} />
        </div>
      </State>
    </div>
  );
}

// ---------- 2. Monthly ----------
function MonthlyReport() {
  const [month, setMonth] = useState(thisMonthStr());
  const { data, loading, error } = useReport("/reports/monthly", { month });

  const rows = asArray(data).map((r) => ({
    day: String(r.date || r._id || r.day || ""),
    bills: pick(r, "bills", "count", "totalBills"),
    total: pick(r, "total", "totalAmount", "amount"),
  }));

  return (
    <div className="space-y-4">
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded" />
      <State loading={loading} error={error}>
        {rows.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rows.map((r) => ({ ...r, label: r.day.slice(-2) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip formatter={(v) => money(v)} labelFormatter={(d) => `Day ${d}`} />
                <Bar dataKey="total" name="Sales" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <ReportTable
          columns={[
            { label: "Date", render: (r) => r.day },
            { label: "Bills", render: (r) => r.bills },
            { label: "Sales", render: (r) => money(r.total) },
          ]}
          rows={rows}
          footer={["Total", sum(rows, (r) => r.bills), money(sum(rows, (r) => r.total))]}
          emptyText="No sales for this month"
        />
      </State>
    </div>
  );
}

// ---------- 3. Stock ----------
function StockReport() {
  const { data, loading, error } = useReport("/reports/stock");

  const rows = asArray(data).map((r) => ({
    metal: r.metal ?? r._id?.metal ?? "-",
    category: r.category ?? r._id?.category ?? "-",
    weight: pick(r, "totalWeight", "weight", "netWeight"),
    quantity: pick(r, "quantity", "totalQuantity", "count"),
  }));

  return (
    <State loading={loading} error={error}>
      <ReportTable
        columns={[
          { label: "Metal", render: (r) => r.metal },
          { label: "Category", render: (r) => r.category },
          { label: "Total weight (g)", render: (r) => Number(r.weight).toFixed(3) },
          { label: "Quantity", render: (r) => r.quantity },
        ]}
        rows={rows}
        footer={["Total", "", sum(rows, (r) => r.weight).toFixed(3), sum(rows, (r) => r.quantity)]}
      />
    </State>
  );
}

// ---------- 4. Top products / customers ----------
function TopReport() {
  const products = useReport("/reports/top-products");
  const customers = useReport("/reports/top-customers");

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <h2 className="font-medium">Top products</h2>
        <State loading={products.loading} error={products.error}>
          <ReportTable
            columns={[
              { label: "Product", render: (r) => r.name ?? r.product?.name ?? r._id?.name ?? "-" },
              { label: "Sold", render: (r) => pick(r, "quantitySold", "quantity", "sold") },
              { label: "Revenue", render: (r) => money(pick(r, "revenue", "totalAmount", "total")) },
            ]}
            rows={asArray(products.data)}
          />
        </State>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Top customers</h2>
        <State loading={customers.loading} error={customers.error}>
          <ReportTable
            columns={[
              { label: "Customer", render: (r) => r.name ?? r.customer?.name ?? "-" },
              { label: "Bills", render: (r) => pick(r, "bills", "count", "totalBills") },
              { label: "Total purchase", render: (r) => money(pick(r, "totalPurchase", "total", "totalAmount")) },
            ]}
            rows={asArray(customers.data)}
          />
        </State>
      </div>
    </div>
  );
}

// ---------- 5. Dues ----------
function DuesReport() {
  const { data, loading, error } = useReport("/reports/dues");

  const rows = asArray(data).map((r) => ({
    id: r.customerId ?? r.customer?._id ?? r._id,
    name: r.name ?? r.customer?.name ?? "-",
    phone: r.phone ?? r.customer?.phone ?? "-",
    due: pick(r, "totalDue", "due", "dueAmount"),
  }));

  return (
    <State loading={loading} error={error}>
      <ReportTable
        columns={[
          { label: "Customer", render: (r) => r.name },
          { label: "Phone", render: (r) => r.phone },
          { label: "Due", render: (r) => <span className="text-red-600 font-medium">{money(r.due)}</span> },
          {
            label: "History",
            render: (r) =>
              r.id ? <Link to={`/customers/${r.id}/history`} className="text-blue-600">View</Link> : "-",
          },
        ]}
        rows={rows}
        footer={["Total due", "", money(sum(rows, (r) => r.due)), ""]}
        emptyText="No pending dues"
      />
    </State>
  );
}

// ---------- 6. GST ----------
function GstReport() {
  const [month, setMonth] = useState(thisMonthStr());
  const { data, loading, error } = useReport("/reports/gst", { month });

  // Supports either an array of rows or { totals..., invoices: [...] }
  const rawRows = Array.isArray(data) ? data : asArray(data?.invoices ?? data?.rows);
  const rows = rawRows.map((r) => ({
    invoiceNo: r.invoiceNo ?? r._id ?? "-",
    date: r.date || r.createdAt || "",
    taxable: pick(r, "taxable", "subTotal", "taxableAmount"),
    gst: pick(r, "gst", "gstAmount"),
    total: pick(r, "grandTotal", "total"),
  }));

  const hasSummary = data && !Array.isArray(data) && data.totalGst !== undefined;
  const totalTaxable = hasSummary ? pick(data, "totalTaxable", "taxable") : sum(rows, (r) => r.taxable);
  const totalGst = hasSummary ? data.totalGst : sum(rows, (r) => r.gst);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

  const handleExport = () => {
    downloadCsv(
      `gst-report-${month}.csv`,
      ["Invoice No", "Date", "Taxable Value", "GST", "Invoice Total"],
      rows.map((r) => [r.invoiceNo, formatDate(r.date), r.taxable, r.gst, r.total])
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded" />
        <button onClick={handleExport} disabled={rows.length === 0}
          className="border px-4 py-2 rounded disabled:opacity-40">
          Export CSV
        </button>
      </div>
      <State loading={loading} error={error}>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Stat label="Taxable value" value={money(totalTaxable)} />
          <Stat label="GST collected" value={money(totalGst)} />
        </div>
        {rows.length > 0 && (
          <ReportTable
            columns={[
              { label: "Invoice", render: (r) => r.invoiceNo },
              { label: "Date", render: (r) => formatDate(r.date) },
              { label: "Taxable", render: (r) => money(r.taxable) },
              { label: "GST", render: (r) => money(r.gst) },
              { label: "Total", render: (r) => money(r.total) },
            ]}
            rows={rows}
          />
        )}
      </State>
    </div>
  );
}

// ---------- page ----------
const TABS = [
  { key: "daily", label: "Daily", Component: DailyReport },
  { key: "monthly", label: "Monthly", Component: MonthlyReport },
  { key: "stock", label: "Stock", Component: StockReport },
  { key: "top", label: "Top sellers", Component: TopReport },
  { key: "dues", label: "Dues", Component: DuesReport },
  { key: "gst", label: "GST", Component: GstReport },
];

export default function Reports() {
  const [tab, setTab] = useState("daily");
  const Active = TABS.find((t) => t.key === tab).Component;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>

      {/* Tabs scroll sideways on small screens */}
      <div className="flex gap-1 border-b overflow-x-auto whitespace-nowrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 ${
              tab === t.key ? "border-amber-600 text-amber-700 font-medium" : "border-transparent text-gray-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}