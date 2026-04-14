import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Printer, ArrowLeft, Eye } from 'lucide-react';

const emptyEye = { sph: '', cyl: '', axis: '', add: '', vision: '' };

const PrescriptionGenerator = () => {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { settings } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [appointmentData, setAppointmentData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    rightEye: { ...emptyEye },
    leftEye: { ...emptyEye },
    notes: '',
    suggestedLens: '',
    recommendations: ''
  });

  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // First try to load an existing prescription
        try {
          const { data } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
          setFormData({
            rightEye: data.data.rightEye || { ...emptyEye },
            leftEye: data.data.leftEye || { ...emptyEye },
            notes: data.data.notes || '',
            suggestedLens: data.data.suggestedLens || '',
            recommendations: data.data.recommendations || ''
          });
          setAppointmentData({
            patient: data.data.patient,
            doctor: data.data.doctor,
            appointmentDate: data.data.appointment.appointmentDate
          });
          setHasExisting(true);
        } catch (err: any) {
          if (err.response?.status === 404) {
            // No prescription exists yet, we get appointment context to build empty format
            const apptRes = await axios.get('/api/appointments', config);
            const appt = apptRes.data.data.find((a: any) => a._id === appointmentId);
            if (appt) {
              setAppointmentData(appt);
            }
          }
        }
      } catch (error) {
        console.error(error);
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
      await axios.post('/api/prescriptions', { ...formData, appointmentId }, config);
      alert('Prescription successfully saved to database!');
      setHasExisting(true);
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

  if (loading) return <div style={{ padding: '2rem' }}>Loading clinical interface...</div>;
  if (!appointmentData) return <div style={{ padding: '2rem' }}>Error: Appointment data context missing.</div>;

  const patient = appointmentData.patient;
  const doctor = user?.role === 'doctor' ? user : appointmentData.doctor; // Fallback

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--primary-color)" />
          Clinical Prescription
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/appointments')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          
          <button className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }}>
            <Printer size={16} /> Print Document
          </button>
          
          {user?.role === 'doctor' && (
            <button className="btn-primary small" onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Saving...' : (hasExisting ? 'Update Record' : 'Save & Publish')}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ background: 'white', padding: '3rem', margin: 0, minHeight: '800px' }}>
        
        {/* Document Header (For Printing) */}
        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                <Eye size={32} /> {settings.clinicName}
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>{settings.address}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Phone: {settings.phone}</p>
            </div>
           
           <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Dr. {doctor?.name}</h3>
              {doctor?.specialization && <p style={{ margin: 0, color: '#64748b' }}>{doctor.specialization}</p>}
              <p style={{ margin: 0, color: '#64748b' }}>Date: {new Date(appointmentData.appointmentDate).toLocaleDateString()}</p>
           </div>
        </div>

        {/* Patient Block */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
           <div><span style={{color: '#64748b'}}>Patient Name:</span> <br/><b>{patient?.name}</b></div>
           <div><span style={{color: '#64748b'}}>Age/Gender:</span> <br/><b>{patient?.age} / {patient?.gender}</b></div>
           <div><span style={{color: '#64748b'}}>Contact:</span> <br/><b>{patient?.phone}</b></div>
        </div>

        {/* Optical Measurements */}
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Optical Measurements</h3>
        
        <div className="table-container" style={{ margin: '0 0 2rem 0', boxShadow: 'none' }}>
           <table style={{ width: '100%', border: '1px solid #e2e8f0' }}>
             <thead>
               <tr style={{ background: '#f1f5f9' }}>
                 <th>Eye</th>
                 <th>Sphere (SPH)</th>
                 <th>Cylinder (CYL)</th>
                 <th>Axis</th>
                 <th>Add</th>
                 <th>Vision Acuity</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style={{ fontWeight: 600 }}>Right (O.D.)</td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.rightEye.sph} onChange={e => setFormData({...formData, rightEye: {...formData.rightEye, sph: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.rightEye.cyl} onChange={e => setFormData({...formData, rightEye: {...formData.rightEye, cyl: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.rightEye.axis} onChange={e => setFormData({...formData, rightEye: {...formData.rightEye, axis: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.rightEye.add} onChange={e => setFormData({...formData, rightEye: {...formData.rightEye, add: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.rightEye.vision} onChange={e => setFormData({...formData, rightEye: {...formData.rightEye, vision: e.target.value}})} placeholder="e.g. 20/20" /></td>
               </tr>
               <tr>
                 <td style={{ fontWeight: 600 }}>Left (O.S.)</td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.leftEye.sph} onChange={e => setFormData({...formData, leftEye: {...formData.leftEye, sph: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.leftEye.cyl} onChange={e => setFormData({...formData, leftEye: {...formData.leftEye, cyl: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.leftEye.axis} onChange={e => setFormData({...formData, leftEye: {...formData.leftEye, axis: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.leftEye.add} onChange={e => setFormData({...formData, leftEye: {...formData.leftEye, add: e.target.value}})} /></td>
                 <td><input type="text" className="form-input" style={{ padding: '0.25rem' }} value={formData.leftEye.vision} onChange={e => setFormData({...formData, leftEye: {...formData.leftEye, vision: e.target.value}})} placeholder="e.g. 20/25" /></td>
               </tr>
             </tbody>
           </table>
        </div>

        {/* Doctor Orders */}
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Doctor's Notes & Recommendations</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
           <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Clinical Notes</label>
              <textarea 
                className="form-input" 
                rows={4} 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Observation details..."
              ></textarea>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Suggested Lens Type</label>
                <select className="form-input" value={formData.suggestedLens} onChange={e => setFormData({...formData, suggestedLens: e.target.value})}>
                   <option value="">-- None --</option>
                   <option value="Single Vision">Single Vision</option>
                   <option value="Bifocal">Bifocal</option>
                   <option value="Progressive">Progressive</option>
                   <option value="Contact Lenses">Contact Lenses</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Further Recommendations (Surgery/Frames)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.recommendations}
                  onChange={e => setFormData({...formData, recommendations: e.target.value})}
                  placeholder="e.g., Recommended light frames, LASIK consult..." 
                />
              </div>
           </div>
        </div>

        {/* Signature Line for Print */}
        <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'flex-end' }}>
           <div style={{ textAlign: 'center', width: '250px' }}>
              <div style={{ borderBottom: '1px solid black', height: '40px' }}></div>
              <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Doctor's Original Signature</p>
           </div>
        </div>

      </div>
    </>
  );
};

export default PrescriptionGenerator;
