import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Plus, Edit } from 'lucide-react';
import PatientModal from '../components/PatientModal';

const PatientsView = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const fetchPatients = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/patients', config);
      setPatients(data.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const handleEditClick = (patient: any) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchPatients(); 
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={28} color="var(--primary-color)" />
          Patient Registry
        </h2>
        <button className="btn-primary small" onClick={handleAddClick} style={{ width: 'auto' }}>
          <Plus size={18} /> Register Patient
        </button>
      </div>

      <div className="glass-card table-container" style={{ margin: 0 }}>
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading patients data...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age & Gender</th>
                <th>Phone Number</th>
                <th>Medical History</th>
                <th>Registered By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((pat) => (
                <tr key={pat._id}>
                  <td style={{ fontWeight: 500 }}>{pat.name}</td>
                  <td>{pat.age} yrs • {pat.gender}</td>
                  <td>{pat.phone}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pat.medicalHistory || '-'}
                  </td>
                  <td>
                    <span className="badge role-doctor" style={{ margin: 0, padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                      {pat.registeredBy?.name || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleEditClick(pat)}
                    >
                      <Edit size={14} style={{ display: 'inline', marginRight: '4px' }}/> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No patients registered yet. Click "Register Patient" to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patient={selectedPatient}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default PatientsView;
