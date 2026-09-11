import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create context
export const AuthContext = createContext();

// Auth Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage when app starts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
    }
  }, []);

  // Login and store user/token
  const login = (user, token) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Logout and clean up
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
