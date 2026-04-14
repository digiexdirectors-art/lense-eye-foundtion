import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import InventoryModal from '../components/InventoryModal';

const InventoryPage = () => {
  const { token, user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchInventory = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/inventory', config);
      setInventory(data.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const handleAddClick = () => {
    setModalMode('add');
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setModalMode('edit');
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`/api/inventory/${id}`, config);
        alert('Item deleted successfully');
        fetchInventory();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (modalMode === 'add') {
        await axios.post('/api/inventory', formData, config);
        alert('Item added successfully');
      } else {
        await axios.put(`/api/inventory/${selectedItem._id}`, formData, config);
        alert('Item updated successfully');
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save item');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inventory-container">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={28} color="var(--primary-color)" />
          Inventory Management
        </h2>
        {(user?.role === 'admin' || user?.role === 'accountant') && (
          <button className="btn-primary small" style={{ width: 'auto' }} onClick={handleAddClick}>
            <Plus size={18} /> Add New Item
          </button>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input 
               type="text" 
               className="form-input" 
               style={{ paddingLeft: '2.5rem' }} 
               placeholder="Search by Name or SKU..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button className="btn-secondary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div className="glass-card table-container" style={{ margin: 0 }}>
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading stock...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Stock Level</th>
                <th>Price (INR)</th>
                {(user?.role === 'admin' || user?.role === 'accountant') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.description}</div>
                  </td>
                  <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{item.category}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{item.sku}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 700, 
                      color: item.quantity < 5 ? '#ef4444' : (item.quantity < 15 ? '#f59e0b' : '#10b981') 
                    }}>
                      {item.quantity} units
                    </span>
                  </td>
                  <td>
                    <div>Sale: ₹{item.unitPrice}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Buy: ₹{item.purchasePrice}</div>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'accountant') && (
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEditClick(item)}><Edit size={14}/></button>
                      <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', borderColor: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(item._id, item.name)}><Trash2 size={14}/></button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No items found in inventory.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        initialData={selectedItem}
        title={modalMode === 'add' ? 'Add New Item' : 'Edit Item'}
      />
    </div>
  );
};

export default InventoryPage;

