import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const RateContext = createContext();

export function RateProvider({ children }) {
  const { user } = useAuth();
  const [latestRates, setLatestRates] = useState([]);

  const refreshRates = useCallback(async () => {
    try {
      const { data } = await api.get("/rates/latest");
      // Handle both [..] and { data: [..] } response shapes
      const list = Array.isArray(data) ? data : data.data || data.rates || [];
      setLatestRates(list);
    } catch (err) {
      console.error("Failed to load rates", err);
    }
  }, []);

  // Load only when logged in
  useEffect(() => {
    if (user) refreshRates();
  }, [user, refreshRates]);

  return (
    <RateContext.Provider value={{ latestRates, refreshRates }}>
      {children}
    </RateContext.Provider>
  );
}

export const useRates = () => useContext(RateContext);