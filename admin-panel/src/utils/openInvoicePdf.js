// import api from "../api/axios";

// // Fetch the PDF with the auth token and open it in a new tab
// export async function openInvoicePdf(invoiceId) {
//   const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" });
//   const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
//   window.open(url, "_blank");
// }


import api from "../api/axios";

// Fetch PDF using the authentication token
export async function openInvoicePdf(invoiceId) {
  if (!invoiceId) {
    throw new Error("Invoice ID is missing");
  }

  const res = await api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(
    new Blob([res.data], { type: "application/pdf" })
  );

  const pdfWindow = window.open(url, "_blank");

  if (!pdfWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Please allow pop-ups to open the PDF");
  }

  // Release the temporary URL after some time
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
