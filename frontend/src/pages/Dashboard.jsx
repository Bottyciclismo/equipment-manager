import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Asegúrate de que la ruta a api sea correcta (services/api)
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
      // CORRECCIÓN: Usamos ?. para evitar errores y verificamos la estructura
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
      // CORRECCIÓN: Usamos ?. para evitar errores y verificamos la estructura
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
      return [passwordsString]; // Si no es JSON, lo devolvemos como un ítem de lista
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600">Reset Service Botty</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Bienvenido, {user?.username}</span>
            {isAdmin?.() && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={logout} className="p-2 hover:bg-red-50 rounded-full text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Buscar Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="">Seleccione marca</option>
                {/* CORRECCIÓN: El ?. evita que map() rompa si brands no existe */}
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = models.find(m => m.id === parseInt(e.target.value));
                  setSelectedModel(model);
                }}
                disabled={!selectedBrand || loading}
                className="w-full border rounded-md p-2"
              >
                <option value="">Seleccione modelo</option>
                {models?.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda rápida</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="Nombre..."
                />
                <button onClick={handleSearch} className="bg-blue-600 text-white p-2 rounded-md">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedModel ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-bold mb-4">Imagen</h3>
              {selectedModel.image_url ? (
                <img src={selectedModel.image_url} className="w-full rounded-lg" alt="Equipo" />
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">Sin imagen</div>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Shield /> Contraseñas</h3>
                {parsePasswords(selectedModel.possible_passwords).map((p, i) => (
                  <div key={i} className="bg-gray-50 p-2 mb-2 font-mono border rounded">{p}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-md text-gray-400">
             <Search className="w-12 h-12 mx-auto mb-2" />
             <p>Selecciona un equipo para ver los detalles</p>
          </div>
        )}
      </main>

      {showAdmin && isAdmin?.() && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
