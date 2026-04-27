import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import AppointmentModal from '../components/AppointmentModal';

const AppointmentsView = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/appointments', config);
      setAppointments(data.data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body: any = { status: newStatus };
      await axios.put(`/api/appointments/${id}`, body, config);
      fetchAppointments();
    } catch (error) {
      console.error('Status update failed', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="badge" style={{ background: '#dcfce7', color: '#166534', margin: 0, padding: '0.2rem 0.5rem' }}><CheckCircle size={12} style={{ display:'inline', marginRight: 4 }}/> Completed</span>;
      case 'Cancelled': return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', margin: 0, padding: '0.2rem 0.5rem' }}><XCircle size={12} style={{ display:'inline', marginRight: 4 }}/> Cancelled</span>;
      default: return <span className="badge" style={{ background: '#e0f2fe', color: '#075985', margin: 0, padding: '0.2rem 0.5rem' }}><Clock size={12} style={{ display:'inline', marginRight: 4 }}/> Scheduled</span>;
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={28} color="var(--primary-color)" />
          Appointments Pipeline
        </h2>
        <button className="btn-primary small" onClick={() => setIsModalOpen(true)} style={{ width: 'auto' }}>
          <Plus size={18} /> Book Appointment
        </button>
      </div>

      <div className="glass-card table-container" style={{ margin: 0 }}>
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading schedule...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                {user?.role === 'admin' && <th>Doctor</th>}
                <th>Reason</th>
                <th>Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id}>
                  <td style={{ fontWeight: 600 }}>{new Date(appt.appointmentDate).toISOString().split('T')[0]} at {appt.timeSlot}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{appt.patient?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{appt.patient?.phone}</div>
                  </td>
                  {user?.role === 'admin' && <td>{appt.doctor?.name?.match(/^Dr\.?\s+/i) ? appt.doctor.name : `Dr. ${appt.doctor?.name}`}</td>}
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {appt.reason || '-'}
                  </td>
                   <td>{getStatusBadge(appt.status)}</td>
                   <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     {appt.status === 'Scheduled' && (
                       <select 
                         className="form-input" 
                         style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto', display: 'inline-block' }}
                         value="" 
                         onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                       >
                         <option value="" disabled>Update...</option>
                         <option value="Completed">Mark Completed</option>
                         <option value="Cancelled">Cancel Appt</option>
                       </select>
                     )}
                     
                     <button 
                       className="btn-secondary" 
                       style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                       onClick={() => {
                         navigate(`/dashboard/prescription/${appt._id}`);
                       }}
                     >
                       <FileText size={14} /> 
                       {appt.status === 'Completed' ? 'View/Print Rx' : 'Create Rx'}
                     </button>

                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No appointments scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchAppointments(); }}
      />
    </>
  );
};

export default AppointmentsView;
