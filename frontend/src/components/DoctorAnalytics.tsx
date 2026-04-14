import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, IndianRupee, Loader } from 'lucide-react';

const DoctorAnalytics = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/reports/doctor-stats', config);
                setStats(data.data);
            } catch (error) {
                console.error("Failed to fetch doctor stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchStats();
    }, [token]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader className="animate-spin" /></div>;
    if (!stats) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                <TrendingUp size={20} className="text-primary" /> 
                Professional performance Analytics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                
                {/* Consultations Card */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Consultations</p>
                            <h4 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalConsultations}</h4>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '0.75rem', color: '#3b82f6' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>Overall completed sessions</p>
                </div>

                {/* Revenue Card */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Monthly Revenue</p>
                            <h4 style={{ fontSize: '1.8rem', fontWeight: 700 }}>₹{stats.monthlyRevenue.toLocaleString()}</h4>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.75rem', color: '#10b981' }}>
                            <IndianRupee size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>Revenue from current month</p>
                </div>
            </div>
        </div>
    );
};

export default DoctorAnalytics;
