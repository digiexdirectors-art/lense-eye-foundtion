import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Printer, ArrowLeft, CreditCard, Eye } from 'lucide-react';

const RegistrationBill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { settings } = useSettings();
  const [appointment, setAppointment] = useState<any>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount] = useState(100);
  const [paymentMode] = useState('Cash');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchBill = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // 1. Try to fetch existing bill
      try {
        const { data } = await axios.get(`/api/billing/appointment/${id}`, config);
        setBill(data.data);
      } catch (err) {
        // No bill found, fetch appointment to show details
        const { data: apptRes } = await axios.get(`/api/appointments/${id}`, config);
        setAppointment(apptRes.data);
      }
    } catch (error) {
      console.error("Failed to load bill context", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, [id, token]);

  const handleCreateBill = async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post('/api/billing/registration', {
        appointmentId: id,
        amount,
        paymentMode
      }, config);
      setBill(data.data);
    } catch (error) {
      console.error("Failed to create bill", error);
      alert("Failed to save bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };



  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bill details...</div>;

  const displayData = bill || {
    patient: appointment?.patient,
    doctor: appointment?.doctor,
    createdAt: appointment?.appointmentDate,
    receiptNo: 'Pending...'
  };

  return (
    <div className="prescription-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button className="btn-secondary small" onClick={() => navigate(-1)} style={{ width: 'auto' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!bill && (
            <button className="btn-primary small" onClick={handleCreateBill} disabled={saving} style={{ width: 'auto', background: '#f59e0b', borderColor: '#f59e0b' }}>
              <CreditCard size={18} /> {saving ? 'Saving...' : 'Generate Bill'}
            </button>
          )}
          {bill && (
            <>
              <button className="btn-secondary small" onClick={handlePrint} style={{ width: 'auto' }}>
                <Printer size={18} /> Print Bill
              </button>
              {/* <button className="btn-primary small" onClick={handleDownload} style={{ width: 'auto' }}>
                <Download size={18} /> Download PDF
              </button> */}
            </>
          )}
        </div>
      </div>

      <div className="prescription-paper" ref={printRef} style={{ background: '#fff', padding: '40px', minHeight: '800px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
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
                BILL OF SUPPLY
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'inline-block', borderBottom: '2px solid #e2e8f0', paddingBottom: '3px', color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>BILL OF SUPPLY</h2>
        </div>

        {/* Patient & Doctor Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '25px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '120px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>PATIENT NAME:</span>
              <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', textTransform: 'uppercase' }}>{displayData.patient?.name || '-'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '120px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>MRD NO:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{displayData.patient?.mrdNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ minWidth: '120px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>ADDRESS:</span>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', maxWidth: '250px' }}>{displayData.patient?.address || '-'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '120px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>DOCTOR NAME:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{displayData.doctor?.name ? (displayData.doctor.name.toLowerCase().startsWith('dr') ? displayData.doctor.name.toUpperCase() : `DR. ${displayData.doctor.name.toUpperCase()}`) : '-'}</span>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '100px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>DATE:</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{new Date(displayData.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '100px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>RECEIPT NO:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.95rem' }}>{displayData.receiptNo}</span>
            </div>
          </div>
        </div>

        {/* Billing Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <th style={{ color: '#fff', textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>PARTICULARS / DESCRIPTION</th>
                <th style={{ color: '#fff', textAlign: 'right', padding: '8px 12px', fontSize: '0.8rem', width: '150px', background: 'var(--primary-color)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#f2f8ff' }}>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155' }}>
                  Patient Registration
                </td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                  INR {bill ? bill.amount.toFixed(2) : amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>TOTAL PAYABLE:</td>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                  INR {bill ? bill.amount.toFixed(2) : amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Signature Area */}
        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px' }}></div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>FOR {settings.clinicName?.toUpperCase() || 'THE LENS EYE FOUNDATION'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>(Authorized Signatory)</p>
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#1e293b', fontWeight: 700 }}>
              PLEASE NOTE: Consultation/registration with the same doctor is valid for 15 days from the date of payment.
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.65rem', color: '#475569', lineHeight: '1.4' }}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>IMPORTANT MESSAGE FOR PATIENT & ATTENDANTS:</span> Only one attendant is allowed with one patient in the hospital premises. 
              Children are susceptible to infections, hence, discourage them to visit hospital unless they need any eye treatment. 
              Both parents may accompany in case of a child patient.
            </p>
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
          .print-only { display: inline !important; }
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
            padding: 10mm !important; 
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: auto !important;
            height: auto !important;
            width: 100% !important;
          }
          input { border: none !important; }
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
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
};

export default RegistrationBill;
