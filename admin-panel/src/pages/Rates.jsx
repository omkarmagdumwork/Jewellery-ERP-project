import React, { useState, useEffect } from "react";
import axios from "../api/axios";

export default function Rates() {
  const [rates, setRates] = useState([]);
  const [metal, setMetal] = useState("Gold");
  const [purity, setPurity] = useState("24K");
  const [ratePerGram, setRatePerGram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch latest rates
  const fetchRates = async () => {
    try {
      const response = await axios.get("/rates/latest");
      // Handle both array or object responses gracefully
      const data = Array.isArray(response.data) ? response.data : response.data.rates || [];
      setRates(data);
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Handle setting new rate
  const handleSetRate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!ratePerGram || isNaN(ratePerGram)) {
      setError("Please enter a valid rate per gram");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/rates", {
        metal,
        purity,
        ratePerGram: Number(ratePerGram),
      });

      setSuccess("Rate updated successfully!");
      setRatePerGram("");
      fetchRates(); // Refresh table list
    } catch (err) {
      setError(err.response?.data?.message || "Could not save rate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Daily Rates</h1>

      {/* Error / Success Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Rate Entry Form Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <form onSubmit={handleSetRate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metal</label>
            <select
              value={metal}
              onChange={(e) => setMetal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="925">925 (Silver)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate / gram (₹)</label>
            <input
              type="number"
              placeholder="e.g. 6500"
              value={ratePerGram}
              onChange={(e) => setRatePerGram(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set Rate"}
            </button>
          </div>
        </form>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Metal</th>
              <th className="p-4 font-semibold">Purity</th>
              <th className="p-4 font-semibold">Rate/g</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700 text-sm">
            {rates.length > 0 ? (
              rates.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-4">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-4 font-medium">{item.metal || "Gold"}</td>
                  <td className="p-4">{item.purity || "N/A"}</td>
                  <td className="p-4 font-semibold text-gray-900">₹{item.ratePerGram || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400">
                  No rates set yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}