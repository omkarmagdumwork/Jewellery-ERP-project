// End-to-end smoke test for the Jewellery ERP API.
// Run (server must be running): node tests/smoke.js
// Optional env: API_URL, ADMIN_EMAIL, ADMIN_PASSWORD

const BASE = process.env.API_URL || "http://localhost:5000/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shop.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Unique suffix so the script can be run many times
const uid = Date.now().toString().slice(-8);
const randomPhone = (seed) => `9${String(Number(uid) + seed).padStart(9, "0").slice(-9)}`;

let passed = 0;
let failed = 0;

const check = (name, condition, extra = "") => {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra}`);
  }
};

const near = (a, b) => Math.abs(a - b) < 0.01;

const section = (title) => console.log(`\n=== ${title} ===`);

const api = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // not JSON (e.g. PDF)
  }
  return { status: res.status, data };
};

// Shared state between steps
const ctx = {};

const run = async () => {
  // ---------------------------------------------------------------- AUTH
  section("1. Auth and roles");

  let r = await api("POST", "/auth/login", null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check("Admin login works (200)", r.status === 200 && r.data?.token, `got ${r.status}`);
  if (!r.data?.token) {
    console.log("\nCannot continue without admin login. Did you run `node seedAdmin.js`?");
    return;
  }
  ctx.admin = r.data.token;

  r = await api("POST", "/auth/login", null, { email: ADMIN_EMAIL, password: "wrong-password" });
  check("Wrong password rejected (401)", r.status === 401, `got ${r.status}`);

  r = await api("GET", "/auth/me", null);
  check("/me without token rejected (401)", r.status === 401, `got ${r.status}`);

  r = await api("GET", "/auth/me", ctx.admin);
  check("/me with token works (200)", r.status === 200 && r.data?.role === "admin", `got ${r.status}`);

  const salesmanEmail = `sales_${uid}@shop.com`;
  const managerEmail = `manager_${uid}@shop.com`;

  r = await api("POST", "/auth/register", ctx.admin, {
    name: "Test Salesman", email: salesmanEmail, password: "test1234", role: "salesman",
  });
  check("Admin can create a salesman (201)", r.status === 201, `got ${r.status}`);

  r = await api("POST", "/auth/register", ctx.admin, {
    name: "Test Manager", email: managerEmail, password: "test1234", role: "manager",
  });
  check("Admin can create a manager (201)", r.status === 201, `got ${r.status}`);

  r = await api("POST", "/auth/login", null, { email: salesmanEmail, password: "test1234" });
  ctx.sales = r.data?.token;
  check("Salesman login works", !!ctx.sales);

  r = await api("POST", "/auth/login", null, { email: managerEmail, password: "test1234" });
  ctx.manager = r.data?.token;
  check("Manager login works", !!ctx.manager);

  r = await api("POST", "/auth/register", ctx.sales, {
    name: "X", email: `x_${uid}@shop.com`, password: "test1234",
  });
  check("Salesman cannot register users (403)", r.status === 403, `got ${r.status}`);

  // --------------------------------------------------------------- RATES
  section("2. Rates");

  r = await api("POST", "/rates", ctx.admin, { metal: "gold", purity: "22K", ratePerGram: 6500 });
  check("Admin sets gold 22K rate (201)", r.status === 201, `got ${r.status}`);

  r = await api("POST", "/rates", ctx.admin, { metal: "gold", purity: "22K", ratePerGram: 6500 });
  check("Rate set again (history kept)", r.status === 201);

  r = await api("POST", "/rates", ctx.admin, { metal: "silver", purity: "925", ratePerGram: 85 });
  check("Admin sets silver 925 rate (201)", r.status === 201, `got ${r.status}`);

  r = await api("GET", "/rates", ctx.sales);
  const gold22 = r.data?.find?.((x) => x._id.metal === "gold" && x._id.purity === "22K");
  check("Salesman can read latest rates", r.status === 200 && gold22?.ratePerGram === 6500, `got ${r.status}`);

  r = await api("POST", "/rates", ctx.sales, { metal: "gold", purity: "22K", ratePerGram: 1 });
  check("Salesman cannot set rate (403)", r.status === 403, `got ${r.status}`);

  // ----------------------------------------------------------- INVENTORY
  section("3. Inventory");

  const productBody = {
    name: `Test Gold Ring ${uid}`,
    category: "Ring",
    metal: "gold",
    purity: "22K",
    grossWeight: 5.2,
    netWeight: 4.8,
    makingCharge: 500,
    wastagePercent: 2,
    hallmarkNo: `HM${uid}`,
    quantity: 5,
  };

  r = await api("POST", "/products", ctx.admin, productBody);
  ctx.product = r.data?._id;
  check("Admin adds product (201)", r.status === 201 && ctx.product, `got ${r.status}`);

  r = await api("POST", "/products", ctx.admin, { ...productBody, grossWeight: 3, netWeight: 4 });
  check("Net weight > gross rejected (400)", r.status === 400, `got ${r.status}`);

  r = await api("POST", "/products", ctx.sales, productBody);
  check("Salesman cannot add product (403)", r.status === 403, `got ${r.status}`);

  r = await api("GET", `/products?search=${encodeURIComponent(productBody.name)}`, ctx.sales);
  check("Product search works", r.status === 200 && r.data?.total >= 1, `got ${r.status}`);

  r = await api("PUT", `/products/${ctx.product}`, ctx.manager, { makingCharge: 500 });
  check("Manager can update product (200)", r.status === 200, `got ${r.status}`);

  // ------------------------------------------------------------ CUSTOMER
  section("4. Customers");

  const phone = randomPhone(1);
  r = await api("POST", "/customers", ctx.sales, { name: "Test Customer", phone, city: "Pune" });
  ctx.customer = r.data?._id;
  check("Salesman can add customer (201)", r.status === 201 && ctx.customer, `got ${r.status}`);

  r = await api("POST", "/customers", ctx.sales, { name: "Duplicate", phone });
  check("Duplicate phone rejected (400)", r.status === 400, `got ${r.status}`);

  r = await api("POST", "/customers", ctx.sales, { name: "Bad Phone", phone: "12345" });
  check("Invalid phone rejected (400)", r.status === 400, `got ${r.status}`);

  r = await api("GET", `/customers?search=${phone}`, ctx.sales);
  check("Customer search by phone works", r.status === 200 && r.data?.total === 1, `got ${r.status}`);

  // ------------------------------------------------------------ SUPPLIER
  section("5. Suppliers and purchases");

  r = await api("POST", "/suppliers", ctx.admin, {
    name: "Test Karagir", phone: randomPhone(2), type: "karagir", city: "Kolhapur",
  });
  ctx.supplier = r.data?._id;
  check("Admin adds supplier (201)", r.status === 201 && ctx.supplier, `got ${r.status}`);

  r = await api("GET", "/suppliers", ctx.sales);
  check("Salesman cannot view suppliers (403)", r.status === 403, `got ${r.status}`);

  const getStock = async () => (await api("GET", `/products/${ctx.product}`, ctx.admin)).data?.quantity;

  let stock = await getStock();
  r = await api("POST", "/purchases", ctx.admin, {
    supplier: ctx.supplier,
    supplierInvoiceNo: `KR-${uid}`,
    items: [{ product: ctx.product, quantity: 2, ratePerGram: 6300 }],
  });
  check("Purchase for existing product (201)", r.status === 201, `got ${r.status}`);
  // (4.8 * 6300 + 500) * 2 = 61480 ; GST 3% = 1844.40 ; total = 63324.40
  check("Purchase total is correct (63324.40)", near(r.data?.total, 63324.4), `got ${r.data?.total}`);
  check("Stock increased by 2", (await getStock()) === stock + 2);

  stock = await getStock();
  r = await api("POST", "/purchases", ctx.admin, {
    supplier: ctx.supplier,
    items: [
      { product: ctx.product, quantity: 1, ratePerGram: 6300 },
      { product: "000000000000000000000000", quantity: 1, ratePerGram: 6300 },
    ],
  });
  check("Purchase with a bad item rejected (400)", r.status === 400, `got ${r.status}`);
  check("Stock rolled back after failed purchase", (await getStock()) === stock);

  r = await api("POST", "/purchases", ctx.admin, {
    supplier: ctx.supplier,
    items: [{
      newProduct: {
        name: `Test Bangle ${uid}`, category: "Bangle", metal: "gold", purity: "22K",
        grossWeight: 10.5, netWeight: 10, makingCharge: 800, wastagePercent: 3,
      },
      quantity: 1,
      ratePerGram: 6300,
    }],
  });
  check("Purchase with a new product creates it (201)", r.status === 201, `got ${r.status}`);

  // ------------------------------------------------------------- BILLING
  section("6. Billing");

  stock = await getStock();
  r = await api("POST", "/invoices", ctx.sales, {
    customer: ctx.customer,
    items: [{ product: ctx.product, quantity: 1 }],
    paymentMode: "cash",
  });
  ctx.invoice = r.data?._id;
  ctx.invoiceNo = r.data?.invoiceNo;
  check("Salesman creates invoice (201)", r.status === 201 && ctx.invoice, `got ${r.status} ${r.data?.message || ""}`);
  check("Invoice number format INV-xxxxx", /^INV-\d{5}$/.test(ctx.invoiceNo || ""), `got ${ctx.invoiceNo}`);
  // (4.8 * 1.02 * 6500 + 500) = 32324 ; GST 3% = 969.72 ; total = 33293.72
  check("Subtotal is correct (32324)", near(r.data?.subtotal, 32324), `got ${r.data?.subtotal}`);
  check("GST is correct (969.72)", near(r.data?.gst, 969.72), `got ${r.data?.gst}`);
  check("Total is correct (33293.72)", near(r.data?.total, 33293.72), `got ${r.data?.total}`);
  check("Stock decreased by 1", (await getStock()) === stock - 1);

  stock = await getStock();
  r = await api("POST", "/invoices", ctx.sales, {
    customer: ctx.customer,
    items: [{ product: ctx.product, quantity: 9999 }],
  });
  check("Over-stock bill rejected (400)", r.status === 400, `got ${r.status}`);
  check("Stock unchanged after rejected bill", (await getStock()) === stock);

  r = await api("POST", "/invoices", ctx.sales, {
    customer: ctx.customer,
    items: [{ product: ctx.product, quantity: 1 }],
    discount: 1000,
  });
  // taxable = 31324 ; GST = 939.72 ; total = 32263.72
  check("Discount is applied before GST (32263.72)", near(r.data?.total, 32263.72), `got ${r.data?.total}`);

  // ------------------------------------------------------------- OLD GOLD
  section("7. Old gold exchange");

  r = await api("POST", "/old-gold/calculate", ctx.sales, {
    oldGold: [{ metal: "gold", purity: "22K", grossWeight: 3, stoneWeight: 0, deductionPercent: 5 }],
  });
  // 3 * 0.95 = 2.85 g * 6500 = 18525
  check("Old gold preview is correct (18525)", r.status === 200 && near(r.data?.total, 18525), `got ${r.data?.total}`);

  r = await api("POST", "/old-gold/calculate", ctx.sales, {
    oldGold: [{ metal: "gold", purity: "22K", grossWeight: 3, stoneWeight: 5 }],
  });
  check("Stone weight > gross rejected (400)", r.status === 400, `got ${r.status}`);

  stock = await getStock();
  r = await api("POST", "/invoices", ctx.sales, {
    customer: ctx.customer,
    items: [{ product: ctx.product, quantity: 1 }],
    oldGold: [{ metal: "gold", purity: "22K", grossWeight: 3, stoneWeight: 5 }],
  });
  check("Bill with invalid old gold rejected (400)", r.status === 400, `got ${r.status}`);
  check("Stock rolled back after failed old-gold bill", (await getStock()) === stock);

  r = await api("POST", "/invoices", ctx.sales, {
    customer: ctx.customer,
    items: [{ product: ctx.product, quantity: 1 }],
    oldGold: [{ metal: "gold", purity: "22K", grossWeight: 3, stoneWeight: 0, deductionPercent: 5 }],
  });
  check("Bill with old gold created (201)", r.status === 201, `got ${r.status} ${r.data?.message || ""}`);
  check("oldGoldTotal is 18525", near(r.data?.oldGoldTotal, 18525), `got ${r.data?.oldGoldTotal}`);
  check("amountPayable is 14768.72", near(r.data?.amountPayable, 14768.72), `got ${r.data?.amountPayable}`);

  r = await api("GET", "/old-gold?status=in_stock", ctx.admin);
  ctx.oldGold = r.data?.records?.[0]?._id;
  check("Admin sees old gold stock", r.status === 200 && r.data?.records?.length >= 1, `got ${r.status}`);

  r = await api("GET", "/old-gold", ctx.sales);
  check("Salesman cannot list old gold stock (403)", r.status === 403, `got ${r.status}`);

  r = await api("PUT", `/old-gold/${ctx.oldGold}/status`, ctx.manager, { status: "melted" });
  check("Manager marks old gold as melted", r.status === 200 && r.data?.status === "melted", `got ${r.status}`);

  // ------------------------------------------------- INVOICE VISIBILITY
  section("8. Invoice access rules");

  r = await api("GET", "/invoices", ctx.sales);
  check("Salesman sees own invoices", r.status === 200 && r.data?.total >= 1, `got ${r.status}`);

  r = await api("GET", `/invoices/customer/${ctx.customer}`, ctx.admin);
  check("Customer purchase history works", r.status === 200 && r.data?.count >= 1 && r.data?.totalSpent > 0, `got ${r.status}`);

  // -------------------------------------------------------------- REPORTS
  section("9. Reports");

  for (const path of ["dashboard", "sales", "stock", "profit", "top-products", "top-customers"]) {
    r = await api("GET", `/reports/${path}`, ctx.admin);
    check(`GET /reports/${path} works (200)`, r.status === 200, `got ${r.status} ${r.data?.message || ""}`);
  }

  r = await api("GET", "/reports/dashboard", ctx.admin);
  check("Dashboard shows today's sales > 0", r.data?.today?.sales > 0, `got ${r.data?.today?.sales}`);

  r = await api("GET", "/reports/dashboard", ctx.sales);
  check("Salesman cannot view reports (403)", r.status === 403, `got ${r.status}`);

  r = await api("GET", "/reports/dashboard", ctx.manager);
  check("Manager can view reports (200)", r.status === 200, `got ${r.status}`);

  // ------------------------------------------------------------------ PDF
  section("10. PDF invoice");

  let pdfRes = await fetch(`${BASE}/invoices/${ctx.invoice}/pdf`, {
    headers: { Authorization: `Bearer ${ctx.sales}` },
  });
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  check("PDF endpoint returns 200", pdfRes.status === 200, `got ${pdfRes.status}`);
  check("Content-Type is application/pdf", (pdfRes.headers.get("content-type") || "").includes("application/pdf"));
  check("File starts with %PDF", buf.subarray(0, 4).toString() === "%PDF");
  check("PDF is not empty (> 1 KB)", buf.length > 1024, `size ${buf.length}`);

  pdfRes = await fetch(`${BASE}/invoices/${ctx.invoice}/pdf`);
  check("PDF without token rejected (401)", pdfRes.status === 401, `got ${pdfRes.status}`);

  // --------------------------------------------------------- SOFT DELETE
  section("11. Delete rules");

  r = await api("DELETE", `/products/${ctx.product}`, ctx.manager);
  check("Manager cannot delete product (403)", r.status === 403, `got ${r.status}`);

  r = await api("DELETE", `/products/${ctx.product}`, ctx.admin);
  check("Admin deletes product (200)", r.status === 200, `got ${r.status}`);

  r = await api("GET", `/products/${ctx.product}`, ctx.admin);
  check("Deleted product is gone (404)", r.status === 404, `got ${r.status}`);

  r = await api("DELETE", `/customers/${ctx.customer}`, ctx.sales);
  check("Salesman cannot delete customer (403)", r.status === 403, `got ${r.status}`);

  r = await api("GET", `/invoices/${ctx.invoice}`, ctx.admin);
  check("Old invoice still readable after product delete", r.status === 200 && r.data?.items?.length > 0, `got ${r.status}`);
};

try {
  await run();
} catch (err) {
  console.error("\nTest run crashed:", err.message);
  console.error("Is the server running? Try: npm run dev");
  failed++;
}

console.log(`\n--------------------------------`);
console.log(`Passed: ${passed}   Failed: ${failed}`);
console.log(failed === 0 ? "All good! 🎉" : "Some checks failed, see the ❌ lines above.");
process.exit(failed === 0 ? 0 : 1);