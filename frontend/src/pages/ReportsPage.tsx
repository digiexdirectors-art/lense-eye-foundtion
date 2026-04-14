import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BarChart, Users, Calendar, Download, TrendingUp, UserCheck, Loader } from 'lucide-react';


const ReportsPage = () => {
    const { token, user } = useAuth();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const fetchGlobalStats = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/reports/global-stats', config);
            setStats(data.data);
        } catch (error) {
            console.error("Failed to fetch global stats", error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalStats();
    }, [token]);

    const openReport = (type: string) => {
        let url = `/api/reports/${type}`;
        if (dateRange.start && dateRange.end) {
            url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        }
        // Append token for authorization in new tab
        const fullUrl = `${axios.defaults.baseURL || ''}${url}${url.includes('?') ? '&' : '?'}token=${token}`;
        window.open(fullUrl, '_blank');
    };

    return (
        <div className="reports-container">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BarChart size={28} color="var(--primary-color)" />
                    Reports & Analytics
                </h2>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Generate and download comprehensive clinic performance reports.</p>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>Global Filters</h3>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Start Date</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={dateRange.start} 
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} 
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>End Date</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={dateRange.end} 
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} 
                        />
                    </div>
                    <button className="btn-secondary" onClick={() => setDateRange({ start: '', end: '' })}>Clear</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Financial Summary - Admin & Accountant */}
                {(user?.role === 'admin' || user?.role === 'accountant') && (
                    <div className="report-card glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: '#fefce8', padding: '0.75rem', borderRadius: '12px' }}>
                                <TrendingUp size={24} color="#eab308" />
                            </div>
                            <button className="btn-primary small" onClick={() => openReport('sales')}>
                                <Download size={16} /> PDF
                            </button>
                        </div>
                        <h4 style={{ marginTop: '1.25rem', fontSize: '1.2rem' }}>Financial Summary</h4>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Daybook style report of all sales bills and revenue tracking.
                        </p>
                    </div>
                )}

                {/* Patient Registry - Admin Only */}
                {user?.role === 'admin' && (
                    <div className="report-card glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px' }}>
                                <Users size={24} color="#22c55e" />
                            </div>
                            <button className="btn-primary small" onClick={() => openReport('patients')}>
                                <Download size={16} /> PDF
                            </button>
                        </div>
                        <h4 style={{ marginTop: '1.25rem', fontSize: '1.2rem' }}>Patient Registry</h4>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Complete list of registered patients with demographics.
                        </p>
                    </div>
                )}

                {/* Doctor Performance - Admin Only */}
                {user?.role === 'admin' && (
                    <div className="report-card glass-card" style={{ padding: '1.5rem', transition: 'transform 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '12px' }}>
                                <UserCheck size={24} color="#3b82f6" />
                            </div>
                            <button className="btn-primary small" onClick={() => openReport('doctors')}>
                                <Download size={16} /> PDF
                            </button>
                        </div>
                        <h4 style={{ marginTop: '1.25rem', fontSize: '1.2rem' }}>Doctor Performance</h4>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Aggregate stats on patient volume and fees collected per doctor.
                        </p>
                    </div>
                )}

                {/* Common Reports */}
                <div className="report-card glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ background: '#f5f3ff', padding: '0.75rem', borderRadius: '12px' }}>
                            <Calendar size={24} color="#8b5cf6" />
                        </div>
                        <button className="btn-primary small" onClick={() => openReport('appointments')}>
                            <Download size={16} /> PDF
                        </button>
                    </div>
                    <h4 style={{ marginTop: '1.25rem', fontSize: '1.2rem' }}>Appointment Logs</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                        History of all scheduled, completed, and cancelled visits.
                    </p>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="glass-card" style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e1b4b 100%)', color: 'white', padding: '2rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                {statsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader className="animate-spin" size={20} /> Calculating Live Stats...</div>
                ) : (
                    <>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.satisfactionRate || 99}%</div>
                            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Patient Satisfaction</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.totalConsultations || 0}</div>
                            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Total Consultations</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹{stats ? (stats.monthlyRevenue / 1000).toLocaleString() : 0}k</div>
                            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Monthly Revenue</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
