import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Printer, ArrowLeft } from 'lucide-react';

const MoneyReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { settings } = useSettings();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '',
    receivedFrom: '',
    sumOfRupees: '',
    purpose: '',
    amount: 0
  });
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data: apptData } = await axios.get(`/api/appointments/${id}`, config);
        setAppointment(apptData.data);
        
        // Check for existing receipt
        try {
          const { data: receiptData } = await axios.get(`/api/billing/money-receipt/appointment/${id}`, config);
          setReceipt(receiptData.data);
          setFormData({
            name: receiptData.data.name || apptData.data.patient?.name || '',
            age: receiptData.data.age || apptData.data.patient?.age || '',
            sex: receiptData.data.sex || apptData.data.patient?.gender || '',
            receivedFrom: receiptData.data.receivedFrom || '',
            sumOfRupees: receiptData.data.sumOfRupees || '',
            purpose: receiptData.data.purpose || apptData.data.reason || '',
            amount: receiptData.data.amount || 0
          });
        } catch (err) {
          // No receipt yet, pre-fill from appointment
          setFormData({
            name: apptData.data.patient?.name || '',
            age: apptData.data.patient?.age || '',
            sex: apptData.data.patient?.gender || '',
            receivedFrom: '',
            sumOfRupees: '',
            purpose: apptData.data.reason || '',
            amount: apptData.data.doctor?.consultationFee || 0
          });
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post('/api/billing/money-receipt', {
        appointmentId: id,
        ...formData
      }, config);
      setReceipt(data.data);
      alert("Receipt saved successfully!");
    } catch (error) {
      console.error("Failed to save receipt", error);
      alert("Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading receipt details...</div>;

  return (
    <div className="prescription-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button className="btn-secondary small" onClick={() => navigate(-1)} style={{ width: 'auto' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary small" onClick={handleSave} disabled={saving} style={{ width: 'auto', background: '#10b981', borderColor: '#10b981' }}>
             {saving ? 'Saving...' : 'Save Data'}
          </button>
          <button className="btn-secondary small" onClick={handlePrint} style={{ width: 'auto' }}>
            <Printer size={18} /> Print Receipt
          </button>
        </div>
      </div>

      <div className="prescription-paper" ref={printRef} style={{ background: '#fff', padding: '40px', minHeight: '700px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid var(--primary-color)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" style={{ height: '100px', maxWidth: '250px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.5px' }}>{settings.clinicName || 'THE LENS EYE FOUNDATION'}</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px' }}>PREMIUM EYE CARE & OPTICALS</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-color)' }}>For Appointment:</p>
            <p style={{ margin: '1px 0 4px 0', fontSize: '0.8rem', fontWeight: 600 }}>{settings.appointmentHours || 'Mon-Sat: 9:00 AM - 6:00 PM'}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', maxWidth: '250px', lineHeight: 1.3 }}>{settings.address || 'Address not set'}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', fontWeight: 600 }}>Tel: {settings.phone || '-'}</p>
          </div>
        </div>

        {/* Bill Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ display: 'inline-block', borderBottom: '2px solid #e2e8f0', paddingBottom: '3px', color: '#1e293b', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '2px' }}>MONEY RECEIPT</h2>
        </div>

        {/* Receipt Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '60px', fontSize: '1.15rem', color: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '160px', color: '#000' }}>NAME</span>
            <input 
              className="receipt-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '160px', color: '#000' }}>AGE</span>
            <input 
              className="receipt-input"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '160px', color: '#000' }}>SEX</span>
            <input 
              className="receipt-input"
              value={formData.sex}
              onChange={(e) => setFormData({...formData, sex: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '240px', color: '#000' }}>RECEIVED WITH THANKS FROM</span>
            <input 
              className="receipt-input"
              placeholder="Full name of payer"
              value={formData.receivedFrom}
              onChange={(e) => setFormData({...formData, receivedFrom: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '200px', color: '#000' }}>THE SUM OF RUPEES</span>
            <input 
              className="receipt-input"
              placeholder="Amount in words"
              value={formData.sumOfRupees}
              onChange={(e) => setFormData({...formData, sumOfRupees: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '200px', color: '#000' }}>FOR THE PURPOSE OF</span>
            <input 
              className="receipt-input"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', padding: '0 10px', fontSize: '1.15rem', background: 'transparent', color: '#000', fontWeight: 400 }}
            />
          </div>
        </div>

        {/* Footer Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '40px', marginTop: '60px' }}>
          <div style={{ border: '2px solid #000', padding: '10px 20px', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#000' }}>Rs.</span>
            <input 
              type="number"
              className="receipt-input"
              value={formData.amount === 0 ? '' : formData.amount}
              onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1.4rem', fontWeight: 800, background: 'transparent', color: '#000' }}
            />
          </div>
          
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '2px solid #000', marginBottom: '8px' }}></div>
            <p style={{ margin: 0, fontWeight: 700, color: '#000', fontSize: '1rem', textTransform: 'uppercase' }}>SIGNATURE</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: auto; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000 !important; }
          .print-hidden { display: none !important; }
          body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .prescription-container { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          .prescription-paper { box-shadow: none !important; border: none !important; padding: 20mm !important; margin: 0 !important; min-height: auto !important; height: auto !important; width: 100% !important; }
          .receipt-input { border: none !important; padding-left: 0 !important; color: #000 !important; }
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default MoneyReceipt;
