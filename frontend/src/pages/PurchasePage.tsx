import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Trash2, Save, User as VendorIcon, Package, Printer, FileText, Download } from 'lucide-react';

const PurchasePage = () => {
  const { token } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [vendorGST, setVendorGST] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  // Local state for current item being added
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    purchasePrice: 0,
    salePrice: 0,
    profitValue: 0,
    profitType: 'Percentage' as 'Percentage' | 'Fixed',
    qty: 1,
    gstPercent: 18,
    category: 'Frame'
  });

  const fetchRecentPurchases = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/purchases', config);
      setRecentPurchases(data.data.slice(0, 5)); // Show last 5
    } catch (error) {
      console.error("Failed to fetch recent purchases", error);
    }
  };

  useState(() => {
    fetchRecentPurchases();
  });

  // Calculation logic
  const handlePurchasePriceChange = (value: number) => {
    let salePrice = newItem.salePrice;
    if (newItem.profitType === 'Percentage') {
      salePrice = value + (value * newItem.profitValue / 100);
    } else {
      salePrice = value + newItem.profitValue;
    }
    setNewItem({ ...newItem, purchasePrice: value, salePrice: Number(salePrice.toFixed(2)) });
  };

  const handleProfitChange = (value: number, type?: 'Percentage' | 'Fixed') => {
    const pType = type || newItem.profitType;
    let salePrice = 0;
    if (pType === 'Percentage') {
      salePrice = newItem.purchasePrice + (newItem.purchasePrice * value / 100);
    } else {
      salePrice = newItem.purchasePrice + value;
    }
    setNewItem({ ...newItem, profitValue: value, profitType: pType, salePrice: Number(salePrice.toFixed(2)) });
  };

  const handleSalePriceChange = (value: number) => {
    let profitValue = 0;
    if (newItem.profitType === 'Percentage') {
      profitValue = newItem.purchasePrice > 0 ? ((value - newItem.purchasePrice) / newItem.purchasePrice * 100) : 0;
    } else {
      profitValue = value - newItem.purchasePrice;
    }
    setNewItem({ ...newItem, salePrice: value, profitValue: Number(profitValue.toFixed(2)) });
  };

  const addItemToList = () => {
    if (!newItem.name || !newItem.sku) {
      alert('Please enter item name and SKU.');
      return;
    }
    setItems([...items, newItem]);
    setNewItem({
        name: '',
        sku: '',
        purchasePrice: 0,
        salePrice: 0,
        profitValue: 0,
        profitType: 'Percentage',
        qty: 1,
        gstPercent: 18,
        category: 'Frame'
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((acc, i) => acc + (i.purchasePrice * i.qty), 0);
  const calculateTotalGST = () => items.reduce((acc, i) => acc + (i.purchasePrice * i.qty * i.gstPercent / 100), 0);

  const handleSubmit = async () => {
    if (!vendorName || items.length === 0) {
      alert('Please enter vendor details and add at least one item.');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const purchaseData = {
        vendorName,
        vendorGST,
        invoiceNumber,
        items
      };
      
      const { data } = await axios.post('/api/purchases', purchaseData, config);
      alert('Purchase recorded and inventory updated!');
      setLastSavedId(data.data._id);
      fetchRecentPurchases();
      
      // Reset
      setItems([]);
      setVendorName('');
      setVendorGST('');
      setInvoiceNumber('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record purchase.');
    }
  };

  const handleDownloadPDF = (id: string) => {
    const url = `/api/purchases/${id}/pdf?token=${token}`;
    window.open(`${axios.defaults.baseURL || ''}${url}`, '_blank');
  };

  return (
    <div className="purchase-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShoppingCart size={28} color="var(--primary-color)" />
          Incoming Stock / Purchases
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Vendor Details */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
           <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <VendorIcon size={18} /> Vendor Information
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div className="form-group" style={{ margin: 0 }}>
               <label>Vendor Name</label>
               <input type="text" className="form-input" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Optical Wholesale" />
             </div>
             <div className="form-group" style={{ margin: 0 }}>
               <label>Vendor GSTIN</label>
               <input type="text" className="form-input" value={vendorGST} onChange={e => setVendorGST(e.target.value)} placeholder="GST Number" />
             </div>
             <div className="form-group" style={{ margin: 0 }}>
               <label>Invoice Number</label>
               <input type="text" className="form-input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Bill Reference" />
             </div>
           </div>
        </div>

        {/* New Item Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
           <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Package size={18} /> Add Item to Shipment
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <input type="text" className="form-input" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
             <input type="text" className="form-input" placeholder="SKU / Model" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} />
             <input type="number" className="form-input" placeholder="Purchase Price" value={newItem.purchasePrice || ''} onChange={e => handlePurchasePriceChange(parseFloat(e.target.value) || 0)} />
             
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-input" placeholder="Profit" value={newItem.profitValue || ''} onChange={e => handleProfitChange(parseFloat(e.target.value) || 0)} style={{ flex: 1 }} />
                <select className="form-input" value={newItem.profitType} onChange={e => handleProfitChange(newItem.profitValue, e.target.value as any)} style={{ width: '100px' }}>
                  <option value="Percentage">%</option>
                  <option value="Fixed">₹</option>
                </select>
             </div>

             <input type="number" className="form-input" placeholder="Sale Price" value={newItem.salePrice || ''} onChange={e => handleSalePriceChange(parseFloat(e.target.value) || 0)} />
             
             <input type="number" className="form-input" placeholder="Quantity" value={newItem.qty || ''} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 0})} />
             
             <select className="form-input" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="Frame">Frame</option>
                <option value="Lens">Lens</option>
                <option value="Contact Lens">Contact Lens</option>
                <option value="Accessories">Accessories</option>
             </select>
             <button className="btn-primary" onClick={addItemToList} style={{ height: 'fit-content' }}>
               <Plus size={18} /> Add
             </button>
           </div>
        </div>
      </div>

      {/* Shipment Items List */}
      <div className="glass-card table-container" style={{ margin: 0 }}>
         <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Total (excl. GST)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.purchasePrice}</td>
                  <td>₹{item.salePrice}</td>
                  <td>₹{(item.purchasePrice * item.qty).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No items added to this purchase record yet.</td></tr>}
            </tbody>
         </table>
      </div>

      {/* Summary Banner */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
         <div className="glass-card" style={{ padding: '1.5rem', width: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipment Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total GST Invoiced:</span>
              <span style={{ fontWeight: 600 }}>₹{calculateTotalGST().toFixed(2)}</span>
            </div>
            <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
              <span>Total Payable Amount:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>₹{(calculateSubtotal() + calculateTotalGST()).toFixed(2)}</span>
            </div>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleSubmit}>
              <Save size={18} /> Record Purchase & Update Inventory
            </button>
            
            {lastSavedId && (
              <button className="btn-secondary" style={{ marginTop: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }} onClick={() => handleDownloadPDF(lastSavedId)}>
                <Printer size={18} /> Print Last Saved Invoice
              </button>
            )}
         </div>
      </div>

      {/* Recent Purchases History */}
      <div className="glass-card" style={{ marginTop: '2.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} /> Recent Purchase Invoices
        </h3>
        <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
           <table>
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Invoice #</th>
                 <th>Vendor</th>
                 <th>Total Amount</th>
                 <th>Action</th>
               </tr>
             </thead>
             <tbody>
               {recentPurchases.map((p) => (
                 <tr key={p._id}>
                   <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                   <td>{p.invoiceNumber}</td>
                   <td>{p.vendorName}</td>
                   <td>₹{p.grandTotal.toFixed(2)}</td>
                   <td>
                      <button className="btn-secondary small" onClick={() => handleDownloadPDF(p._id)} style={{ padding: '0.25rem 0.5rem' }}>
                        <Download size={14} /> PDF
                      </button>
                   </td>
                 </tr>
               ))}
               {recentPurchases.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No recent purchases found.</td></tr>}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
