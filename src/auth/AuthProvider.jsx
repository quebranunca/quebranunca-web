import React, { createContext, useState, useEffect, useCallback } from "react";                         
import { login as svcLogin, logout as svcLogout } from "./authService";

export const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
});

function decodeToken(token) {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser({
          email: decoded.sub || decoded.email,
          roles: decoded.role || decoded.roles,
        });
      } else {
        sessionStorage.removeItem("accessToken");
      }
    }
  }, []);

  async function login(email, password) {
    const data = await svcLogin(email, password);

    sessionStorage.setItem("accessToken", data.accessToken);
    
    const decoded = decodeToken(data.accessToken);
    if (decoded) {
      setUser({ email: decoded.email || decoded.sub });
    }
    return data;
  }

  async function logout() {
    await svcLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}