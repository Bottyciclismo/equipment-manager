import React, { useState, useEffect } from 'react';
import { modelsAPI } from '../services/api';

const EditModelForm = ({ model, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    possible_passwords: '',
    reset_instructions: ''
  });

  // Al abrir el formulario, cargamos los datos del modelo seleccionado
  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name || '',
        image_url: model.image_url || '',
        possible_passwords: model.possible_passwords || '',
        reset_instructions: model.reset_instructions || ''
      });
    }
  }, [model]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Llamamos a la API que creamos antes
      await modelsAPI.update(model.id, formData);
      alert('✅ Modelo actualizado correctamente');
      onSave(); // Esta función refresca la lista principal
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('❌ No se pudo actualizar el modelo');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #007bff', borderRadius: '8px', background: '#f9f9f9' }}>
      <h3>Editar Modelo: {model.name}</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Nombre del Modelo:</label><br/>
          <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%' }} required />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>URL de la Imagen:</label><br/>
          <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Passwords Posibles:</label><br/>
          <textarea name="possible_passwords" value={formData.possible_passwords} onChange={handleChange} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Instrucciones de Reset:</label><br/>
          <textarea name="reset_instructions" value={formData.reset_instructions} onChange={handleChange} style={{ width: '100%' }} />
        </div>

        <button type="submit" style={{ background: '#28a745', color: 'white', marginRight: '10px' }}>Guardar Cambios</button>
        <button type="button" onClick={onCancel} style={{ background: '#6c757d', color: 'white' }}>Cancelar</button>
      </form>
    </div>
  );
};

export default EditModelForm;