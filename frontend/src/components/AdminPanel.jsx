import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Users, Tag, Package, Upload, AlertCircle } from 'lucide-react';
import { usersAPI, brandsAPI, modelsAPI, uploadAPI } from '../services/api';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('brands'); // Empezamos en marcas que sabemos que funciona
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'brands') {
        const res = await brandsAPI.getAll();
        const data = res.data?.data || res.data || [];
        setBrands(Array.isArray(data) ? data : []);
      } else if (activeTab === 'models') {
        const res = await modelsAPI.getAll();
        // SEGURIDAD: Si res.data no existe, ponemos lista vacía
        const data = res?.data?.data || res?.data || [];
        setModels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      // Evitamos que explote poniendo listas vacías si hay error
      setBrands([]);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const tabs = [
    { id: 'brands', label: 'Marcas', icon: Tag },
    { id: 'models', label: 'Modelos', icon: Package }
  ];

  return (
    <div className="bg-white h-full flex flex-col min-h-[500px]">
      {/* Tabs */}
      <div className="border-b flex bg-gray-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
            className={`px-6 py-4 font-medium flex items-center gap-2 ${
              activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-10">Cargando datos...</div>
        ) : (
          <>
            {activeTab === 'brands' && (
               <BrandsSection brands={brands} onRefresh={loadData} showMessage={showMessage} />
            )}
            {activeTab === 'models' && (
               <ModelsSection models={models} brands={brands} onRefresh={loadData} showMessage={showMessage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// SECCIÓN MARCAS
function BrandsSection({ brands, onRefresh, showMessage }) {
  const [name, setName] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await brandsAPI.create({ name });
      showMessage('Marca creada');
      setName('');
      onRefresh();
    } catch (e) { showMessage('Error al guardar', 'error'); }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nueva marca..." className="border p-2 rounded flex-1" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Añadir</button>
      </form>
      <div className="grid gap-2">
        {brands?.map(b => (
          <div key={b.id} className="p-3 border rounded bg-gray-50 flex justify-between">
            <span>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// SECCIÓN MODELOS (CON PROTECCIÓN ANTI-AZUL)
function ModelsSection({ models, brands, onRefresh, showMessage }) {
  const [formData, setFormData] = useState({ brand_id: '', name: '', reset_instructions: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await modelsAPI.create(formData);
      showMessage('Modelo creado');
      setFormData({ brand_id: '', name: '', reset_instructions: '' });
      onRefresh();
    } catch (e) { showMessage('Error al guardar', 'error'); }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 bg-gray-50 p-4 rounded border">
        <select value={formData.brand_id} onChange={e => setFormData({...formData, brand_id: e.target.value})} className="border p-2 rounded" required>
          <option value="">Selecciona Marca</option>
          {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre modelo" className="border p-2 rounded" required />
        <textarea value={formData.reset_instructions} onChange={e => setFormData({...formData, reset_instructions: e.target.value})} placeholder="Instrucciones..." className="border p-2 rounded" />
        <button type="submit" className="bg-green-600 text-white py-2 rounded">Guardar Modelo</button>
      </form>
      
      <table className="w-full border-collapse">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2 border">Marca</th><th className="p-2 border">Modelo</th></tr></thead>
        <tbody>
          {models?.length > 0 ? models.map(m => (
            <tr key={m.id} className="border-b">
              <td className="p-2 border">{m.brand_name || 'Cargando...'}</td>
              <td className="p-2 border font-bold">{m.name}</td>
            </tr>
          )) : (
            <tr><td colSpan="2" className="p-4 text-center text-gray-400">No hay modelos todavía.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
