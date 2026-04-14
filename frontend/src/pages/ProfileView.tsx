import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Phone, Shield, Stethoscope, Clock, CreditCard, Edit2, Save, X } from 'lucide-react';
import ClinicAnalytics from '../components/ClinicAnalytics';

const ProfileView = () => {
  const { user, token, login } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);

  if (!user) return null;

  const handleEditToggle = () => {
    if (!isEditingProfile) {
      setProfileForm({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        specialization: user.specialization || '',
        qualifications: user.qualifications || '',
        experienceYears: user.experienceYears || '',
        consultationFee: user.consultationFee || ''
      });
    }
    setIsEditingProfile(!isEditingProfile);
  };

  const handleProfileSave = async () => {
    setSaveLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.put('/api/users/profile', profileForm, config);
      login(data.data, token as string);
      setIsEditingProfile(false);
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      {/* Analytics Banner */}
      <ClinicAnalytics />

      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>My Profile Workspace</h2>
        <button className="btn-secondary" onClick={handleEditToggle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isEditingProfile ? <><X size={18}/> Cancel</> : <><Edit2 size={18}/> Edit Profile</>}
        </button>
      </div>

      <div className="glass-card profile-card" style={{ background: 'white' }}>
        {!isEditingProfile ? (
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label"><UserIcon className="icon" /> Full Name</span>
              <span className="profile-value">{user.name}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label"><Shield className="icon" /> System Role</span>
              <span className="profile-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
            </div>
            {user.phoneNumber && (
              <div className="profile-item">
                <span className="profile-label"><Phone className="icon" /> Phone Number</span>
                <span className="profile-value">{user.phoneNumber}</span>
              </div>
            )}
            {user.role === 'doctor' && (
              <>
                {user.specialization && (
                  <div className="profile-item">
                    <span className="profile-label"><Stethoscope className="icon" /> Specialization</span>
                    <span className="profile-value">{user.specialization}</span>
                  </div>
                )}
                {user.qualifications && (
                  <div className="profile-item">
                    <span className="profile-label">Qualifications</span>
                    <span className="profile-value">{user.qualifications}</span>
                  </div>
                )}
                {(user.experienceYears !== undefined && user.experienceYears > 0) && (
                  <div className="profile-item">
                    <span className="profile-label"><Clock className="icon" /> Experience</span>
                    <span className="profile-value">{user.experienceYears} Years</span>
                  </div>
                )}
                {(user.consultationFee !== undefined && user.consultationFee > 0) && (
                  <div className="profile-item">
                    <span className="profile-label"><CreditCard className="icon" /> Consultation Fee</span>
                    <span className="profile-value">Rs. {user.consultationFee}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="profile-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" className="form-input" value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} />
            </div>
            
            {user.role === 'doctor' && (
              <>
                <div className="form-group">
                  <label>Specialization</label>
                  <input type="text" className="form-input" value={profileForm.specialization} onChange={e => setProfileForm({...profileForm, specialization: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Qualifications</label>
                  <input type="text" className="form-input" value={profileForm.qualifications} onChange={e => setProfileForm({...profileForm, qualifications: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Experience Years</label>
                  <input type="number" className="form-input" value={profileForm.experienceYears} onChange={e => setProfileForm({...profileForm, experienceYears: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (Rs.)</label>
                  <input type="number" className="form-input" value={profileForm.consultationFee} onChange={e => setProfileForm({...profileForm, consultationFee: e.target.value})} />
                </div>
              </>
            )}

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <button className="btn-primary" onClick={handleProfileSave} disabled={saveLoading} style={{ marginTop: 'auto' }}>
                <Save size={18} /> {saveLoading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileView;
