import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, IndianRupee, Loader, Heart } from 'lucide-react';

const ClinicAnalytics = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isGlobalView = user?.role === 'admin' || user?.role === 'accountant';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // Fetch Global stats for Admin/Accountant, Personal stats for Doctors
                const endpoint = isGlobalView ? '/api/reports/global-stats' : '/api/reports/doctor-stats';
                const { data } = await axios.get(endpoint, config);
                setStats(data.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchStats();
    }, [token, isGlobalView]);

    if (loading) return (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Loader className="animate-spin text-primary" />
            <span style={{ color: '#64748b', fontWeight: 500 }}>Gathering {isGlobalView ? 'Clinic' : 'Performance'} Insights...</span>
        </div>
    );
    
    if (!stats) return null;

    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '1.2rem' }}>
                    <TrendingUp size={22} color="var(--primary-color)" /> 
                    {isGlobalView ? 'Clinic Performance Overview' : 'My Professional Analytics'}
                </h3>
                <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px', color: '#64748b', fontWeight: 600 }}>
                    {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* 1. Consultations Card */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid #3b82f6', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 500 }}>
                                {isGlobalView ? 'Total Patients Treated' : 'Consultations Completed'}
                            </p>
                            <h4 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {stats.totalConsultations?.toLocaleString() || 0}
                            </h4>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '0.8rem', borderRadius: '12px', color: '#3b82f6' }}>
                            <Users size={26} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time treatment volume</span>
                    </div>
                </div>

                {/* 2. Revenue Card */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid #10b981', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 500 }}>
                                {isGlobalView ? 'Gross Monthly Revenue' : 'My Monthly Earnings'}
                            </p>
                            <h4 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                ₹{stats.monthlyRevenue?.toLocaleString() || 0}
                            </h4>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: '0.8rem', borderRadius: '12px', color: '#10b981' }}>
                            <IndianRupee size={26} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>THIS MONTH</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total billable amount collected</span>
                    </div>
                </div>

                {/* 3. Satisfaction/Efficiency Card */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid #8b5cf6', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 500 }}>
                                {isGlobalView ? 'Clinic Satisfaction' : 'Patient Experience Rate'}
                            </p>
                            <h4 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {stats.satisfactionRate || 98}%
                            </h4>
                        </div>
                        <div style={{ background: '#f5f3ff', padding: '0.8rem', borderRadius: '12px', color: '#8b5cf6' }}>
                            <Heart size={26} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
                            <div style={{ width: `${stats.satisfactionRate || 98}%`, height: '100%', background: '#8b5cf6', borderRadius: '2px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Target: 95%+</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicAnalytics;
