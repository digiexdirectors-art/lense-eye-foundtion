import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalPortal from './ModalPortal';

interface PatientModalProps {
  patient: any | null; 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PatientModal: React.FC<PatientModalProps> = ({ patient, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        phone: patient.phone || '',
        address: patient.address || '',
        medicalHistory: patient.medicalHistory || ''
      });
    } else {
      setFormData({
        name: '', age: '', gender: 'Male', phone: '', address: '', medicalHistory: ''
      });
    }
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (patient) {
        await axios.put(`/api/patients/${patient._id}`, formData, config);
      } else {
        await axios.post('/api/patients', formData, config); 
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{patient ? 'Edit Patient Record' : 'Register New Patient'}</h3>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <form id="patientForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="profile-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Age</label>
                  <input type="number" className="form-input" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Gender</label>
                  <select className="form-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Home Address</label>
                <input type="text" className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Medical History / Conditions</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={formData.medicalHistory} 
                  onChange={e => setFormData({...formData, medicalHistory: e.target.value})} 
                  placeholder="e.g. Diabetes, Hypertension..."
                ></textarea>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="patientForm" className="btn-primary small" disabled={loading}>
              {loading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default PatientModal;
