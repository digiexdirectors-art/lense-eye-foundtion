import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Printer, ArrowLeft, Eye, Plus, Trash2, Save, Download } from 'lucide-react';

const emptyEye = { pgvn: '', bcvn: '', nct: '' };
const emptyOptTest = { acd: '', pupillaryReaction: '', eom: '' };
const emptySpectacle = { sph: '', cyl: '', axis: '', va: '' };
const emptyExamination = { anteriorSegment: '', posteriorSegment: '' };

const PrescriptionGenerator = () => {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { settings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appointmentData, setAppointmentData] = useState<any>(null);

  const [formData, setFormData] = useState({
    chiefComplaints: '',
    generalHealth: '',
    pastHistory: '',
    rightEye: { ...emptyEye },
    leftEye: { ...emptyEye },
    optTest: {
      rightEye: { ...emptyOptTest },
      leftEye: { ...emptyOptTest }
    },
    spectaclePrescription: {
      rightEye: { ...emptySpectacle },
      leftEye: { ...emptySpectacle }
    },
    examinationFinding: {
      rightEye: { ...emptyExamination },
      leftEye: { ...emptyExamination }
    },
    diagnosis: '',
    medications: [{ name: '', description: '' }],
    comments: '',
    notes: '',
    suggestedLens: '',
    recommendations: '',
    prescriptionDate: '',
    nextReviewDate: '',
    nextReviewNote: ''
  });

  const [hasExisting, setHasExisting] = useState(false);

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
              chiefComplaints: rx.chiefComplaints || '',
              generalHealth: rx.generalHealth || '',
              pastHistory: rx.pastHistory || '',
              rightEye: { ...emptyEye, ...(rx.rightEye || {}) },
              leftEye: { ...emptyEye, ...(rx.leftEye || {}) },
              optTest: {
                rightEye: { ...emptyOptTest, ...(rx.optTest?.rightEye || {}) },
                leftEye: { ...emptyOptTest, ...(rx.optTest?.leftEye || {}) }
              },
              spectaclePrescription: {
                rightEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.rightEye || {}) },
                leftEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.leftEye || {}) }
              },
              examinationFinding: {
                rightEye: { ...emptyExamination, ...(rx.examinationFinding?.rightEye || {}) },
                leftEye: { ...emptyExamination, ...(rx.examinationFinding?.leftEye || {}) }
              },
              diagnosis: rx.diagnosis || '',
              medications: rx.medications?.length ? rx.medications.map((m: any) => typeof m === 'string' ? { name: m, description: '' } : { name: m.name || '', description: m.description || '' }) : [{ name: '', description: '' }],
              comments: rx.comments || '',
              notes: rx.notes || '',
              suggestedLens: rx.suggestedLens || '',
              recommendations: rx.recommendations || '',
              prescriptionDate: formatDate(rx.prescriptionDate),
              nextReviewDate: rx.nextReviewDate || '',
              nextReviewNote: rx.nextReviewNote || ''
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
          console.log("No existing clinical prescription found.");
        }

        // 2. Fallback: Fetch appointment details directly
        try {
          const { data } = await axios.get(`/api/appointments/${appointmentId}`, config);
          if (data.success && data.data) {
            const appt = data.data;
            const formatDate = (d: any) => {
              if (!d) return '';
              const date = new Date(d);
              return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
            };

            setAppointmentData(appt);
            setFormData(prev => ({
              ...prev,
              prescriptionDate: formatDate(appt.appointmentDate) || new Date().toISOString().split('T')[0]
            }));
          }
        } catch (apptErr) {
          console.error("Error fetching appointment directly:", apptErr);
          // 3. Last resort: Try list
          const apptRes = await axios.get('/api/appointments', config);
          const appt = apptRes.data.data.find((a: any) => a._id === appointmentId);
          if (appt) {
            setAppointmentData(appt);
            setFormData(prev => ({
              ...prev,
              prescriptionDate: new Date(appt.appointmentDate).toISOString().split('T')[0]
            }));
          }
        }
      } catch (err: any) {
        console.error("Critical Clinical Rx Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [appointmentId, token]);

  const handleSave = async (silent = false) => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/prescriptions', { ...formData, appointmentId }, config);
      if (!silent) alert('Prescription successfully saved to database!');

      // Re-fetch to ensure all data is in sync and "showing"
      const { data } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
      if (data.success && data.data) {
        const rx = data.data;
        const formatDate = (d: any) => {
          if (!d) return '';
          const date = new Date(d);
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        };

        setFormData({
          chiefComplaints: rx.chiefComplaints || '',
          generalHealth: rx.generalHealth || '',
          pastHistory: rx.pastHistory || '',
          rightEye: { ...emptyEye, ...(rx.rightEye || {}) },
          leftEye: { ...emptyEye, ...(rx.leftEye || {}) },
          optTest: {
            rightEye: { ...emptyOptTest, ...(rx.optTest?.rightEye || {}) },
            leftEye: { ...emptyOptTest, ...(rx.optTest?.leftEye || {}) }
          },
          spectaclePrescription: {
            rightEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.rightEye || {}) },
            leftEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.leftEye || {}) }
          },
          examinationFinding: {
            rightEye: { ...emptyExamination, ...(rx.examinationFinding?.rightEye || {}) },
            leftEye: { ...emptyExamination, ...(rx.examinationFinding?.leftEye || {}) }
          },
          diagnosis: rx.diagnosis || '',
          medications: rx.medications?.length ? rx.medications.map((m: any) => typeof m === 'string' ? { name: m, description: '' } : { name: m.name || '', description: m.description || '' }) : [{ name: '', description: '' }],
          comments: rx.comments || '',
          notes: rx.notes || '',
          suggestedLens: rx.suggestedLens || '',
          recommendations: rx.recommendations || '',
          prescriptionDate: formatDate(rx.prescriptionDate),
          nextReviewDate: rx.nextReviewDate || '',
          nextReviewNote: rx.nextReviewNote || ''
        });
        setHasExisting(true);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // Force a save to ensure backend has the absolute latest data before generating PDF
    await handleSave(true);

    fetch(`/api/prescriptions/appointment/${appointmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data._id) {
          const downloadUrl = `${axios.defaults.baseURL || ''}/api/prescriptions/${data.data._id}/pdf?token=${token}&t=${Date.now()}`;
          window.open(downloadUrl, '_blank');
        }
      });
  };

  const addMedication = () => setFormData({ ...formData, medications: [...formData.medications, { name: '', description: '' }] });

  const removeMedication = (index: number) => {
    const newMeds = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMeds.length ? newMeds : [{ name: '', description: '' }] });
  };

  const updateMedication = (index: number, field: 'name' | 'description', value: string) => {
    const newMeds = [...formData.medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setFormData({ ...formData, medications: newMeds });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading clinical interface...</div>;
  if (!appointmentData) return <div style={{ padding: '2rem' }}>Error: Appointment data context missing.</div>;

  const patient = appointmentData.patient;
  const doctor = user?.role === 'doctor' ? user : appointmentData.doctor; // Fallback

  const docName = doctor?.name ? (doctor.name.toLowerCase().match(/^dr\.?\s+/) ? doctor.name : `Dr. ${doctor.name}`) : '';

  // Helper to show N/A for empty fields
  const val = (v: any) => (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : 'N/A';

  return (
    <>
      <div className="page-header print-hidden" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--primary-color)" />
          Clinical Prescription
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/appointments')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back
          </button>

          <button className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }}>
            <Printer size={16} /> Print
          </button>

          {hasExisting && (
            <button className="btn-secondary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
              <Download size={16} /> Download
            </button>
          )}

          <button className="btn-primary small" onClick={() => handleSave()} disabled={saving} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> {saving ? 'Saving...' : (hasExisting ? 'Update Record' : 'Save & Publish')}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            size: auto; 
            margin: 0 !important; 
          }
          .print-hidden { display: none !important; }
          .print-row { display: flex; flex-wrap: wrap; margin-bottom: 0.5rem; }
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
          .glass-card { 
            box-shadow: none !important; 
            padding: 15mm !important; 
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: auto !important;
            height: auto !important;
            width: 100% !important;
          }
          .form-input { border: none !important; background: transparent !important; padding: 0 !important; font-size: 0.9rem !important; }
          textarea.form-input { resize: none; overflow: hidden; height: auto !important; }
          .add-med-btn, .remove-med-btn { display: none !important; }
          .prescription-header { margin: 0 0 1rem 0 !important; border-radius: 0 !important; padding: 1rem !important; }
          .glass-card > div { margin-bottom: 0.75rem !important; }
          .signature-block { margin-top: 2rem !important; page-break-inside: avoid !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      <div className="glass-card" style={{ background: 'white', padding: '3rem', margin: 0, minHeight: '800px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <td style={{ border: 'none' }}>
                {/* Header */}
                <div className="prescription-header" style={{
                  background: 'white',
                  padding: '0.75rem 1.5rem',
                  margin: '-3rem -3rem 1rem -3rem',
                  borderBottom: '3px solid var(--primary-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '70px', maxWidth: '160px', objectFit: 'contain' }} />
                    ) : (
                      <Eye size={40} color="var(--primary-color)" />
                    )}
                    <div>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--primary-color)', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                        {settings.clinicName}
                      </h1>
                      <p style={{ margin: '0', fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Clinical Prescription
                      </p>
                    </div>
                  </div>

                  <div style={{ flex: 1.2, textAlign: 'right', color: '#1e293b', fontSize: '0.75rem', lineHeight: '1.2' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary-color)' }}>For Appointment:</p>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: 'var(--primary-color)' }}>{settings.appointmentHours || 'Mon-Sat: 9:00AM - 6:00 PM'}</p>
                    {settings.address && settings.address.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ margin: 0, fontWeight: 700 }}>{line.toUpperCase()}</p>
                    ))}
                    <p style={{ margin: '2px 0 0 0' }}><b>Tel:</b> {settings.phone}</p>
                    <p style={{ margin: 0 }}><b>Email:</b> {settings.email}</p>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.9rem' }}>GSTIN: {settings.gstin}</p>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: 'none' }}>
                {/* 3-Column Patient & Doctor Info Section */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '0.75rem', 
                  borderBottom: '1px solid #e2e8f0', 
                  paddingBottom: '0.5rem', 
                  marginBottom: '0.75rem',
                  fontSize: '0.8rem'
                }}>
                  {/* Column 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>MRD No:</span> <b style={{ color: 'var(--primary-color)' }}>{val(patient?.mrdNumber)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Mobile No:</span> <b>{val(patient?.phone)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Doctor:</span> <b>{val(docName)}</b></div>
                  </div>

                  {/* Column 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Patient Name:</span> <b style={{ fontSize: '1rem' }}>{val(patient?.name)}</b></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span>
                      <input
                        type="date"
                        className="form-input print-hidden"
                        style={{ width: '120px', padding: '0.1rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}
                        value={formData.prescriptionDate}
                        onChange={e => setFormData({ ...formData, prescriptionDate: e.target.value })}
                      />
                      <span className="print-only" style={{ display: 'none' }}>
                        {formData.prescriptionDate ? new Date(formData.prescriptionDate).toLocaleDateString() : new Date(appointmentData.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Purpose:</span> <b>{val(patient?.purpose)}</b></div>
                  </div>

                  {/* Column 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Address:</span> <span style={{ fontSize: '0.8rem' }}>{val(patient?.address)}</span></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Refd. By:</span> <b>{val(patient?.regdBy)}</b></div>
                    <div><span style={{ color: '#64748b', fontWeight: 600 }}>Age / Sex:</span> <b>{val(patient?.age)} / {val(patient?.gender)}</b></div>
                  </div>
                </div>

                {/* History Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary-color)' }}>Chief Complaints</label>
                    <textarea className="form-input" rows={1} value={formData.chiefComplaints} onChange={e => setFormData({ ...formData, chiefComplaints: e.target.value })} placeholder="N/A" style={{ fontSize: '0.85rem' }}></textarea>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary-color)' }}>General Health</label>
                    <textarea className="form-input" rows={1} value={formData.generalHealth} onChange={e => setFormData({ ...formData, generalHealth: e.target.value })} placeholder="N/A" style={{ fontSize: '0.85rem' }}></textarea>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary-color)' }}>Past History</label>
                    <textarea className="form-input" rows={1} value={formData.pastHistory} onChange={e => setFormData({ ...formData, pastHistory: e.target.value })} placeholder="N/A" style={{ fontSize: '0.85rem' }}></textarea>
                  </div>
                </div>

                {/* Optical Measurements Table */}
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#1e293b' }}>Refraction / Examination</h3>
                <div className="table-container" style={{ margin: '0 0 1.5rem 0', boxShadow: 'none' }}>
                  <table style={{ width: '100%', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>Eye</th>
                        <th>PGVN</th>
                        <th>BCVN</th>
                        <th>NCT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>RE (O.D.)</td>
                        {['pgvn', 'bcvn', 'nct'].map(field => (
                          <td key={field} style={{ padding: '0.25rem' }}>
                            <input type="text" className="form-input" style={{ padding: '0.25rem', textAlign: 'center' }}
                              value={(formData.rightEye as any)[field]}
                              placeholder="N/A"
                              onChange={e => setFormData({
                                ...formData,
                                rightEye: { ...formData.rightEye, [field]: e.target.value }
                              })} />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>LE (O.S.)</td>
                        {['pgvn', 'bcvn', 'nct'].map(field => (
                          <td key={field} style={{ padding: '0.25rem' }}>
                            <input type="text" className="form-input" style={{ padding: '0.25rem', textAlign: 'center' }}
                              value={(formData.leftEye as any)[field]}
                              placeholder="N/A"
                              onChange={e => setFormData({
                                ...formData,
                                leftEye: { ...formData.leftEye, [field]: e.target.value }
                              })} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* OPD Tests */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>OPD Test - RE</h4>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>ACD</label>
                        <input type="text" className="form-input" value={formData.optTest.rightEye.acd} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, rightEye: { ...formData.optTest.rightEye, acd: e.target.value } } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pupillary Reaction</label>
                        <input type="text" className="form-input" value={formData.optTest.rightEye.pupillaryReaction} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, rightEye: { ...formData.optTest.rightEye, pupillaryReaction: e.target.value } } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>EOM</label>
                        <input type="text" className="form-input" value={formData.optTest.rightEye.eom} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, rightEye: { ...formData.optTest.rightEye, eom: e.target.value } } })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>OPD Test - LE</h4>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>ACD</label>
                        <input type="text" className="form-input" value={formData.optTest.leftEye.acd} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, leftEye: { ...formData.optTest.leftEye, acd: e.target.value } } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pupillary Reaction</label>
                        <input type="text" className="form-input" value={formData.optTest.leftEye.pupillaryReaction} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, leftEye: { ...formData.optTest.leftEye, pupillaryReaction: e.target.value } } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>EOM</label>
                        <input type="text" className="form-input" value={formData.optTest.leftEye.eom} placeholder="N/A" onChange={e => setFormData({ ...formData, optTest: { ...formData.optTest, leftEye: { ...formData.optTest.leftEye, eom: e.target.value } } })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spectacle Prescription Section */}
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#1e293b' }}>Spectacle Prescription</h3>
                <div className="table-container" style={{ margin: '0 0 1.5rem 0', boxShadow: 'none' }}>
                  <table style={{ width: '100%', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>Eye</th>
                        <th>Sph</th>
                        <th>Cyl</th>
                        <th>Axis</th>
                        <th>V/A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['rightEye', 'leftEye'].map((eye) => (
                        <tr key={eye}>
                          <td style={{ fontWeight: 600 }}>{eye === 'rightEye' ? 'RE (O.D.)' : 'LE (O.S.)'}</td>
                          {['sph', 'cyl', 'axis', 'va'].map(field => (
                            <td key={field} style={{ padding: '0.25rem' }}>
                              <input type="text" className="form-input" style={{ padding: '0.25rem', textAlign: 'center' }}
                                value={(formData.spectaclePrescription as any)[eye][field]}
                                placeholder="N/A"
                                onChange={e => setFormData({
                                  ...formData,
                                  spectaclePrescription: {
                                    ...formData.spectaclePrescription,
                                    [eye]: { ...(formData.spectaclePrescription as any)[eye], [field]: e.target.value }
                                  }
                                })} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Examination Finding Section */}
                <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', color: '#1e293b' }}>Examination Finding</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--primary-color)' }}>Right Eye (RE)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Anterior Segment</label>
                        <input type="text" className="form-input" value={formData.examinationFinding.rightEye.anteriorSegment} placeholder="N/A" onChange={e => setFormData({ ...formData, examinationFinding: { ...formData.examinationFinding, rightEye: { ...formData.examinationFinding.rightEye, anteriorSegment: e.target.value } } })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Posterior Segment</label>
                        <input type="text" className="form-input" value={formData.examinationFinding.rightEye.posteriorSegment} placeholder="N/A" onChange={e => setFormData({ ...formData, examinationFinding: { ...formData.examinationFinding, rightEye: { ...formData.examinationFinding.rightEye, posteriorSegment: e.target.value } } })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--primary-color)' }}>Left Eye (LE)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Anterior Segment</label>
                        <input type="text" className="form-input" value={formData.examinationFinding.leftEye.anteriorSegment} placeholder="N/A" onChange={e => setFormData({ ...formData, examinationFinding: { ...formData.examinationFinding, leftEye: { ...formData.examinationFinding.leftEye, anteriorSegment: e.target.value } } })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Posterior Segment</label>
                        <input type="text" className="form-input" value={formData.examinationFinding.leftEye.posteriorSegment} placeholder="N/A" onChange={e => setFormData({ ...formData, examinationFinding: { ...formData.examinationFinding, leftEye: { ...formData.examinationFinding.leftEye, posteriorSegment: e.target.value } } })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Medications */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Diagnosis</label>
                  <input type="text" className="form-input" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} placeholder="N/A" style={{ fontWeight: 600, color: 'var(--primary-color)' }} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Rx</span> Medications
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {formData.medications.map((med, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ width: '15px', fontWeight: 600, color: '#64748b', marginTop: '0.3rem', fontSize: '0.8rem' }}>{idx + 1}.</span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, minWidth: '70px' }}>Medication</label>
                            <input
                              type="text"
                              className="form-input"
                              value={med.name}
                              onChange={e => updateMedication(idx, 'name', e.target.value)}
                              placeholder="N/A"
                              style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, minWidth: '70px' }}>Description</label>
                            <input
                              type="text"
                              className="form-input"
                              value={med.description}
                              onChange={e => updateMedication(idx, 'description', e.target.value)}
                              placeholder="N/A"
                              style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                        <button type="button" className="print-hidden remove-med-btn" onClick={() => removeMedication(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', marginTop: '0.1rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-secondary small print-hidden add-med-btn" onClick={addMedication} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}>
                    <Plus size={14} /> ADD MORE MEDICATIONS
                  </button>
                </div>

                {/* Additional Notes & Review */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>General Comments / Notes</label>
                    <textarea className="form-input" rows={3} value={formData.comments} onChange={e => setFormData({ ...formData, comments: e.target.value })} placeholder="Any other remarks..."></textarea>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Suggested Lens</label>
                        <select className="form-input" value={formData.suggestedLens} onChange={e => setFormData({ ...formData, suggestedLens: e.target.value })}>
                          <option value="">-- None --</option>
                          <option value="Single Vision">Single Vision</option>
                          <option value="Bifocal">Bifocal</option>
                          <option value="Progressive">Progressive</option>
                          <option value="Contact Lenses">Contact Lenses</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Next Review Date</label>
                        <input type="date" className="form-input" value={formData.nextReviewDate} onChange={e => setFormData({ ...formData, nextReviewDate: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Review Note / Action</label>
                      <input type="text" className="form-input" value={formData.nextReviewNote} onChange={e => setFormData({ ...formData, nextReviewNote: e.target.value })} placeholder="N/A" />
                    </div>
                  </div>
                </div>

                {/* Signature Line for Print */}
                <div className="signature-block" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid black', height: '30px' }}></div>
                    <p style={{ marginTop: '0.5rem', color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{docName}</p>
                    {doctor?.registrationNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Regd. Number: {doctor.registrationNumber}</p>}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PrescriptionGenerator;
