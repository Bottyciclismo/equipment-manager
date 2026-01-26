import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTANTE: Asegúrate de que esta ruta apunta a tu archivo api.js que modificamos antes
import { authAPI } from '../api/axios'; // O '../api/api' según como se llame tu archivo

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log("🚀 Enviando login...", formData);

    try {
      // 1. Llamamos a la API
      const response = await authAPI.login(formData);
      
      console.log("✅ Respuesta del servidor:", response.data);

      // 2. Verificamos si el servidor dijo "success: true"
      if (response.data.success) {
        console.log("🔐 Login autorizado. Guardando datos...");
        
        // 3. Guardamos el token y el usuario en el navegador
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log("🎉 Redirigiendo al panel...");
        
        // 4. Forzamos la recarga para limpiar errores viejos
        window.location.href = '/'; 
      } else {
        // El servidor respondió, pero dijo "NO"
        setError(response.data.message || 'Error desconocido en login');
      }

    } catch (err) {
      console.error("❌ Error en el Login:", err);
      // Si el error viene del servidor (ej: 401), mostramos su mensaje
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Usuario o contraseña incorrectos');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h2>Iniciar Sesión</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <div style={{ marginBottom: '10px' }}>
          <label>Usuario:</label><br/>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Contraseña:</label><br/>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;
