
import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token to API requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle API errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    const status = err.response?.status;

    if (!err.response) {
      toast.error("Cannot reach the server. Check your connection.", {
        id: "network-error",
      });
    } else if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status >= 500) {
      toast.error("Server error. Please try again.", {
        id: "server-error",
      });
    }

    return Promise.reject(err);
  }
);

export default api;
