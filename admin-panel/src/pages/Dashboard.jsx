import React, { useState, useEffect } from "react";
import axios from "../api/axios";

export default function Dashboard() {
  const [rates, setRates] = useState([]);
  const [stats, setStats] = useState(null);

  // Dashboard data ani latest rates fetch karne
  const fetchDashboardData = async () => {
    try {
      // Rates fetch kara
      const ratesRes = await axios.get("/rates/latest");
      const ratesData = Array.isArray(ratesRes.data) ? ratesRes.data : ratesRes.data.rates || [];
      setRates(ratesData);

      // Jar reports/stats chi API asel tar ti pan ithe call karu shaktos
      // const statsRes = await axios.get("/reports/stats");
      // setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* Today's Rates Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Today's Live Rates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rates.length > 0 ? (
            rates.map((rate, index) => (
              <div key={index} className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">
                  {rate.metal} ({rate.purity})
                </p>
                <p className="text-xl font-bold text-orange-600 mt-1">₹{rate.ratePerGram} /g</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">Today's rate is not set.</p>
          )}
        </div>
      </div>

      {/* Baki dashboard stats / quick links ithe astil */}
    </div>
  );
}