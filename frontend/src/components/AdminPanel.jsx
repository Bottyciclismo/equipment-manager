import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Users, Tag, Package, Upload, AlertCircle } from 'lucide-react';
import { usersAPI, brandsAPI, modelsAPI, uploadAPI } from '../services/api';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [images, setImages] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'users') {
        res = await usersAPI.getAll();
        const data = res.data?.data || res.data || [];
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'brands') {
        res = await brandsAPI.getAll();
        const data = res.data?.data || res.data || [];
        setBrands(Array.isArray(data) ? data : []);
      } else if (activeTab === 'models') {
        res = await modelsAPI.getAll();
        const data = res.data?.data || res.data || [];
        setModels(Array.isArray(data) ? data : []);
      } else if (activeTab === 'images') {
        res = await uploadAPI.listImages();
        const data = res.data?.data || res.data || [];
        setImages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error cargando pestaña:", activeTab, error);
      showMessage('Error al cargar datos de ' + activeTab, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id, type) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    try {
      if (type === 'user') await usersAPI.delete(id);
      else if (type === 'brand') await brandsAPI.delete(id);
      else if (type === 'model') await modelsAPI.delete(id);
      showMessage('Eliminado exitosamente');
      loadData();
    } catch (error) {
      showMessage('Error al eliminar', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'brands', label: 'Marcas', icon: Tag },
    { id: 'models', label: 'Modelos', icon: Package },
    { id: 'images', label: 'Imágenes', icon: Upload }
  ];

  return (
    <div className="bg-white h-full flex flex-col">
      {message && (
        <div className={`p-4 ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="border-b flex overflow-x-auto bg-gray-50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-10">Cargando...</div>
        ) : (
          <>
            {activeTab === 'users' && <UsersSection users={users} onRefresh={loadData} onDelete={id => handleDelete(id, 'user')} showMessage={showMessage} showForm={showForm} setShowForm={setShowForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
            {activeTab === 'brands' && <BrandsSection brands={brands} onRefresh={loadData} onDelete={id => handleDelete(id, 'brand')} showMessage={showMessage} showForm={showForm} setShowForm={setShowForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
            {activeTab === 'models' && <ModelsSection models={models} brands={brands} onRefresh={loadData} onDelete={id => handleDelete(id, 'model')} showMessage={showMessage} showForm={showForm} setShowForm={setShowForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
          </>
        )}
      </div>
    </div>
  );
}

// SECCIÓN MARCAS (Corregida para evitar pantalla azul)
function BrandsSection({ brands, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  const [name, setName] = useState('');
  useEffect(() => { if (editingItem) { setName(editingItem.name); setShowForm(true); } }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) await brandsAPI.update(editingItem.id, { name });
      else await brandsAPI.create({ name });
      showMessage('Marca guardada');
      setShowForm(false); setName(''); setEditingItem(null); onRefresh();
    } catch (e) { showMessage('Error al guardar marca', 'error'); }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-bold">Listado de Marcas</h3>
        <button onClick={() => { setShowForm(true); setEditingItem(null); setName(''); }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Nueva</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 border">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre marca" className="border p-2 w-full mb-2" required />
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {brands?.length > 0 ? brands.map(b => (
          <div key={b.id} className="border p-3 rounded flex justify-between bg-white shadow-sm">
            <span>{b.name}</span>
            <div className="flex gap-2">
              <button onClick={() => setEditingItem(b)} className="text-blue-500"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onDelete(b.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        )) : <p className="text-gray-400">No hay marcas registradas.</p>}
      </div>
    </div>
  );
}

// SECCIÓN MODELOS (Corregida)
function ModelsSection({ models, brands, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  const [formData, setFormData] = useState({ brand_id: '', name: '', image_url: '', reset_instructions: '', possible_passwords: '' });
  useEffect(() => { if (editingItem) { setFormData({...editingItem}); setShowForm(true); } }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) await modelsAPI.update(editingItem.id, formData);
      else await modelsAPI.create(formData);
      showMessage('Modelo guardado');
      setShowForm(false); setEditingItem(null); onRefresh();
    } catch (e) { showMessage('Error al guardar modelo', 'error'); }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-bold">Listado de Modelos</h3>
        <button onClick={() => { setShowForm(true); setEditingItem(null); }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Nuevo</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 border grid grid-cols-1 gap-2">
          <select value={formData.brand_id} onChange={e => setFormData({...formData, brand_id: e.target.value})} className="border p-2 rounded" required>
            <option value="">Selecciona Marca</option>
            {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre modelo" className="border p-2 rounded" required />
          <textarea value={formData.reset_instructions} onChange={e => setFormData({...formData, reset_instructions: e.target.value})} placeholder="Instrucciones" className="border p-2 rounded" />
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-gray-100 text-xs uppercase"><th className="p-2 border">Marca</th><th className="p-2 border">Modelo</th><th className="p-2 border">Acciones</th></tr></thead>
          <tbody>
            {models?.length > 0 ? models.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="p-2 border">{m.brand_name || brands.find(b => b.id === m.brand_id)?.name}</td>
                <td className="p-2 border">{m.name}</td>
                <td className="p-2 border">
                   <button onClick={() => setEditingItem(m)} className="text-blue-500 mr-2"><Edit2 className="w-4 h-4 inline"/></button>
                   <button onClick={() => onDelete(m.id)} className="text-red-500"><Trash2 className="w-4 h-4 inline"/></button>
                </td>
              </tr>
            )) : <tr><td colSpan="3" className="p-4 text-center text-gray-400">No hay modelos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// SECCIÓN USUARIOS (Simplificada para evitar errores)
function UsersSection({ users, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  return (
    <div>
       <h3 className="font-bold mb-4">Gestión de Usuarios</h3>
       <div className="bg-yellow-50 p-4 border rounded text-sm mb-4">Solo el administrador puede ver y editar usuarios.</div>
       {users?.map(u => (
         <div key={u.id} className="p-2 border-b flex justify-between">
           <span>{u.username} ({u.role})</span>
           <button onClick={() => onDelete(u.id)} className="text-red-500 text-xs">Eliminar</button>
         </div>
       ))}
    </div>
  );
}
