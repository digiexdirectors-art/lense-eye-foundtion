import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  title: string;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSave, initialData, title }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Frame',
    quantity: 0,
    unitPrice: 0,
    purchasePrice: 0,
    gstPercent: 18,
    description: '',
    vendor: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Frame',
        quantity: 0,
        unitPrice: 0,
        purchasePrice: 0,
        gstPercent: 18,
        description: '',
        vendor: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'quantity' || name === 'unitPrice' || name === 'purchasePrice' || name === 'gstPercent') ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay">
        <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '90%' }}>
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="btn-close" onClick={onClose}><X size={20} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Item Name *</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
              </div>
              
              <div className="form-group">
                <label>SKU (Unique) *</label>
                <input type="text" name="sku" className="form-input" value={formData.sku} onChange={handleChange} required />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select name="category" className="form-input" value={formData.category} onChange={handleChange}>
                  <option value="Frame">Frame</option>
                  <option value="Lens">Lens</option>
                  <option value="Contact Lens">Contact Lens</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} min="0" />
              </div>
              
              <div className="form-group">
                <label>GST Percent (%)</label>
                <input type="number" name="gstPercent" className="form-input" value={formData.gstPercent} onChange={handleChange} />
              </div>
              
              <div className="form-group">
                <label>Purchase Price (INR)</label>
                <input type="number" name="purchasePrice" className="form-input" value={formData.purchasePrice} onChange={handleChange} />
              </div>
              
              <div className="form-group">
                <label>Sale Price (INR)</label>
                <input type="number" name="unitPrice" className="form-input" value={formData.unitPrice} onChange={handleChange} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Vendor Name</label>
                <input type="text" name="vendor" className="form-input" value={formData.vendor} onChange={handleChange} />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea name="description" className="form-input" value={formData.description} onChange={handleChange} rows={2} />
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                <Save size={18} /> Save Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default InventoryModal;
