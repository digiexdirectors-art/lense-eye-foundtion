import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalPortal from './ModalPortal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '09:00 AM',
    reason: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const patientsRes = await axios.get('/api/patients', config);
          setPatients(patientsRes.data.data);
          
          if (user?.role === 'admin') {
            const doctorsRes = await axios.get('/api/admin/doctors', config);
            setDoctors(doctorsRes.data.data);
          } else {
            setFormData(prev => ({...prev, doctorId: user?._id || ''}));
          }
        } catch (err) {
          console.error("Failed to load select data");
        }
      };
      
      fetchData();
      
      setFormData(prev => ({
        ...prev, 
        appointmentDate: new Date().toISOString().split('T')[0],
        doctorId: user?.role === 'doctor' ? user._id : ''
      }));
    }
  }, [isOpen, token, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if(!formData.patientId || !formData.doctorId) {
       setError("Please ensure both a Patient and a Doctor are selected.");
       setLoading(false);
       return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/appointments', formData, config);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "04:00 PM"];

  return (
    <ModalPortal>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Book New Appointment</h3>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <form id="appointmentForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label><Search size={14} style={{ display:'inline', marginRight: 4 }}/> Select Registered Patient</label>
                <select className="form-input" required value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                  <option value="" disabled>-- Choose a Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              {user?.role === 'admin' && (
                <div className="form-group">
                  <label>Assign Doctor</label>
                  <select className="form-input" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    <option value="" disabled>-- Select Doctor --</option>
                    {doctors.filter(d => d.isActive).map(d => (
                      <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization || 'General'})</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="profile-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date</label>
                  <input type="date" className="form-input" required value={formData.appointmentDate} onChange={e => setFormData({...formData, appointmentDate: e.target.value})} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Time Slot</label>
                  <select className="form-input" required value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})}>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit / Symptoms</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="e.g. Blurry vision, regular checkup..."
                ></textarea>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                 ℹ️ Saving this appointment will automatically trigger an email/SMS confirmation stub to the patient and alert the doctor's pipeline. Check backend terminal for logs!
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="appointmentForm" className="btn-primary small" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AppointmentModal;
