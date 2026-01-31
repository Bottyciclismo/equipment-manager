import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Users, Tag, Package, Upload, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { usersAPI, brandsAPI, modelsAPI, uploadAPI } from '../services/api';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Estados para cada sección
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [images, setImages] = useState([]);

  // Estados para formularios
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await usersAPI.getAll();
        setUsers(res.data.data);
      } else if (activeTab === 'brands') {
        const res = await brandsAPI.getAll();
        setBrands(res.data.data);
      } else if (activeTab === 'models') {
        const res = await modelsAPI.getAll();
        setModels(res.data.data);
      } else if (activeTab === 'images') {
        const res = await uploadAPI.listImages();
        setImages(res.data.data);
      }
    } catch (error) {
      showMessage('Error al cargar datos', 'error');
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
      showMessage(error.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'brands', label: 'Marcas', icon: Tag },
    { id: 'models', label: 'Modelos', icon: Package },
    { id: 'images', label: 'Imágenes', icon: Upload }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <button onClick={onClose} className="p-2 hover:bg-primary-700 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b flex overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className={`px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'users' && (
            <UsersSection
              users={users}
              onEdit={setEditingItem}
              onDelete={(id) => handleDelete(id, 'user')}
              onRefresh={loadData}
              showMessage={showMessage}
              showForm={showForm}
              setShowForm={setShowForm}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
            />
          )}
          {activeTab === 'brands' && (
            <BrandsSection
              brands={brands}
              onEdit={setEditingItem}
              onDelete={(id) => handleDelete(id, 'brand')}
              onRefresh={loadData}
              showMessage={showMessage}
              showForm={showForm}
              setShowForm={setShowForm}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
            />
          )}
          {activeTab === 'models' && (
            <ModelsSection
              models={models}
              brands={brands}
              onEdit={setEditingItem}
              onDelete={(id) => handleDelete(id, 'model')}
              onRefresh={loadData}
              showMessage={showMessage}
              showForm={showForm}
              setShowForm={setShowForm}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
            />
          )}
          {activeTab === 'images' && (
            <ImagesSection
              images={images}
              onRefresh={loadData}
              showMessage={showMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== USERS SECTION ====================
function UsersSection({ users, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user', active: true });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        username: editingItem.username,
        password: '',
        role: editingItem.role,
        active: editingItem.active
      });
      setShowForm(true);
    }
  }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await usersAPI.update(editingItem.id, formData);
        showMessage('Usuario actualizado');
      } else {
        await usersAPI.create(formData);
        showMessage('Usuario creado');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ username: '', password: '', role: 'user', active: true });
      onRefresh();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Usuarios</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingItem(null);
            setFormData({ username: '', password: '', role: 'user', active: true });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Usuario</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña {editingItem && '(dejar vacío para no cambiar)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                required={!editingItem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="user">Usuario Normal</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                className="input"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rol</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Creado</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingItem(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== BRANDS SECTION ====================
function BrandsSection({ brands, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    if (editingItem) {
      setFormData({ name: editingItem.name });
      setShowForm(true);
    }
  }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await brandsAPI.update(editingItem.id, formData);
        showMessage('Marca actualizada');
      } else {
        await brandsAPI.create(formData);
        showMessage('Marca creada');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '' });
      onRefresh();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Marcas</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingItem(null);
            setFormData({ name: '' });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Marca
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingItem ? 'Editar Marca' : 'Nueva Marca'}
          </h4>
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Marca</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ej: Cisco, HP, Dell..."
              required
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map(brand => (
          <div key={brand.id} className="card flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{brand.name}</h4>
              <p className="text-sm text-gray-600">
                Creada: {new Date(brand.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(brand)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(brand.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== MODELS SECTION ====================
function ModelsSection({ models, brands, onDelete, onRefresh, showMessage, showForm, setShowForm, editingItem, setEditingItem }) {
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    image_url: '',
    reset_instructions: '',
    possible_passwords: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        brand_id: editingItem.brand_id,
        name: editingItem.name,
        image_url: editingItem.image_url || '',
        reset_instructions: editingItem.reset_instructions || '',
        possible_passwords: Array.isArray(JSON.parse(editingItem.possible_passwords || '[]'))
          ? JSON.parse(editingItem.possible_passwords).join(', ')
          : ''
      });
      setShowForm(true);
    }
  }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const passwords = formData.possible_passwords
        .split(',')
        .map(p => p.trim())
        .filter(p => p);

      const data = {
        ...formData,
        possible_passwords: JSON.stringify(passwords)
      };

      if (editingItem) {
        await modelsAPI.update(editingItem.id, data);
        showMessage('Modelo actualizado');
      } else {
        await modelsAPI.create(data);
        showMessage('Modelo creado');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ brand_id: '', name: '', image_url: '', reset_instructions: '', possible_passwords: '' });
      onRefresh();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Modelos</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingItem(null);
            setFormData({ brand_id: '', name: '', image_url: '', reset_instructions: '', possible_passwords: '' });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Modelo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingItem ? 'Editar Modelo' : 'Nuevo Modelo'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Marca</label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Seleccione una marca</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre del Modelo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Ej: Catalyst 2960"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">URL de Imagen</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input"
                placeholder="/uploads/imagen.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Contraseñas Posibles (separadas por comas)</label>
              <input
                type="text"
                value={formData.possible_passwords}
                onChange={(e) => setFormData({ ...formData, possible_passwords: e.target.value })}
                className="input"
                placeholder="admin, cisco, password123"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Instrucciones de Reset</label>
              <textarea
                value={formData.reset_instructions}
                onChange={(e) => setFormData({ ...formData, reset_instructions: e.target.value })}
                className="input"
                rows="8"
                placeholder="1. Paso uno...&#10;2. Paso dos..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Marca</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Modelo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Imagen</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {models.map(model => (
              <tr key={model.id}>
                <td className="px-4 py-3">{model.brand_name}</td>
                <td className="px-4 py-3 font-medium">{model.name}</td>
                <td className="px-4 py-3">
                  {model.image_url ? (
                    <span className="text-green-600 text-sm">✓ Sí</span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingItem(model)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded mr-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(model.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== IMAGES SECTION ====================
function ImagesSection({ images, onRefresh, showMessage }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      await uploadAPI.uploadImage(formData);
      showMessage('Imagen subida exitosamente');
      onRefresh();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al subir imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    
    try {
      await uploadAPI.deleteImage(filename);
      showMessage('Imagen eliminada');
      onRefresh();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Imágenes</h3>
        <label className="btn btn-primary flex items-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Subir Imagen'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="card p-3">
            <img
              src={img.url}
              alt={img.filename}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <p className="text-xs text-gray-600 truncate mb-2">{img.filename}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(img.url);
                  showMessage('URL copiada al portapapeles');
                }}
                className="btn btn-secondary text-xs flex-1"
              >
                Copiar URL
              </button>
              <button
                onClick={() => handleDelete(img.filename)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
