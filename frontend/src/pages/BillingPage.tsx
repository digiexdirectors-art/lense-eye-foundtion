import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Trash2, IndianRupee, Search } from 'lucide-react';


const BillingPage = () => {
  const { token, user: currentUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentBills, setRecentBills] = useState<any[]>([]);

  const fetchRecentBills = async () => {
    try {
      const { data } = await axios.get('/api/billing', { headers: { Authorization: `Bearer ${token}` } });
      setRecentBills(data.data);
    } catch (err) {
      console.error("Failed to fetch billing history", err);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchContext = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [ptRes, invRes] = await Promise.all([
        axios.get('/api/patients', config),
        axios.get('/api/inventory', config)
      ]);
      setPatients(ptRes.data.data);
      setInventory(invRes.data.data);
    } catch (error) {
      console.error("Context fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
    fetchRecentBills();
  }, [token]);

  const addItem = (invItem: any) => {
    const exists = items.find(i => i.inventoryId === invItem._id);
    if (exists) {
      setItems(items.map(i => i.inventoryId === invItem._id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { 
        inventoryId: invItem._id, 
        name: invItem.name, 
        qty: 1, 
        price: invItem.unitPrice, 
        gstPercent: invItem.gstPercent 
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.inventoryId !== id));
  };

  const calculateSubtotal = () => items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const calculateGST = () => items.reduce((acc, i) => acc + (i.price * i.qty * i.gstPercent / 100), 0);

  const handleSubmit = async () => {
    if (!selectedPatientId || items.length === 0) {
      alert('Please select a patient and add items.');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const billData = {
        patientId: selectedPatientId,
        doctorId: currentUser?._id,
        items,
        paymentMode
      };
      
      const { data } = await axios.post('/api/billing', billData, config);
      alert('Bill generated successfully!');
      
      // Open PDF in new tab with token for authorization
      window.open(`${axios.defaults.baseURL || ''}/api/billing/${data.data._id}/pdf?token=${token}`, '_blank');

      // Refresh History
      fetchRecentBills();
      
      // Reset
      setItems([]);
      setSelectedPatientId('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate bill.');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading billing module...</div>;

  return (
    <div className="billing-container">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--primary-color)" />
          Quick Billing (GST)
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Patient Selection */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem' }}>Step 1: Select Patient</h3>
             <select 
               className="form-input" 
               value={selectedPatientId} 
               onChange={(e) => setSelectedPatientId(e.target.value)}
             >
               <option value="">-- Choose Patient --</option>
               {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>)}
             </select>
          </div>

          {/* Step 2: Search & Add Items (POS Style) */}
          <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', zIndex: 50, overflow: 'visible' }}>
             <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem' }}>Step 2: Add Items from Inventory</h3>
             
             <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by Name, Category, or Brand... (e.g. Rayban, Lens)" 
                  style={{ paddingLeft: '40px', height: '48px', fontSize: '1rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Search Results Dropdown */}
                {searchTerm && (
                  <div className="search-dropdown shadow-lg" style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    marginTop: '8px', 
                    maxHeight: '350px', 
                    overflowY: 'auto', 
                    zIndex: 1000,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', position: 'sticky', top: 0, zIndex: 10 }}>
                      SEARCH RESULTS FOR "{searchTerm.toUpperCase()}"
                    </div>
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map(item => (
                        <div 
                          key={item._id} 
                          className="search-result-row"
                          onClick={() => {
                            addItem(item);
                            setSearchTerm('');
                          }}
                          style={{ 
                            padding: '0.75rem 1rem', 
                            borderBottom: '1px solid #f1f5f9', 
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.2s ease',
                            opacity: item.quantity <= 0 ? 0.6 : 1,
                            pointerEvents: item.quantity <= 0 ? 'none' : 'auto'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Category: {item.category || 'N/A'} | SKU: {item._id.slice(-6)}</div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: '100px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1rem' }}>₹{item.unitPrice}</div>
                            <div style={{ fontSize: '0.75rem', color: item.quantity <= 5 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                              Stock: {item.quantity} {item.quantity <= 0 && '(Out of Stock)'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                        <div style={{ color: '#1e293b', fontWeight: 600 }}>No items found</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Try searching for a different name or brand</div>
                      </div>
                    )}
                  </div>
                )}
             </div>
             
             <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
               <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Tip:</span> Type the item name and click it to add to the invoice list below.
             </p>
          </div>

          {/* Bill Items List */}
          <div className="glass-card table-container" style={{ padding: '1rem', margin: 0 }}>
             <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem' }}>Step 3: Verify Items & Finalize</h3>
             <table style={{ boxShadow: 'none' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>GST %</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.inventoryId}>
                      <td>{i.name}</td>
                      <td>₹{i.price}</td>
                      <td>
                        <input 
                          type="number" 
                          min="1" 
                          className="form-input" 
                          style={{ width: '60px', padding: '0.2rem' }} 
                          value={i.qty} 
                          onChange={(e) => setItems(items.map(it => it.inventoryId === i.inventoryId ? { ...it, qty: parseInt(e.target.value) || 1 } : it))}
                        />
                      </td>
                      <td>{i.gstPercent}%</td>
                      <td>₹{(i.price * i.qty * (1 + i.gstPercent / 100)).toFixed(2)}</td>
                      <td>
                         <button 
                           onClick={() => removeItem(i.inventoryId)}
                           style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                         >
                           <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No items added to the bill yet.</td></tr>}
                </tbody>
             </table>
          </div>

          {/* ADDED: Recent Billing History Section */}
          <div className="glass-card table-container" style={{ padding: '1.5rem', marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Recent Invoices (Billing History)</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Last 50 Records</span>
             </div>
             <table className="history-table" style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                   <tr>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date & Time</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Patient Name</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Mode</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Amount</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem' }}>Action</th>
                   </tr>
                </thead>
                <tbody>
                   {recentBills.map((bill) => (
                      <tr key={bill._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                         <td style={{ padding: '0.75rem' }}>{new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                         <td style={{ padding: '0.75rem', fontWeight: 600 }}>{bill.patientId?.name || 'Cash Customer'}</td>
                         <td style={{ padding: '0.75rem' }}><span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#e2e8f0' }}>{bill.paymentMode}</span></td>
                         <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>₹{bill.grandTotal?.toFixed(2)}</td>
                         <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button 
                               className="btn-secondary" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                               onClick={() => window.open(`${axios.defaults.baseURL || ''}/api/billing/${bill._id}/pdf?token=${token}`, '_blank')}
                            >
                               <FileText size={12} /> View PDF
                            </button>
                         </td>
                      </tr>
                   ))}
                   {recentBills.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No billing history found.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Totals & Summary Sidebar */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--primary-color)', color: 'white' }}>
             <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <IndianRupee size={20} /> Bill Summary
             </h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total GST (18%)</span>
                  <span>₹{calculateGST().toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 700 }}>
                  <span>Grand Total</span>
                  <span>₹{(calculateSubtotal() + calculateGST()).toFixed(2)}</span>
                </div>
             </div>

             <div style={{ marginTop: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>Payment Method</label>
                <select 
                  className="form-input" 
                  style={{ color: '#1e293b' }}
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Card">Card</option>
                </select>
             </div>

             <button 
               className="btn-primary" 
               style={{ width: '100%', marginTop: '1.5rem', background: 'white', color: 'var(--primary-color)', fontWeight: 700 }}
               onClick={handleSubmit}
             >
               Finalize & Print GST Bill
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BillingPage;
