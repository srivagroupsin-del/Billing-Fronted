import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BusinessSelection from './Pages/Auth/BusinessSelection';
import Layout from './Components/LayOut/Layout';
import CenterAlert from './Components/Notification/CenterAlert';
import ConfirmModal from './Components/Notification/ConfirmModal';
// import ProgressLayout from './Components/SetupSidebar/ProgressLayout';

// Pages
import LoginPage from './Pages/Auth/LoginPage';
import RegisterPage from './Pages/Auth/RegisterPage';
import Dashboard from './Pages/Dashboard/Dashboard';
import ProductEntry from './Pages/Product/Product_entry/Productentry';
import ProductStock from './Pages/Product/Product_stock/productstock';
import StockList from './Pages/Product/Product_stock/StockList';
import BillingPage from './Pages/Billing/Add_Billing/Billingpage/Billing';
import AddCC from './Pages/Billing/Add_CC/Add_CC/Add_cc';
import ProductSetup from './Pages/Product_setup/Productsetup';
import BusinessSetup from './Pages/Business_setup/Businesssetup';
import BusinessForm from './Pages/Business_create/Business_create';
import BusinessAdmin from './Pages/Management/BusinessAdmin/BusinessAdmin';
import CreateEmployee from './Pages/Management/Create_Employee/Create_Employee';
import ManageEmployee from './Pages/Management/Manage_Employee/Manage_Employee';
import Manage from './Pages/Management/Manage/Manage';
import ManageLogin from './Pages/Manage_Login/Manage_login';
import NewUserSetup from './Pages/Business_NewUser_setup/nu_setup';
import AddSupplier from './Pages/Product/Supplier_Add/AddSupplier';
import ProductList from './Pages/Product/Product_list/ProductList';
import ProductAdvancedSearch from './Pages/Product/Product_Advance_Search/ProductAdvancedSearch';
import OrderChecking from './Pages/OrderChecking/OrderChecking';
import BillHistory from './Pages/Billing/BillHistory/BillHistory';
import StorageManagement from './Pages/Product/StorageManagement/StorageManagement';
import NotificationsPage from './Pages/Notifications/NotificationsPage';


// Auth Guard
const AuthGuard = ({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Shortcut Listener Component
const ShortcutListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        console.log("⌨️ F1 pressed - Navigating to Billing...");
        navigate('/billing/create');
      } else if (e.key === 'F2') {
        e.preventDefault();
        console.log("⌨️ F2 pressed - Navigating to Product Entry...");
        navigate('/add-product');
      } else if (e.key === 'F3') {
        e.preventDefault();
        console.log("⌨️ F3 pressed - Navigating to Product List...");
        navigate('/products');
      } else if (e.key === 'F4') {
        e.preventDefault();
        console.log("⌨️ F4 pressed - Navigating to Stock Entry...");
        navigate('/stock-entry');
      } else if (e.key === 'F5') {
        e.preventDefault();
        console.log("⌨️ F5 pressed - Navigating to Stock List...");
        navigate('/stock-list');
      } else if (e.key === 'F6') {
        e.preventDefault();
        console.log("⌨️ F6 pressed - Navigating to Storage Selection...");
        navigate('/storage');
      } else if (e.key === 'F7') {
        e.preventDefault();
        console.log("⌨️ F7 pressed - Navigating to Invoices...");
        navigate('/invoice');
      }

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  return null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('auth_token') || !!localStorage.getItem('token')
  );

  const handleLogin = () => {
    localStorage.setItem('login_timestamp', Date.now().toString());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');  // Login token
    localStorage.removeItem('token');       // Business token
    localStorage.removeItem('user');
    localStorage.removeItem('business_id');
    localStorage.removeItem('login_timestamp');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const checkExpiry = () => {
      const loginTimestamp = localStorage.getItem('login_timestamp');
      const isAuthenticatedInStorage = !!localStorage.getItem('auth_token') || !!localStorage.getItem('token');

      if (isAuthenticatedInStorage) {
        if (!loginTimestamp) {
          // If logged in but no timestamp, set it now to start the 24hr clock
          localStorage.setItem('login_timestamp', Date.now().toString());
        } else {
          const now = Date.now();
          const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in ms

          if (now - parseInt(loginTimestamp) > expiryTime) {
            console.log("🕒 Session expired (24hrs limit). Logging out...");
            handleLogout();
          }
        }
      }
    };

    // Check immediately on mount
    checkExpiry();

    // Set an interval to check periodically (every 5 minutes)
    const interval = setInterval(checkExpiry, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ShortcutListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/business-select" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/business-select" replace /> : <RegisterPage />
        } />

        {/* Business Selection — auth required, but no Layout (full-page) */}
        <Route path="/business-select" element={
          <AuthGuard isAuthenticated={isAuthenticated}>
            <BusinessSelection />
          </AuthGuard>
        } />

        {/* Private Routes */}
        <Route path="/*" element={
          <AuthGuard isAuthenticated={isAuthenticated}>
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/analytics" replace />} />
                <Route path="/analytics" element={<Dashboard />} />

                {/* Inventory */}
                <Route path="/add-product" element={<ProductEntry />} />
                <Route path="/product/advanced-search" element={<ProductAdvancedSearch />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/product-stock" element={<ProductStock />} />
                <Route path="/stock-entry" element={<ProductStock />} />
                <Route path="/stock-list" element={<StockList />} />
                <Route path="/add-supplier" element={<AddSupplier />} />

                <Route path="/storage" element={<StorageManagement />} />

                {/* Billing */}
                <Route path="/billing/create" element={<BillingPage />} />
                <Route path="/billing/invoices" element={<BillHistory />} />
                <Route path="/invoice" element={<BillHistory />} />
                <Route path="/billing/add-cc" element={<AddCC />} />
                <Route path="/order-checking" element={<OrderChecking />} />

                {/* Management */}
                <Route path="/product-setup" element={<ProductSetup />} />
                <Route path="/business-setup" element={<BusinessSetup />} />
                <Route path="/business-admin" element={<BusinessAdmin />} />
                <Route path="/create-employee" element={<CreateEmployee />} />
                <Route path="/manage-employee" element={<ManageEmployee />} />
                <Route path="/manage" element={<Manage />} />
                <Route path="/business-create" element={<BusinessForm />} />
                <Route path="/manage-login" element={<ManageLogin />} />
                <Route path="/new-user-setup" element={<NewUserSetup />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/analytics" replace />} />
              </Routes>
            </Layout>
          </AuthGuard>
        } />
      </Routes>
      <CenterAlert />
      <ConfirmModal />
    </Router>
  );
}

export default App;
