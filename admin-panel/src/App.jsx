import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RateProvider } from "./context/RateContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rates from "./pages/Rates";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Customers from "./pages/Customers";
import CustomerHistory from "./pages/CustomerHistory";
import Billing from "./pages/Billing";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import PurchaseForm from "./pages/PurchaseForm";
import { Toaster } from "react-hot-toast";
import Reports from "./pages/Reports";
import Banners from "./pages/Banners";
import Testimonials from "./pages/Testimonials";
import Enquiries from "./pages/Enquiries";
import SiteSettings from "./pages/SiteSettings";

export default function App() {
  return (

    <AuthProvider>
      <RateProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rates" element={<Rates />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id/history" element={<CustomerHistory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />

                <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
                  <Route path="/products/new" element={<ProductForm />} />
                  <Route path="/products/:id/edit" element={<ProductForm />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/purchases/new" element={<PurchaseForm />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/website/banners" element={<Banners />} />
                  <Route path="/website/testimonials" element={<Testimonials />} />
                  <Route path="/website/enquiries" element={<Enquiries />} />
                  <Route path="/website/settings" element={<SiteSettings />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </RateProvider>
    </AuthProvider>
  );
}