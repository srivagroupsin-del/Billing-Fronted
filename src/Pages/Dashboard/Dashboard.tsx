import { Plus } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Billing Dashboard</h1>
          <p>Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn">
            <Plus size={18} /> Create New Bill
          </button>
        </div>
      </header>

      {/* Top Section with Active Selection removed */}

      {/* Sections removed as requested */}

    </div>
  );
};

export default Dashboard;
