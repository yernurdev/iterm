/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();
const savedToken = localStorage.getItem('iterm_token');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(savedToken);
  const [loading, setLoading] = useState(Boolean(savedToken));

  const logout = useCallback(() => {
    localStorage.removeItem('iterm_token');
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      delete axios.defaults.headers.common.Authorization;
      return;
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    fetchUser();
  }, [fetchUser, token]);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await axios.post(`${API_URL}/auth/login`, formData);
    localStorage.setItem('iterm_token', res.data.access_token);
    setToken(res.data.access_token);
  };

  const register = async (email, password, role = 'user') => {
    await axios.post(`${API_URL}/auth/register`, { email, password, role });
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
