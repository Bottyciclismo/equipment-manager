import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { brandsAPI, modelsAPI } from '../services/api';
import { Search, LogOut, Settings, Shield, Image as ImageIcon } from 'lucide-react';
import AdminPanel from '../components/AdminPanel';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      const response = await brandsAPI.getAll();
      const data = response.data.data || response.data || [];
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      setBrands([]);
    }
  };

  const loadModels = async (brandId) => {
    setLoading(true);
    try {
      const response = await brandsAPI.getModels(brandId);
      const data = response.data.data || response.data || [];
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar modelos:', error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await modelsAPI.search(searchQuery);
      const data = response.data.data || response.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setSelectedModel(data[0]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePasswords = (passwordsString) => {
    if (!passwordsString) return [];
    try {
      return typeof passwordsString === 'string' ? JSON.parse(passwordsString) : passwordsString;
    } catch {
      return [passwordsString];
    }
  };

  // Forzamos el cierre de sesión real
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-blue-700">Reset Service Botty</h1>
            <p className="text-xs text-gray-500">Gestión de Equipos y Resets</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Hola, {user?.username || 'Usuario'}</p>
              <p className="text-xs text-green-600 font-bold uppercase">Conectado</p>
            </div>

            {/* BOTÓN DE ADMIN FORZADO PARA USUARIO 'admin' */}
            {(user?.username === 'admin' || isAdmin?.()) && (
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all shadow-lg"
              >
                <Settings className="w-4 h-4" />
                <span>Panel Admin</span>
              </button>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Search className="text-blue-600" /> Localizador de Equipos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Seleccione marca...</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label>
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = models.find(m => m.id === parseInt(e.target.value));
                  setSelectedModel(model);
                }}
                disabled={!selectedBrand || loading}
                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
              >
                <option value="">Seleccione modelo...</option>
                {models?.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsqueda directa</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none"
                  placeholder="Escribe modelo..."
                />
                <button 
                  onClick={handleSearch} 
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-md transition-all"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {selectedModel ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                 <h3 className="font-bold text-gray-700">Referencia Visual</h3>
              </div>
              {selectedModel.image_url ? (
                <img src={selectedModel.image_url} className="w-full h-auto object-cover" alt="Equipo" />
              ) : (
                <div className="aspect-video bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Sin imagen disponible</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="text-green-500 w-5 h-5" /> Contraseñas de Acceso
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {parsePasswords(selectedModel.possible_passwords).map((p, i) => (
                    <div key={i} className="bg-blue-50 text-blue-700 p-4 font-mono text-lg border border-blue-100 rounded-xl flex justify-between items-center">
                      <span>{p}</span>
                      <span className="text-[10px] bg-blue-200 px-2 py-1 rounded text-blue-800 uppercase font-sans">Master</span>
                    </div>
                  ))}
                  {parsePasswords(selectedModel.possible_passwords).length === 0 && (
                    <p className="text-gray-400 italic">No hay claves registradas</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Instrucciones de Desbloqueo</h3>
                <div className="bg-gray-50 p-4 rounded-xl text-gray-600 text-sm leading-relaxed border border-gray-100">
                  {selectedModel.reset_instructions || "No hay instrucciones específicas para este modelo."}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
             <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-700">¿Qué equipo buscas?</h3>
             <p className="text-gray-400 max-w-xs mx-auto">Selecciona una marca y modelo para ver las claves de acceso y manuales.</p>
          </div>
        )}
      </main>

      {/* MODAL DEL PANEL ADMIN */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAdmin(false)}></div>
            <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl z-50 overflow-hidden">
               <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
                  <h2 className="font-bold">Panel de Gestión Administrativa</h2>
                  <button onClick={() => setShowAdmin(false)} className="hover:bg-gray-700 p-1 rounded">✕ Cerrar</button>
               </div>
               <div className="p-6 max-h-[80vh] overflow-y-auto">
                  <AdminPanel onClose={() => setShowAdmin(false)} />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
