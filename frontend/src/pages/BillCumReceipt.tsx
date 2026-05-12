import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Printer, ArrowLeft, CreditCard } from 'lucide-react';

const BillCumReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { settings } = useSettings();
  const [appointment, setAppointment] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReceipt = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const { data } = await axios.get(`/api/billing/receipt/appointment/${id}`, config);
        setReceipt(data.data);
      } catch (err) {
        const { data } = await axios.get(`/api/appointments/${id}`, config);
        setAppointment(data.data);
      }
    } catch (error) {
      console.error("Failed to load receipt details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [id, token]);

  const handleCreateReceipt = async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post('/api/billing/receipt', {
        appointmentId: id
      }, config);
      setReceipt(data.data);
    } catch (error) {
      console.error("Failed to create receipt", error);
      alert("Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num: number) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading receipt details...</div>;

  const displayData = receipt || {
    patient: appointment?.patient,
    doctor: appointment?.doctor,
    createdAt: new Date().toISOString(),
    billNo: 'Pending...',
    patientIdNo: 'Pending...',
    serviceCode: 'Pending...',
    amount: appointment?.doctor?.consultationFee || 0
  };

  return (
    <div className="prescription-container" style={{ maxWidth: '950px', margin: '0 auto', padding: '1rem' }}>
      <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button className="btn-secondary small" onClick={() => navigate(-1)} style={{ width: 'auto' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!receipt && (
            <button className="btn-primary small" onClick={handleCreateReceipt} disabled={saving} style={{ width: 'auto', background: '#f59e0b', borderColor: '#f59e0b' }}>
              <CreditCard size={18} /> {saving ? 'Saving...' : 'Generate Bill'}
            </button>
          )}
          {receipt && (
            <button className="btn-secondary small" onClick={handlePrint} style={{ width: 'auto' }}>
              <Printer size={18} /> Print Bill
            </button>
          )}
        </div>
      </div>

      <div className="prescription-paper" ref={printRef} style={{ display: 'flex', flexDirection: 'column', background: '#fff', padding: '40px', minHeight: '800px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid var(--primary-color)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" style={{ height: '60px', maxWidth: '160px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 800 }}>{settings.clinicName || 'THE LENS EYE FOUNDATION'}</h1>
              <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>PREMIUM EYE CARE & OPTICALS</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-color)' }}>For Appointment:</p>
            <p style={{ margin: '1px 0 4px 0', fontSize: '0.8rem', fontWeight: 600 }}>{settings.appointmentHours || 'Mon-Sat: 9:00 AM - 6:00 PM'}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', maxWidth: '250px', lineHeight: 1.3 }}>{settings.address || 'Address not set'}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', fontWeight: 600 }}>Tel: {settings.phone || '-'}</p>
          </div>
        </div>

        {/* Bill Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'inline-block', borderBottom: '2px solid #e2e8f0', paddingBottom: '3px', color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>BILL CUM RECEIPT</h2>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Bill No:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{displayData.billNo}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Patient Name:</span>
              <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', textTransform: 'uppercase' }}>{displayData.patient?.name || '-'}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Age/Sex-DOB:</span>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                {displayData.patient?.age || '-'}/{displayData.patient?.gender || '-'} {displayData.patient?.dateOfBirth ? `- ${new Date(displayData.patient.dateOfBirth).toLocaleDateString('en-IN')}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Payor Name:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem' }}>PATIENT</span>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Bill Date:</span>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>{new Date(displayData.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Patient ID:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem' }}>{displayData.patientIdNo}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Doctor Name:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{displayData.doctor?.name ? (displayData.doctor.name.toLowerCase().startsWith('dr') ? displayData.doctor.name.toUpperCase() : `DR. ${displayData.doctor.name.toUpperCase()}`) : '-'}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '110px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Mobile Number:</span>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>{displayData.patient?.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <th style={{ color: '#fff', textAlign: 'left', padding: '10px 15px', fontSize: '0.85rem', border: '1px solid #fff', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Sr.No</th>
                <th style={{ color: '#fff', textAlign: 'left', padding: '10px 15px', fontSize: '0.85rem', border: '1px solid #fff', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Service Code</th>
                <th style={{ color: '#fff', textAlign: 'left', padding: '10px 15px', fontSize: '0.85rem', border: '1px solid #fff', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Service Name</th>
                <th style={{ color: '#fff', textAlign: 'center', padding: '10px 15px', fontSize: '0.85rem', border: '1px solid #fff', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Qty</th>
                <th style={{ color: '#fff', textAlign: 'right', padding: '10px 15px', fontSize: '0.85rem', border: '1px solid #fff', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Net Amt.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'left' }}>1</td>
                <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'left' }}>{displayData.serviceCode}</td>
                <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Doctor Consultant</td>
                <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>1</td>
                <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>{displayData.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div style={{ width: '60%' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Net Amount in (Words):</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>RUPEES {numberToWords(displayData.amount)}</p>
          </div>
          <div style={{ width: '35%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Total Amount:</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{displayData.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderTop: '1px solid #e2e8f0', paddingTop: '5px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>Net Bill Amount:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{displayData.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderTop: '2px solid var(--primary-color)', paddingTop: '5px' }}>
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>Paid amount by patient:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1rem' }}>{displayData.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: '20px', paddingBottom: '10px' }}>
          {/* Note Section */}
          <div style={{ marginBottom: '20px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, lineHeight: '1.5' }}>
              <span style={{ fontWeight: 800 }}>PLEASE NOTE:</span> Follow-up or repeat consultation is free for upto 15 (Fifteen) days from the last doctor consultation date. 
              Rs {displayData.amount.toFixed(2)} shall be charged subsequent OPD consultation after 15 days.
            </p>
          </div>

          {/* Signature Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1.5px solid #1e293b', marginBottom: '8px' }}></div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>Patient/Attendant Signature</p>
            </div>

            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ borderBottom: '1.5px solid #1e293b', marginBottom: '8px' }}></div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>Prepared By</p>
            </div>

            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 40px 0', fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>For: {settings.clinicName?.toUpperCase() || 'THE LENS EYE FOUNDATION'}</p>
              <div style={{ borderBottom: '1.5px solid #1e293b', marginBottom: '8px' }}></div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            size: auto; 
            margin: 0 !important; 
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden { display: none !important; }
          body { 
            background: #fff !important; 
            margin: 0 !important; 
            padding: 0 !important;
          }
          .prescription-container { 
            margin: 0 !important; 
            padding: 0 !important; 
            max-width: 100% !important; 
          }
          .prescription-paper { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 15mm !important;
            margin: 0 !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            min-height: auto !important;
            height: auto !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BillCumReceipt;
