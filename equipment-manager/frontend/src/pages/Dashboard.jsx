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
      setBrands(response.data.data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  const loadModels = async (brandId) => {
    setLoading(true);
    try {
      const response = await brandsAPI.getModels(brandId);
      setModels(response.data.data);
    } catch (error) {
      console.error('Error al cargar modelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await modelsAPI.search(searchQuery);
      const results = response.data.data;
      if (results.length > 0) {
        setSelectedModel(results[0]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePasswords = (passwordsString) => {
    try {
      return JSON.parse(passwordsString);
    } catch {
      return [];
    }
  };

  return (
    <div className="Sin color de fondo">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reset Service Botty</h1>
              <p className="text-sm text-gray-600">
                Bienvenido, <span className="font-medium">{user?.username}</span>
                {isAdmin() && <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">Admin</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin() && (
                <button
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={logout}
                className="btn btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de búsqueda */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Buscar Equipo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="input"
              >
                <option value="">Seleccione una marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = models.find(m => m.id === parseInt(e.target.value));
                  setSelectedModel(model);
                }}
                className="input"
                disabled={!selectedBrand || loading}
              >
                <option value="">Seleccione un modelo</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda rápida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda rápida
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input"
                  placeholder="Nombre del modelo..."
                />
                <button
                  onClick={handleSearch}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información del modelo */}
        {selectedModel && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Imagen */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Imagen del Equipo</h3>
              {selectedModel.image_url ? (
                <img
                  src={selectedModel.image_url}
                  alt={selectedModel.name}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ESin imagen%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>Sin imagen disponible</p>
                  </div>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="space-y-6">
              {/* Contraseñas posibles */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  Contraseñas Posibles
                </h3>
                <div className="space-y-2">
                  {parsePasswords(selectedModel.possible_passwords).map((pwd, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="text-sm font-mono text-gray-800">
                        {pwd || '(vacío)'}
                      </code>
                    </div>
                  ))}
                  {parsePasswords(selectedModel.possible_passwords).length === 0 && (
                    <p className="text-gray-500 text-sm">No hay contraseñas registradas</p>
                  )}
                </div>
              </div>

              {/* Instrucciones de reset */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  Instrucciones de Reset
                </h3>
                <div className="prose prose-sm max-w-none">
                  {selectedModel.reset_instructions ? (
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {selectedModel.reset_instructions}
                    </pre>
                  ) : (
                    <p className="text-gray-500">No hay instrucciones disponibles</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedModel && (
          <div className="card text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Seleccione un equipo
            </h3>
            <p className="text-gray-500">
              Elija una marca y modelo o use la búsqueda rápida
            </p>
          </div>
        )}
      </div>

    {/* Panel de Administración */}
      {showAdmin && isAdmin() && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}