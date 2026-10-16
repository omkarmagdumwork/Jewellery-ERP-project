import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      console.log("STATUS:", err.response?.status);
      console.log("RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    } finally {
    setLoading(false);
  }
};

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow w-96 space-y-4">
      <h1 className="text-2xl font-bold text-center">Jewellery ERP</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border p-2 rounded" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full border p-2 rounded" type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={loading} className="w-full bg-amber-600 text-white p-2 rounded disabled:opacity-50">
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  </div>
);
}