import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  User, Users, Activity, LogOut, Eye, Calendar,
  Package, FileText, ShoppingCart, BarChart, Settings, UserCog
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const isAdmin       = user?.role === 'admin';
  const isDoctor      = user?.role === 'doctor';
  const isReceptionist = user?.role === 'receptionist';
  const isAccountant  = user?.role === 'accountant';

  const link = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      {icon} {label}
    </NavLink>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ height: 'auto', padding: '1.5rem 1rem' }}>
        <div className="logo" style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', width: '100%' }}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ maxWidth: '90%', maxHeight: '120px', objectFit: 'contain', marginBottom: '0.25rem' }} />
          ) : (
            <Eye size={48} color="var(--primary-color)" style={{ marginBottom: '0.25rem' }} />
          )}
          <span>{settings.clinicName}</span>
        </div>
      </div>

      <nav className="sidebar-nav">

        {/* My Profile – all roles */}
        {link('/dashboard/profile', <User size={20} />, 'My Profile')}

        {/* ── Admin only ──────────────────────────── */}
        {isAdmin && (
          <>
            {link('/dashboard/staff',   <UserCog size={20} />,  'Staff Management')}
            {link('/dashboard/doctors', <Users size={20} />,    'Doctor Management')}
          </>
        )}

        {/* ── Patients: admin, doctor, receptionist ── */}
        {(isAdmin || isDoctor || isReceptionist) &&
          link('/dashboard/patients', <Activity size={20} />, 'Patient Management')}

        {/* ── Appointments: admin, doctor, receptionist ── */}
        {(isAdmin || isDoctor || isReceptionist) &&
          link('/dashboard/appointments', <Calendar size={20} />, 'Appointments')}

        {/* ── Reports: admin, doctor, accountant ── */}
        {(isAdmin || isDoctor || isAccountant) &&
          link('/dashboard/reports', <BarChart size={20} />, 'Reports & Analytics')}

        {/* ── Vendor Purchases: admin, accountant ── */}
        {(isAdmin || isAccountant) &&
          link('/dashboard/purchases', <ShoppingCart size={20} />, 'Vendor Purchase')}

        {/* ── Inventory: admin, accountant ── */}
        {(isAdmin || isAccountant) &&
          link('/dashboard/inventory', <Package size={20} />, 'Inventory Stock')}

        {/* ── Quick Billing: admin, receptionist, accountant ── */}
        {(isAdmin || isReceptionist || isAccountant) &&
          link('/dashboard/billing', <FileText size={20} />, 'Quick Billing')}

        {/* ── Settings: admin only ── */}
        {isAdmin &&
          link('/dashboard/settings', <Settings size={20} />, 'Settings')}

      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
        </div>
        <button className="btn-logout-sidebar" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
