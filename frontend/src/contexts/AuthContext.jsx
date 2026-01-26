import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api'; // Asegúrate que apunte a tu api.js o axios.js

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ESTA ES LA CLAVE: Al cargar la página, verificamos sin romper nada
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          // Si hay token guardado, asumimos que es válido para dejarte entrar rápido
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("⚠️ Error recuperando sesión (pero no bloqueamos la app):", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        // Pase lo que pase, quitamos el "Cargando..." para que se vea la web
        setLoading(false); 
      }
    };

    checkAuth();
  }, []);

  // Función de Login conectada con tu backend
  const login = async (data) => {
    try {
      const res = await authAPI.login(data);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
