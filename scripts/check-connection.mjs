// Checks that the backend, admin panel and storefront are connected.
//
// Local:  node scripts/check-connection.mjs
// Live:   node scripts/check-connection.mjs https://YOUR-API.onrender.com/api https://YOUR-ADMIN.vercel.app https://YOUR-STORE.vercel.app
//
// Needs Node 18 or newer. Start the backend first.

const API = (process.argv[2] || "http://localhost:8000/api").replace(/\/$/, "");
const ADMIN = (process.argv[3] || "http://localhost:5173").replace(/\/$/, "");
const STORE = (process.argv[4] || "http://localhost:5174").replace(/\/$/, "");

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (err) {
    results.push({ name, ok: false, detail: err.cause?.code || err.message });
  }
}

async function get(path, origin) {
  const res = await fetch(`${API}${path}`, { headers: origin ? { Origin: origin } : {} });
  const body = await res.json().catch(() => null);
  return { res, body };
}

await check("Backend is running and connected to the database", async () => {
  const { res, body } = await get("/health");
  if (!res.ok) throw new Error(`/health returned ${res.status}. Is the health route added?`);
  if (body?.db !== "connected") throw new Error(`database is ${body?.db}. Check MONGO_URI and Atlas Network Access`);
  return "database connected";
});

await check("Storefront API: site settings, banners and rates", async () => {
  const { res, body } = await get("/public/site");
  if (!res.ok || !body?.settings) throw new Error(`/public/site returned ${res.status}. Are the public routes mounted?`);
  const rateCount = body.rates?.length || 0;
  return `${body.banners?.length || 0} banners, ${rateCount} rates${rateCount === 0 ? " (set today's rate in the admin panel)" : ""}`;
});

await check("Storefront API: products", async () => {
  const { res, body } = await get("/public/products?limit=1");
  if (!res.ok || !Array.isArray(body?.products)) throw new Error(`/public/products returned ${res.status}`);
  return `${body.total} products visible to customers`;
});

await check("Admin API is protected", async () => {
  const { res } = await get("/cms/banners");
  if (res.status !== 401 && res.status !== 403) throw new Error(`expected 401 without a token, got ${res.status}. The admin API is open!`);
  return `refuses anonymous requests (${res.status})`;
});

for (const [label, origin] of [["Admin panel", ADMIN], ["Storefront", STORE]]) {
  await check(`${label} is allowed by CORS`, async () => {
    const { res } = await get("/public/site", origin);
    const allowed = res.headers.get("access-control-allow-origin");
    if (allowed !== origin && allowed !== "*") throw new Error(`${origin} is not allowed. Add it to CLIENT_URLS in the backend .env`);
    return origin;
  });
}

console.log(`\nChecking ${API}\n`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}\n      ${r.detail}`);

const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? "\nAll checks passed. The three apps are connected." : `\n${failed} check(s) failed. Fix them from the top down.`);
process.exit(failed === 0 ? 0 : 1);
