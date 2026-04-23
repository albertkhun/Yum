import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const _save = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login    = async (creds) => { const { data } = await authAPI.login(creds);    _save(data); return data; };
  const register = async (form)  => { const { data } = await authAPI.register(form);  _save(data); return data; };

  // Google: returns { isNewUser, token, user } OR { isNewUser, googleProfile }
  const googleLogin = async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    if (!data.isNewUser) _save(data);
    return data;
  };

  const completeGoogleProfile = async (profileData) => {
    const { data } = await authAPI.completeGoogleProfile(profileData);
    _save(data);
    return data;
  };

  const updateRole = async (role) => {
    const { data } = await authAPI.updateRole(role);
    const updated = { ...user, role: data.user.role };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const needsRole = user && !user.role;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register,
      googleLogin, completeGoogleProfile,
      updateRole, logout,
      isAdmin, isOwner, needsRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};