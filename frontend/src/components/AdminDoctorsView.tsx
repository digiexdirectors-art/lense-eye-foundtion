import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit } from 'lucide-react';
import UserModal from './UserModal';

const AdminDoctorsView = () => {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  const fetchDoctors = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/admin/doctors', config);
      setDoctors(data.data);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const handleEditClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedDoctor(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchDoctors(); // Refresh the table
  };

  const toggleStatus = async (userToToggle: any) => {
    if (!window.confirm(`Are you sure you want to ${userToToggle.isActive ? 'deactivate' : 'activate'} ${userToToggle.name}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/admin/users/${userToToggle._id}`, { isActive: !userToToggle.isActive }, config);
      fetchDoctors();
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem', background: 'white' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
          <Users size={24} color="var(--primary-color)" />
          Doctor Management
        </h2>
        <button className="btn-primary small" onClick={handleAddClick} style={{ width: 'auto' }}>
          <Plus size={18} /> Add New Doctor
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading doctors...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id}>
                  <td style={{ fontWeight: 500 }}>{doc.name.replace(/^(Dr\.\s*)+/i, 'Dr. ')}</td>
                  <td>{doc.email}</td>
                  <td>{doc.specialization || '-'}</td>
                  <td>{doc.phoneNumber || '-'}</td>
                  <td>
                    <span className={`badge ${doc.isActive ? 'role-doctor' : 'error-message'}`} style={{ margin: 0, padding: '0.2rem 0.5rem' }}>
                      {doc.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleEditClick(doc)}
                    >
                      <Edit size={14} style={{ display: 'inline', marginRight: '4px' }}/> Edit
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: doc.isActive ? '#fee2e2' : '#dcfce7', color: doc.isActive ? '#991b1b' : '#166534', borderColor: 'transparent' }}
                      onClick={() => toggleStatus(doc)}
                    >
                      {doc.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No doctors registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedDoctor}
        onSuccess={handleModalSuccess}
        initialRole="doctor"
      />
    </div>
  );
};

export default AdminDoctorsView;
