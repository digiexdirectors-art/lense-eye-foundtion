import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit } from 'lucide-react';
import UserModal from './UserModal';

const AdminStaffView = () => {
  const { token } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

  const fetchStaff = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/admin/staff', config);
      setStaff(data.data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleEditClick = (member: any) => {
    setSelectedStaff(member);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchStaff(); // Refresh the table
  };

  const toggleStatus = async (userToToggle: any) => {
    if (!window.confirm(`Are you sure you want to ${userToToggle.isActive ? 'deactivate' : 'activate'} ${userToToggle.name}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/admin/users/${userToToggle._id}`, { isActive: !userToToggle.isActive }, config);
      fetchStaff();
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem', background: 'white' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
          <Users size={24} color="var(--primary-color)" />
          Staff Management (Receptionists & Accountants)
        </h2>
        <button className="btn-primary small" onClick={handleAddClick} style={{ width: 'auto' }}>
          <Plus size={18} /> Add New Staff
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading staff...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member._id}>
                  <td style={{ fontWeight: 500 }}>{member.name}</td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`badge ${member.role === 'accountant' ? 'role-doctor' : 'badge-general'}`} style={{ margin: 0, padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}>
                      {member.role}
                    </span>
                  </td>
                  <td>{member.phoneNumber || '-'}</td>
                  <td>
                    <span className={`badge ${member.isActive ? 'role-doctor' : 'error-message'}`} style={{ margin: 0, padding: '0.2rem 0.5rem' }}>
                      {member.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleEditClick(member)}
                    >
                      <Edit size={14} style={{ display: 'inline', marginRight: '4px' }}/> Edit
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: member.isActive ? '#fee2e2' : '#dcfce7', color: member.isActive ? '#991b1b' : '#166534', borderColor: 'transparent' }}
                      onClick={() => toggleStatus(member)}
                    >
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No staff registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedStaff}
        onSuccess={handleModalSuccess}
        initialRole="receptionist"
      />
    </div>
  );
};

export default AdminStaffView;
