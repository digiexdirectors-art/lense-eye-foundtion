import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Plus, Edit, Search } from 'lucide-react';
import PatientModal from '../components/PatientModal';

const PatientsView = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Search/Filter State
  const [searchTermName, setSearchTermName] = useState('');
  const [searchTermPhone, setSearchTermPhone] = useState('');
  const [searchTermMrd, setSearchTermMrd] = useState('');
  const [searchRegDate, setSearchRegDate] = useState('');

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

  // Filter Logic
  const filteredPatients = patients.filter((pat) => {
    const nameMatch = pat.name.toLowerCase().includes(searchTermName.toLowerCase());
    const phoneMatch = pat.phone.toLowerCase().includes(searchTermPhone.toLowerCase());
    const mrdMatch = (pat.mrdNumber || '').toLowerCase().includes(searchTermMrd.toLowerCase());
    
    let dateMatch = true;
    if (searchRegDate) {
      const regDate = pat.createdAt ? pat.createdAt.split('T')[0] : '';
      dateMatch = regDate === searchRegDate;
    }
    
    return nameMatch && phoneMatch && mrdMatch && dateMatch;
  });

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

      {/* Search & Filter Controls */}
      <div 
        className="glass-card" 
        style={{ 
          marginBottom: '1.5rem', 
          padding: '1.25rem',
          background: 'var(--card-bg)'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>Search by Name</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter name..." 
                className="form-input" 
                style={{ paddingLeft: '2.25rem' }}
                value={searchTermName} 
                onChange={(e) => setSearchTermName(e.target.value)} 
              />
              <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>Search by Phone</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter mobile number..." 
                className="form-input" 
                style={{ paddingLeft: '2.25rem' }}
                value={searchTermPhone} 
                onChange={(e) => setSearchTermPhone(e.target.value)} 
              />
              <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>Search by MRD No.</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter MRD number..." 
                className="form-input" 
                style={{ paddingLeft: '2.25rem' }}
                value={searchTermMrd} 
                onChange={(e) => setSearchTermMrd(e.target.value)} 
              />
              <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>Search by Reg. Date</label>
              {(searchTermName || searchTermPhone || searchTermMrd || searchRegDate) && (
                <button 
                  onClick={() => {
                    setSearchTermName('');
                    setSearchTermPhone('');
                    setSearchTermMrd('');
                    setSearchRegDate('');
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ef4444', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            <input 
              type="date" 
              className="form-input" 
              value={searchRegDate} 
              onChange={(e) => setSearchRegDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="glass-card table-container" style={{ margin: 0 }}>
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading patients data...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>MRD No.</th>
                <th>Patient Name</th>
                <th>Age & Gender</th>
                <th>Phone Number</th>
                <th>Reg. Date</th>
                <th>Purpose</th>
                <th>Medical History</th>
                <th>Refd. By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((pat) => (
                <tr key={pat._id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{pat.mrdNumber || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{pat.name}</td>
                  <td>{pat.age} yrs • {pat.gender}</td>
                  <td>{pat.phone}</td>
                  <td>{pat.createdAt ? new Date(pat.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                  <td>{pat.purpose || '-'}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pat.medicalHistory || '-'}
                  </td>
                  <td>
                    <span className="badge role-doctor" style={{ margin: 0, padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#64748b' }}>
                      {pat.refdBy || pat.regdBy || '-'}
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
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    {patients.length === 0 
                      ? 'No patients registered yet. Click "Register Patient" to begin.'
                      : 'No patients match your search criteria.'}
                  </td>
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
