import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Đọc user từ localStorage một lần duy nhất khi khởi động
function readUserFromStorage() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUserFromStorage);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Computed role helpers (so sánh bằng string vì DB lưu ENUM '1','2','3')
  const role = user?.role ? String(user.role) : null;
  const isStudent = role === '1';
  const isTeacher = role === '2';
  const isAdmin   = role === '3';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isStudent, isTeacher, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
