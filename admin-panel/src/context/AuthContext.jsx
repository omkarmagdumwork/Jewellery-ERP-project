
import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (
      !savedUser ||
      savedUser === "undefined" ||
      savedUser === "null"
    ) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  // Login

const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const data = response.data;

  console.log("LOGIN RESPONSE:", data);

  // Backend sends user fields directly in data
  const token = data.token;

  const loggedInUser = {
    _id: data._id,
    name: data.name,
    email: data.email,
    role: data.role,
  };

  if (!token || !loggedInUser._id || !loggedInUser.role) {
    throw new Error("Invalid login response from backend.");
  }

  // Save token and user
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(loggedInUser));

  // Update context
  setUser(loggedInUser);

  console.log("LOGIN SUCCESS:", loggedInUser);

  return loggedInUser;
};


  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
