import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Package, ImageIcon, Save } from 'lucide-react';
import { brandsAPI, modelsAPI } from '../services/api';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('brands');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand_id: '',
    image_url: '',
    possible_passwords: '',
    reset_instructions: ''
  });

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
      } else if (activeTab === 'models' || activeTab === 'images') {
        const res = await modelsAPI.getAll();
        const data = res.data?.data || res.data || [];
        setModels(Array.isArray(data) ? data : []);
        // También cargamos marcas para los desplegables
        const resB = await brandsAPI.getAll();
        setBrands(resB.data?.data || resB.data || []);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      if (type === 'brand') await brandsAPI.delete(id);
      else await modelsAPI.delete(id);
      showMessage('Eliminado correctamente');
      loadData();
    } catch (error) {
      showMessage('Error al eliminar', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'brands') {
        await brandsAPI.create({ name: formData.name });
      } else {
        await modelsAPI.create(formData);
      }
      showMessage('Guardado con éxito');
      setFormData({ name: '', brand_id: '', image_url: '', possible_passwords: '', reset_instructions: '' });
      loadData();
    } catch (error) {
      showMessage('Error al guardar', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
      {/* Pestañas */}
      <div className="flex bg-gray-100 border-b">
        {[
          { id: 'brands', label: 'Marcas', icon: Tag },
          { id: 'models', label: 'Modelos', icon: Package },
          { id: 'images', label: 'Imágenes', icon: ImageIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 text-center text-white font-bold ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {message.text}
        </div>
      )}

      <div className="p-6 flex-1 overflow-auto">
        {/* FORMULARIO ÚNICO SEGÚN PESTAÑA */}
        <form onSubmit={handleSubmit} className="mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTab === 'brands' ? (
            <input
              className="border p-2 rounded-lg col-span-2"
              placeholder="Nombre de la marca (Ej: Cisco)"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          ) : (
            <>
              <select 
                className="border p-2 rounded-lg"
                value={formData.brand_id}
                onChange={e => setFormData({...formData, brand_id: e.target.value})}
                required
              >
                <option value="">Selecciona Marca...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input
                className="border p-2 rounded-lg"
                placeholder="Nombre del modelo"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                className="border p-2 rounded-lg col-span-2"
                placeholder="URL de la imagen (Ej: https://imgbb.com/foto.jpg)"
                value={formData.image_url}
                onChange={e => setFormData({...formData, image_url: e.target.value})}
              />
              <textarea
                className="border p-2 rounded-lg col-span-2"
                placeholder="Instrucciones de reseteo (Pulsa Intro para cada paso)"
                rows="3"
                value={formData.reset_instructions}
                onChange={e => setFormData({...formData, reset_instructions: e.target.value})}
              />
            </>
          )}
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 col-span-2 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Guardar Nuevo
          </button>
        </form>

        {/* LISTADOS */}
        <div className="space-y-2">
          {activeTab === 'brands' ? (
            brands.map(b => (
              <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <span className="font-bold">{b.name}</span>
                <button onClick={() => handleDelete(b.id, 'brand')} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          ) : (
            models.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <span className="text-xs text-blue-600 font-bold uppercase block">{m.brand_name}</span>
                  <span className="font-bold">{m.name}</span>
                  {activeTab === 'images' && <span className="text-xs text-gray-400 block truncate max-w-xs">{m.image_url}</span>}
                </div>
                <button onClick={() => handleDelete(m.id, 'model')} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
