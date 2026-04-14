import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalPortal from './ModalPortal';

interface UserModalProps {
  user: any | null; 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRole?: 'doctor' | 'receptionist' | 'accountant';
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onSuccess, initialRole = 'doctor' }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole,
    specialization: '',
    qualifications: '',
    experienceYears: '',
    consultationFee: '',
    phoneNumber: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', 
        role: user.role || initialRole,
        specialization: user.specialization || '',
        qualifications: user.qualifications || '',
        experienceYears: user.experienceYears || '',
        consultationFee: user.consultationFee || '',
        phoneNumber: user.phoneNumber || '',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      setFormData({
        name: '', email: '', password: '', role: initialRole, specialization: '',
        qualifications: '', experienceYears: '', consultationFee: '', phoneNumber: '', isActive: true
      });
    }
  }, [user, isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = { ...formData };
      if (user && !payload.password) {
        delete payload.password; 
      }

      if (user) {
        await axios.put(`/api/admin/users/${user._id}`, payload, config);
      } else {
        await axios.post('/api/admin/users', payload, config); 
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ textTransform: 'capitalize' }}>{user ? `Edit ${formData.role}` : `Register New ${formData.role}`}</h3>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <form id="userForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Password {user && '(Leave blank to keep unchanged)'}</label>
                <input type="password" className="form-input" required={!user} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select 
                  className="form-input" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  disabled={!!user}
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>

              {formData.role === 'doctor' && (
                <div className="profile-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Specialization</label>
                    <input type="text" className="form-input" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Qualifications</label>
                    <input type="text" className="form-input" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Experience (Years)</label>
                    <input type="number" className="form-input" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Consultation Fee (Rs.)</label>
                    <input type="number" className="form-input" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" className="form-input" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>

              {user && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label htmlFor="isActive" style={{ marginBottom: 0 }}>Account Active (Allowed to log in?)</label>
                </div>
              )}
            </form>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="userForm" className="btn-primary small" disabled={loading}>
              {loading ? 'Saving...' : `Save ${formData.role}`}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default UserModal;
