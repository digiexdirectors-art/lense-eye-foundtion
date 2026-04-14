import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area">
        {/* Child routes dynamically render here! */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
