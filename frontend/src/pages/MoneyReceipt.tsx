import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Printer, ArrowLeft, Eye } from 'lucide-react';

const MoneyReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '',
    receivedFrom: '',
    sumOfRupees: '',
    purpose: '',
    amount: 0
  });

  const numberToWords = (num: number) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return '';
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only ' : '';
    return str.toUpperCase();
  };
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data: apptData } = await axios.get(`/api/appointments/${id}`, config);
        // setAppointment(apptData.data);
        
        // Try to fetch Bill Cum Receipt to get billNo
        try {
          const { data: billCumRes } = await axios.get(`/api/billing/receipt/appointment/${id}`, config);
          setBillNo(billCumRes.data?.billNo || 'N/A');
        } catch (err) {
          setBillNo('N/A');
        }

        // Check for existing receipt
        try {
          const { data: receiptData } = await axios.get(`/api/billing/money-receipt/appointment/${id}`, config);
          setReceiptNo(receiptData.data.receiptNo || '');
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
      if (data.data?.receiptNo) {
        setReceiptNo(data.data.receiptNo);
      }
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
        <div
          className="prescription-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '3px solid var(--primary-color)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            {settings.logoUrl ? (
              <img
                className="prescription-logo"
                src={settings.logoUrl}
                alt="logo"
                style={{
                  maxHeight: '150px',
                  maxWidth: '380px',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Eye size={40} color="var(--primary-color)" />
            )}

            <div>
              <h1 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {settings.clinicName}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                MONEY RECEIPT
              </p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                EYE CARE HOSPITAL
              </p>
            </div>
          </div>

          <div className="clinic-details" style={{ textAlign: 'right', fontSize: '0.92rem', color: '#1e293b', lineHeight: '1.2', fontWeight: 'bold' }}>
            <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary-color)' }}>For Appointment:</p>
            <p style={{ margin: '0 0 2px 0', fontWeight: 800 }}>{settings.appointmentHours || 'Mon-Sat: 9:00AM - 6:00 PM'}</p>
            {settings.address && settings.address.split('\n').map((line: string, i: number) => (
              <p key={i} className="clinic-address-line" style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', fontSize: '0.95rem' }}>{line}</p>
            ))}
            <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>Tel: {settings.phone}</p>
            <p style={{ margin: 0, fontWeight: 800 }}>Email: {settings.email}</p>
            {settings.gstin && <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>GSTIN: {settings.gstin}</p>}
            <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>Mob: {settings.mobile || '+91 9733035399'}</p>
          </div>
        </div>

        {/* Bill Title */}
        <div className="receipt-title" style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <h2 style={{ display: 'inline-block', borderBottom: '2px solid #e2e8f0', paddingBottom: '3px', color: '#1e293b', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '2px' }}>MONEY RECEIPT</h2>
          {receiptNo && (
            <div className="blue-text" style={{ position: 'absolute', right: 0, top: '5px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)' }}>
              Receipt No: {receiptNo}
            </div>
          )}
        </div>

        {/* Receipt Content */}
        <div className="receipt-content" style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '60px', fontSize: '1.15rem', color: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontWeight: 700, minWidth: '160px', color: '#000' }}>BILL NO.</span>
            <span style={{ flex: 1, borderBottom: '1px solid #000', padding: '0 10px', fontSize: '1.15rem', color: '#000', fontWeight: 700 }}>{billNo || 'N/A'}</span>
          </div>

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
        <div className="receipt-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '40px', marginTop: '60px' }}>
          <div style={{ border: '2px solid #000', padding: '10px 20px', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#000' }}>Rs.</span>
            <input 
              type="number"
              className="receipt-input"
              value={formData.amount === 0 ? '' : formData.amount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData({
                  ...formData, 
                  amount: val,
                  sumOfRupees: numberToWords(val)
                });
              }}
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
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .blue-text { color: var(--primary-color) !important; }
          .print-hidden { display: none !important; }
          body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .prescription-container { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          .prescription-paper { box-shadow: none !important; border: none !important; padding: 10mm !important; margin: 0 !important; min-height: auto !important; height: auto !important; width: 100% !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          .receipt-input { border: none !important; padding-left: 0 !important; color: #000 !important; }
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          h1 { font-size: 2.2rem !important; margin: 0 !important; font-weight: 900 !important; color: var(--primary-color) !important; }
          .prescription-logo { max-height: 150px !important; max-width: 380px !important; }
          .clinic-details p { line-height: 1.2 !important; margin: 0 !important; font-size: 10.5pt !important; }
          .clinic-details p.clinic-address-line { font-size: 11.5pt !important; }
          .clinic-details b, .clinic-details strong { color: #1e293b !important; }
          .prescription-header {
            margin: 0 0 0.5rem 0 !important;
            padding: 0.5rem 0 !important;
            border-bottom: 2px solid var(--primary-color) !important;
            height: auto !important;
          }
          .receipt-title { margin-bottom: 15px !important; }
          .receipt-content { gap: 15px !important; margin-bottom: 25px !important; }
          .receipt-footer { gap: 20px !important; margin-top: 30px !important; }
        }
      `}</style>
    </div>
  );
};

export default MoneyReceipt;
