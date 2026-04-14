import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import ProfileView from './pages/ProfileView';
import AdminDoctorsView from './components/AdminDoctorsView';
import AdminStaffView from './components/AdminStaffView';
import PatientsView from './pages/PatientsView'; 
import AppointmentsView from './pages/AppointmentsView';
import PrescriptionGenerator from './pages/PrescriptionGenerator';
import InventoryPage from './pages/InventoryPage';
import BillingPage from './pages/BillingPage';
import PurchasePage from './pages/PurchasePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="profile" element={<ProfileView />} />
            <Route path="doctors" element={<AdminDoctorsView />} />
            <Route path="staff" element={<AdminStaffView />} />
            <Route path="patients" element={<PatientsView />} />
            <Route path="appointments" element={<AppointmentsView />} />
            <Route path="prescription/:id" element={<PrescriptionGenerator />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="purchases" element={<PurchasePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="profile" replace />} />

          </Route>

          
          <Route path="/" element={<Navigate to="/dashboard/profile" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
