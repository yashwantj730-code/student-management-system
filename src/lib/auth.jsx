import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, TOKEN_KEY, getToken } from "./api.js";

const AuthCtx = createContext(null);
const USER_KEY = "sms_user";

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => { try { return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null; } catch { return null; } });

  const logout = useCallback((message) => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setUser(null);
    navigate("/login", { replace: true });
    if (message) toast(message, { icon: "👋" });
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api("/auth/login", { method: "POST", body: { email, password } });
    localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  useEffect(() => {
    if (getToken()) api("/auth/me").then(r => { setUser(r.user); localStorage.setItem(USER_KEY, JSON.stringify(r.user)); }).catch(() => {});
    const onUnauth = e => { if (getToken()) logout(e.detail || "Your session expired. Please log in again."); };
    window.addEventListener("sms:unauthorized", onUnauth);
    return () => window.removeEventListener("sms:unauthorized", onUnauth);
  }, [logout]);

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
