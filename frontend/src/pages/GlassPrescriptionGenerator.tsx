import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Printer, ArrowLeft, Eye, Save } from 'lucide-react';

const emptySpectacle = { sph: '', cyl: '', axis: '', va: '' };

const GlassPrescriptionGenerator = () => {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { settings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [, setHasExisting] = useState(false);

  const [formData, setFormData] = useState({
    spectaclePrescription: {
      rightEye: { ...emptySpectacle },
      leftEye: { ...emptySpectacle }
    },
    glassPrescription: {
      material: '',
      category: '',
      product: '',
      usage: '',
      remarks: '',
      glassType: ''
    },
    prescriptionDate: ''
  });

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 1. Try to fetch existing prescription
        try {
          const { data } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
          if (data.success && data.data) {
            const rx = data.data;
            const formatDate = (d: any) => {
              if (!d) return '';
              const date = new Date(d);
              return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
            };

            setFormData({
              spectaclePrescription: {
                rightEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.rightEye || {}) },
                leftEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.leftEye || {}) }
              },
              glassPrescription: {
                material: rx.glassPrescription?.material || '',
                category: rx.glassPrescription?.category || '',
                product: rx.glassPrescription?.product || '',
                usage: rx.glassPrescription?.usage || '',
                remarks: rx.glassPrescription?.remarks || '',
                glassType: rx.glassPrescription?.glassType || ''
              },
              prescriptionDate: formatDate(rx.prescriptionDate)
            });
            setAppointmentData({
              patient: rx.patient,
              doctor: rx.doctor,
              appointmentDate: rx.appointment?.appointmentDate || rx.createdAt
            });
            setHasExisting(true);
            setLoading(false);
            return;
          }
        } catch (rxErr) {
          console.log("No existing prescription found or error fetching it.");
        }

        // 2. Fallback: Fetch appointment details AND check for patient's previous prescription
        try {
          const { data: apptData } = await axios.get(`/api/appointments/${appointmentId}`, config);
          if (apptData.success && apptData.data) {
            const appt = apptData.data;
            const formatDate = (d: any) => {
              if (!d) return '';
              const date = new Date(d);
              return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
            };
            setAppointmentData(appt);

            // Check for previous prescription for this patient as a template
            try {
              const { data: prevRxRes } = await axios.get(`/api/prescriptions/patient/${appt.patient._id}/latest`, config);
              if (prevRxRes.success && prevRxRes.data) {
                const rx = prevRxRes.data;
                // Load previous data but keep current appointment's context
                setFormData(prev => ({
                  ...prev,
                  spectaclePrescription: {
                    rightEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.rightEye || {}) },
                    leftEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.leftEye || {}) }
                  },
                  glassPrescription: {
                    material: rx.glassPrescription?.material || '',
                    category: rx.glassPrescription?.category || '',
                    product: rx.glassPrescription?.product || '',
                    usage: rx.glassPrescription?.usage || '',
                    remarks: rx.glassPrescription?.remarks || '',
                    glassType: rx.glassPrescription?.glassType || ''
                  },
                  prescriptionDate: formatDate(appt.appointmentDate) || new Date().toISOString().split('T')[0]
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  prescriptionDate: formatDate(appt.appointmentDate) || new Date().toISOString().split('T')[0]
                }));
              }
            } catch (prevErr) {
              setFormData(prev => ({
                ...prev,
                prescriptionDate: formatDate(appt.appointmentDate) || new Date().toISOString().split('T')[0]
              }));
            }
          }
        } catch (apptErr) {
          console.error("Error fetching appointment directly:", apptErr);
        }
      } catch (err: any) {
        console.error("Critical Glass Rx Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [appointmentId, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Note: We only update the relevant parts for glass prescription
      // but the backend controller handles the merge
      await axios.post('/api/prescriptions', { ...formData, appointmentId }, config);
      alert('Glass Prescription successfully saved!');
      setHasExisting(true);
    } catch (error) {
      console.error(error);
      alert('Failed to save glass prescription.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading interface...</div>;
  if (!appointmentData) return <div style={{ padding: '2rem' }}>Error: Appointment data missing.</div>;

  const patient = appointmentData.patient;
  const doctor = user?.role === 'doctor' ? user : appointmentData.doctor;
  const docName = doctor?.name ? (doctor.name.toLowerCase().match(/^dr\.?\s+/) ? doctor.name : `Dr. ${doctor.name}`) : '';

  // Helper to show N/A for empty fields
  const val = (v: any) => (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : 'N/A';

  return (
    <>
      <div className="page-header print-hidden" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="#8b5cf6" />
          Glass Prescription
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/appointments')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }}>
            <Printer size={16} /> Print
          </button>
          <button className="btn-primary small" onClick={handleSave} disabled={saving} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Glass Rx'}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          *, *:before, *:after { box-sizing: border-box !important; }
          @page { 
            size: landscape; 
            margin: 0 !important; 
          }
          .print-hidden { display: none !important; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important;
            height: 100%;
            overflow: hidden;
          }
          .prescription-container { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important;
          }
          .glass-card { 
            box-shadow: none !important; 
            padding: 10mm !important; 
            margin: 0 !important; 
            border: none !important;
            width: 100% !important;
            height: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden;
          }
          thead { display: table-header-group; }
          tbody { display: table-row-group; }
          .form-input { border: none !important; background: transparent !important; padding: 0 !important; font-size: 0.9rem !important; font-weight: normal !important; }
          .prescription-header { 
            margin: 0 0 0.5rem 0 !important; 
            padding: 0.5rem 0 !important; 
            border-bottom: 2px solid var(--primary-color) !important;
            height: auto !important;
          }
          .prescription-header img { max-height: 150px !important; max-width: 380px !important; }
          h1 { font-size: 2.2rem !important; font-weight: 900 !important; margin: 0 !important; }
          h3 { margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; font-size: 0.9rem !important; }
          .spectacle-section-print { border: none !important; padding: 0 !important; margin-bottom: 1rem !important; overflow: visible !important; }
          .spectacle-section-print div { overflow: visible !important; }
          .spectacle-section-print h3 { border-bottom: none !important; margin: 0 0 0.5rem 0 !important; padding: 0 !important; }
          .table-container { margin: 0 !important; }
          .table-container table { border-collapse: collapse !important; width: 100% !important; border: 1.5px solid #000 !important; }
          .table-container table th { border: 1.5px solid #000 !important; padding: 6px 8px !important; font-weight: bold !important; text-align: center !important; }
          .table-container table td { border: 1.5px solid #000 !important; padding: 6px 8px !important; font-weight: normal !important; text-align: center !important; }
          .table-container table td .form-input { font-weight: normal !important; text-align: center !important; }
          table { font-size: 0.85rem !important; }
          th, td { padding: 4px !important; }
          .signature-section { margin-top: 1rem !important; }
          .important-message { margin-top: 0.5rem !important; padding-top: 0.25rem !important; }
          .important-message p { font-size: 0.65rem !important; line-height: 1.2 !important; }
        }
      `}</style>

      <div className="glass-card" style={{ background: 'white', padding: '3rem', margin: 0, minHeight: '600px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <td style={{ border: 'none' }}>
                <div className="prescription-header" style={{
                  background: 'white',
                  padding: '1rem 1.5rem',
                  margin: '-3rem -3rem 1.5rem -3rem',
                  borderBottom: '3px solid var(--primary-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '150px', maxWidth: '380px', objectFit: 'contain' }} className="prescription-logo" />
                    ) : (
                      <Eye size={40} color="var(--primary-color)" />
                    )}
                    <div>
                      <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, color: 'var(--primary-color)', textTransform: 'uppercase' }}>
                        {settings.clinicName}
                      </h1>
                      <p style={{ margin: '0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Glass Prescription
                      </p>
                    </div>
                  </div>

                  <div style={{ flex: 1.2, textAlign: 'right', color: '#1e293b', fontSize: '0.75rem', lineHeight: '1.2', fontWeight: 'bold' }}>
                    <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary-color)' }}>For Appointment:</p>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 800 }}>{settings.appointmentHours || 'Mon-Sat: 9:00AM - 6:00 PM'}</p>
                    {settings.address && settings.address.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ margin: 0, fontWeight: 800 }}>{line.toUpperCase()}</p>
                    ))}
                    <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>Tel: {settings.phone}</p>
                    <p style={{ margin: 0, fontWeight: 800 }}>Email: {settings.email}</p>
                    {settings.gstin && <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>GSTIN: {settings.gstin}</p>}
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: 'none' }}>
                {/* Patient Info Section */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '0.75rem', 
                  borderBottom: '1px solid #e2e8f0', 
                  paddingBottom: '0.5rem', 
                  marginBottom: '1rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>MRD No:</span> <b style={{ color: '#8b5cf6' }}>{val(patient?.mrdNumber)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Mobile:</span> <b>{val(patient?.phone)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Doctor:</span> <b>{val(docName)}</b></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Patient:</span> <b style={{ fontSize: '1rem' }}>{patient?.name}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span> <b>{formData.prescriptionDate ? new Date(formData.prescriptionDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Purpose:</span> <b>{val(patient?.purpose)}</b></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Address:</span> <span style={{ fontSize: '0.8rem' }}>{val(patient?.address)}</span></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Refd. By:</span> <b>{val(patient?.regdBy)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Age/Sex:</span> <b>{val(patient?.age)} / {val(patient?.gender)}</b></div>
                  </div>
                </div>

                {/* Spectacle Prescription Table */}
                <div className="spectacle-section-print">
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#1e293b', borderLeft: '3px solid #8b5cf6', paddingLeft: '0.5rem' }}>Spectacle Prescription</h3>
                  <div className="table-container" style={{ margin: '0 0 1rem 0', boxShadow: 'none' }}>
                  <table style={{ width: '100%', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Eye</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Sph</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Cyl</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Axis</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>V/A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['rightEye', 'leftEye'].map((eye) => (
                        <tr key={eye}>
                          <td style={{ fontWeight: 700, padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>{eye === 'rightEye' ? 'Right' : 'Left'}</td>
                          {['sph', 'cyl', 'axis', 'va'].map(field => (
                            <td key={field} style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ textAlign: 'center', width: '100%' }}
                                value={(formData.spectaclePrescription as any)[eye][field]}
                                placeholder="N/A"
                                onChange={e => setFormData({
                                  ...formData,
                                  spectaclePrescription: {
                                    ...formData.spectaclePrescription,
                                    [eye]: { ...(formData.spectaclePrescription as any)[eye], [field]: e.target.value }
                                  }
                                })} 
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Glass Customization Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Material', field: 'material' },
                    { label: 'Category', field: 'category' },
                    { label: 'Product', field: 'product' },
                    { label: 'Usage', field: 'usage' },
                    { label: 'Remarks', field: 'remarks' },
                    { label: 'Glass Type', field: 'glassType' }
                  ].map(item => (
                    <div key={item.field}>
                      <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: 600, fontSize: '0.75rem', color: '#4b5563' }}>{item.label}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ fontSize: '0.85rem', padding: '0.2rem 0.4rem' }}
                        value={(formData.glassPrescription as any)[item.field]} 
                        onChange={e => setFormData({
                          ...formData,
                          glassPrescription: { ...formData.glassPrescription, [item.field]: e.target.value }
                        })} 
                        placeholder="N/A"
                      />
                    </div>
                  ))}
                </div>

                {/* Signature Block */}
                <div className="signature-section" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #1e293b', height: '40px', marginBottom: '0.5rem' }}></div>
                    <p style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>OPTOMETRIST</p>
                  </div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #1e293b', height: '40px', marginBottom: '0.5rem' }}></div>
                    <p style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{docName}</p>
                    {doctor?.registrationNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Regd: {doctor.registrationNumber}</p>}
                  </div>
                </div>

                {/* Important Message Section - Single instance at bottom */}
                <div className="important-message" style={{ marginTop: '3rem', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>IMPORTANT MESSAGE FOR PATIENTS & ATTENDANTS:</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#475569', lineHeight: '1.4', maxWidth: '800px' }}>
                    Only one attendant is allowed with one patient in the hospital premisis. 
                    Children are susceptible to infections, hence, discourage them to visit hospital unless they need any aye treatment. 
                    Both parents may accompany in case of child patient.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GlassPrescriptionGenerator;
