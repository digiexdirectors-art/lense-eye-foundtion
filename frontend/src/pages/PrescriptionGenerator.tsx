import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Printer, ArrowLeft, Eye, Plus, Trash2, Save, Download } from 'lucide-react';

const emptyEye = { pgvn: '', bcvn: '', nct: '' };
const emptyOptTest = { acid: '', pupillaryReaction: '', eom: '' };

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
        try {
          const { data } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
          
          if (data.success && data.data) {
            const rx = data.data;
            setFormData({
              chiefComplaints: rx.chiefComplaints || '',
              generalHealth: rx.generalHealth || '',
              pastHistory: rx.pastHistory || '',
              rightEye: { ...emptyEye, ...rx.rightEye },
              leftEye: { ...emptyEye, ...rx.leftEye },
              optTest: {
                rightEye: { ...emptyOptTest, ...(rx.optTest?.rightEye || {}) },
                leftEye: { ...emptyOptTest, ...(rx.optTest?.leftEye || {}) }
              },
              diagnosis: rx.diagnosis || '',
              medications: rx.medications?.length ? rx.medications.map((m: any) => typeof m === 'string' ? { name: m, description: '' } : { name: m.name || '', description: m.description || '' }) : [{ name: '', description: '' }],
              comments: rx.comments || '',
              notes: rx.notes || '',
              suggestedLens: rx.suggestedLens || '',
              recommendations: rx.recommendations || '',
              prescriptionDate: rx.prescriptionDate ? new Date(rx.prescriptionDate).toISOString().split('T')[0] : '',
              nextReviewDate: rx.nextReviewDate || '',
              nextReviewNote: rx.nextReviewNote || ''
            });
            setAppointmentData({
              patient: rx.patient,
              doctor: rx.doctor,
              appointmentDate: rx.appointment?.appointmentDate || rx.createdAt
            });
            setHasExisting(true);
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
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
        }
      } catch (error) {
        console.error("Context fetch error", error);
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
        setFormData({
          chiefComplaints: rx.chiefComplaints || '',
          generalHealth: rx.generalHealth || '',
          pastHistory: rx.pastHistory || '',
          rightEye: { ...emptyEye, ...rx.rightEye },
          leftEye: { ...emptyEye, ...rx.leftEye },
          optTest: {
            rightEye: { ...emptyOptTest, ...(rx.optTest?.rightEye || {}) },
            leftEye: { ...emptyOptTest, ...(rx.optTest?.leftEye || {}) }
          },
          diagnosis: rx.diagnosis || '',
          medications: rx.medications?.length ? rx.medications.map((m: any) => typeof m === 'string' ? { name: m, description: '' } : { name: m.name || '', description: m.description || '' }) : [{ name: '', description: '' }],
          comments: rx.comments || '',
          notes: rx.notes || '',
          suggestedLens: rx.suggestedLens || '',
          recommendations: rx.recommendations || '',
          prescriptionDate: rx.prescriptionDate ? new Date(rx.prescriptionDate).toISOString().split('T')[0] : '',
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
          
          <button className="btn-primary small" onClick={handleSave} disabled={saving} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> {saving ? 'Saving...' : (hasExisting ? 'Update Record' : 'Save & Publish')}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .print-row { display: flex; flex-wrap: wrap; margin-bottom: 0.5rem; }
          .glass-card { box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .form-input { border: none !important; background: transparent !important; padding: 0 !important; font-size: 0.9rem !important; }
          textarea.form-input { resize: none; overflow: hidden; height: auto !important; }
          .add-med-btn, .remove-med-btn { display: none !important; }
          .prescription-header { margin: 0 0 1rem 0 !important; border-radius: 0 !important; padding: 1rem !important; }
          .glass-card > div { margin-bottom: 0.75rem !important; }
          .signature-block { margin-top: 2rem !important; }
          .print-only { display: block !important; }
          @page { margin: 8mm; }
        }
      `}</style>

      <div className="glass-card" style={{ background: 'white', padding: '3rem', margin: 0, minHeight: '800px' }}>
        
        {/* Document Header (For Printing) */}
        <div className="prescription-header" style={{ 
          background: '#e0f2fe', 
          padding: '1.5rem', 
          margin: '-3rem -3rem 2rem -3rem', 
          borderBottom: '3px solid var(--primary-color)',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
           <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
             {settings.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '130px', maxWidth: '350px', objectFit: 'contain' }} />
             ) : (
               <Eye size={48} color="var(--primary-color)" />
             )}
           </div>
           
           <div style={{ flex: 2, textAlign: 'right', color: '#0f172a' }}>
              <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', margin: '0 0 0.25rem 0', color: '#1e40af' }}>
                {settings.clinicName}
              </h1>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{settings.address}</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Tel: {settings.phone} | Email: {settings.email} | GSTIN: {settings.gstin}</p>
           </div>
        </div>

        {/* Doctor and Date Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>{docName}</h3>
            {doctor?.specialization && <p style={{ margin: '0 0 0.1rem 0', color: '#64748b', fontSize: '0.9rem' }}>{doctor.specialization}</p>}
            {doctor?.qualifications && <p style={{ margin: '0 0 0.1rem 0', color: '#64748b', fontSize: '0.85rem' }}>{doctor.qualifications}</p>}
            {doctor?.registrationNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Regd. Number: {doctor.registrationNumber}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span>
              <input 
                type="date" 
                className="form-input print-hidden" 
                style={{ width: '130px', padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                value={formData.prescriptionDate}
                onChange={e => setFormData({...formData, prescriptionDate: e.target.value})}
              />
              <span className="print-only" style={{ display: 'none', fontWeight: 600, color: '#1e293b' }}>
                {formData.prescriptionDate ? new Date(formData.prescriptionDate).toLocaleDateString() : new Date(appointmentData.appointmentDate).toLocaleDateString()}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Ref: APPT-{appointmentId?.slice(-6).toUpperCase() || ''}</p>
          </div>
        </div>

        {/* Patient Block */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
           <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>PATIENT NAME:</span> <br/><b style={{fontSize: '1.1rem'}}>{patient?.name}</b></div>
           <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>AGE / SEX:</span> <br/><b style={{fontSize: '1.1rem'}}>{patient?.age} / {patient?.gender}</b></div>
           <div><span style={{color: '#64748b', fontSize: '0.8rem'}}>CONTACT & ADDRESS:</span> <br/><b>{patient?.phone}</b><br/><span style={{fontSize: '0.85rem'}}>{patient?.address}</span></div>
        </div>

        {/* History Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-color)' }}>Chief Complaints</label>
            <textarea className="form-input" rows={2} value={formData.chiefComplaints} onChange={e => setFormData({...formData, chiefComplaints: e.target.value})} placeholder="e.g. Blurry vision, headaches..."></textarea>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-color)' }}>General Health</label>
            <textarea className="form-input" rows={2} value={formData.generalHealth} onChange={e => setFormData({...formData, generalHealth: e.target.value})} placeholder="e.g. Diabetic, HTN..."></textarea>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-color)' }}>Past History</label>
            <textarea className="form-input" rows={2} value={formData.pastHistory} onChange={e => setFormData({...formData, pastHistory: e.target.value})} placeholder="e.g. Cataract surgery 2020..."></textarea>
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
                            onChange={e => setFormData({
                              ...formData, 
                              rightEye: {...formData.rightEye, [field]: e.target.value}
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
                            onChange={e => setFormData({
                              ...formData, 
                              leftEye: {...formData.leftEye, [field]: e.target.value}
                            })} />
                   </td>
                 ))}
               </tr>
             </tbody>
           </table>
        </div>

        {/* OPT Tests */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>OPT Test - Right Eye (RE)</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>ACID</label>
                <input type="text" className="form-input" value={formData.optTest.rightEye.acid} onChange={e => setFormData({...formData, optTest: {...formData.optTest, rightEye: {...formData.optTest.rightEye, acid: e.target.value}}})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>Pupil. Rxn</label>
                <input type="text" className="form-input" value={formData.optTest.rightEye.pupillaryReaction} onChange={e => setFormData({...formData, optTest: {...formData.optTest, rightEye: {...formData.optTest.rightEye, pupillaryReaction: e.target.value}}})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>EOM</label>
                <input type="text" className="form-input" value={formData.optTest.rightEye.eom} onChange={e => setFormData({...formData, optTest: {...formData.optTest, rightEye: {...formData.optTest.rightEye, eom: e.target.value}}})} />
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>OPT Test - Left Eye (LE)</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>ACID</label>
                <input type="text" className="form-input" value={formData.optTest.leftEye.acid} onChange={e => setFormData({...formData, optTest: {...formData.optTest, leftEye: {...formData.optTest.leftEye, acid: e.target.value}}})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>Pupil. Rxn</label>
                <input type="text" className="form-input" value={formData.optTest.leftEye.pupillaryReaction} onChange={e => setFormData({...formData, optTest: {...formData.optTest, leftEye: {...formData.optTest.leftEye, pupillaryReaction: e.target.value}}})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem' }}>EOM</label>
                <input type="text" className="form-input" value={formData.optTest.leftEye.eom} onChange={e => setFormData({...formData, optTest: {...formData.optTest, leftEye: {...formData.optTest.leftEye, eom: e.target.value}}})} />
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis & Medications */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Diagnosis</label>
          <input type="text" className="form-input" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} placeholder="Primary and secondary diagnosis..." style={{ fontWeight: 600, color: 'var(--primary-color)' }} />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>Rx</span> Medications
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {formData.medications.map((med, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ width: '20px', fontWeight: 600, color: '#64748b', marginTop: '0.5rem' }}>{idx + 1}.</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '80px' }}>Medication</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={med.name} 
                      onChange={e => updateMedication(idx, 'name', e.target.value)} 
                      placeholder="Medicine name (e.g., Moxifloxacin Eye Drops)" 
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '80px' }}>Description</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={med.description} 
                      onChange={e => updateMedication(idx, 'description', e.target.value)} 
                      placeholder="Dosage, frequency, duration (e.g., 1 drop thrice a day for 5 days)" 
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <button type="button" className="print-hidden remove-med-btn" onClick={() => removeMedication(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', marginTop: '0.25rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary small print-hidden add-med-btn" onClick={addMedication} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Plus size={16} /> ADD MORE MEDICATIONS
          </button>
        </div>

        {/* Additional Notes & Review */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
           <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>General Comments / Notes</label>
              <textarea className="form-input" rows={3} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} placeholder="Any other remarks..."></textarea>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Suggested Lens</label>
                  <select className="form-input" value={formData.suggestedLens} onChange={e => setFormData({...formData, suggestedLens: e.target.value})}>
                     <option value="">-- None --</option>
                     <option value="Single Vision">Single Vision</option>
                     <option value="Bifocal">Bifocal</option>
                     <option value="Progressive">Progressive</option>
                     <option value="Contact Lenses">Contact Lenses</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Next Review Date</label>
                  <input type="date" className="form-input" value={formData.nextReviewDate} onChange={e => setFormData({...formData, nextReviewDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>Review Note / Action</label>
                <input type="text" className="form-input" value={formData.nextReviewNote} onChange={e => setFormData({...formData, nextReviewNote: e.target.value})} placeholder="e.g. Come for follow-up, Bring reports..." />
              </div>
           </div>
        </div>

        {/* Signature Line for Print */}
        <div className="signature-block" style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
           <div style={{ textAlign: 'center', width: '250px' }}>
              <div style={{ borderBottom: '1px solid black', height: '40px' }}></div>
              <p style={{ marginTop: '0.5rem', color: '#1e293b', fontWeight: 600 }}>{docName}</p>
              {doctor?.registrationNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Regd. Number: {doctor.registrationNumber}</p>}
           </div>
        </div>

      </div>
    </>
  );
};

export default PrescriptionGenerator;
