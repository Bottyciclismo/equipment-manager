import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Package, ImageIcon, Save, Loader2 } from 'lucide-react';
import { brandsAPI, modelsAPI } from '../services/api';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('brands');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [formData, setFormData] = useState({ name: '', brand_id: '', image_url: '', reset_instructions: '' });

  useEffect(() => { loadData(); }, [activeTab]);

  onst loadData = async () => {
    setLoading(true);
    try {
      const resB = await brandsAPI.getAll();
      // Buscamos en data.data O en data directamente. Así no se le escapa.
      const dataMarcas = resB.data?.data || resB.data || [];
      setBrands(Array.isArray(dataMarcas) ? dataMarcas : []);
      
      if (activeTab === 'models' || activeTab === 'images') {
        const resM = await modelsAPI.getAll();
        // Hacemos lo mismo para los modelos
        const dataModelos = resM.data?.data || resM.data || [];
        setModels(Array.isArray(dataModelos) ? dataModelos : []);
      }
    } catch (error) { 
      console.error("Error cargando:", error); 
    } finally { 
      setLoading(false); 
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'brands') await brandsAPI.create({ name: formData.name });
      else await modelsAPI.create(formData);
      showMessage('Guardado correctamente');
      setFormData({ name: '', brand_id: '', image_url: '', reset_instructions: '' });
      loadData();
    } catch (error) { showMessage('Error al guardar', 'error'); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('¿Eliminar?')) return;
    try {
      if (type === 'brand') await brandsAPI.delete(id);
      else await modelsAPI.delete(id);
      loadData();
      showMessage('Eliminado');
    } catch (error) { showMessage('Error', 'error'); }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl flex flex-col min-h-[600px]">
      <div className="flex bg-gray-100 border-b">
        {[{id:'brands', label:'Marcas', icon:Tag}, {id:'models', label:'Modelos', icon:Package}, {id:'images', label:'Imágenes', icon:ImageIcon}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 font-bold ${activeTab === tab.id ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="mb-8 bg-blue-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTab === 'brands' ? (
            <input className="border p-2 rounded-lg col-span-2" placeholder="Nombre marca" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required />
          ) : (
            <>
              <select className="border p-2 rounded-lg" value={formData.brand_id} onChange={e => setFormData({...formData, brand_id:e.target.value})} required>
                <option value="">Selecciona Marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input className="border p-2 rounded-lg" placeholder="Modelo" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required />
              <input className="border p-2 rounded-lg col-span-2" placeholder="URL Imagen" value={formData.image_url} onChange={e => setFormData({...formData, image_url:e.target.value})} />
              <textarea className="border p-2 rounded-lg col-span-2" placeholder="Instrucciones (Enter para cada paso)" value={formData.reset_instructions} onChange={e => setFormData({...formData, reset_instructions:e.target.value})} />
            </>
          )}
          <button className="bg-blue-600 text-white p-2 rounded-lg font-bold flex justify-center items-center gap-2"><Save className="w-4 h-4"/> Guardar</button>
        </form>

        <div className="space-y-2">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div> : (
            activeTab === 'brands' ? brands.map(b => (
              <div key={b.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="font-bold">{b.name}</span>
                <button onClick={() => handleDelete(b.id, 'brand')} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
            )) : models.map(m => (
              <div key={m.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border">
                <div><span className="text-[10px] text-blue-600 font-bold block">{m.brand_name}</span><span className="font-bold">{m.name}</span></div>
                <button onClick={() => handleDelete(m.id, 'model')} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
