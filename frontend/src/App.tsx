import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

// Management Pages
import UserManagement from './pages/users/UserManagement';
import CustomerManagement from './pages/customers/CustomerManagement';
import ProductManagement from './pages/products/ProductManagement';
import PlanManagement from './pages/plans/PlanManagement';
import QuotationManagement from './pages/quotations/QuotationManagement';
import SubscriptionManagement from './pages/subscriptions/SubscriptionManagement';
import InvoiceManagement from './pages/invoices/InvoiceManagement';
import TaxManagement from './pages/taxes/TaxManagement';
import DiscountManagement from './pages/discounts/DiscountManagement';
import PaymentManagement from './pages/payments/PaymentManagement';
import AnalyticsReports from './pages/analytics/AnalyticsReports';
import ProfileSettings from './pages/settings/ProfileSettings';
import SystemSettings from './pages/settings/SystemSettings';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default home
    if (user.role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'STAFF') return <Navigate to="/dashboard/staff" replace />;
    return <Navigate to="/dashboard/customer" replace />;
  }

  return children;
};

const DefaultRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
  if (user.role === 'STAFF') return <Navigate to="/dashboard/staff" replace />;
  return <Navigate to="/dashboard/customer" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Default redirect based on auth */}
            <Route path="/" element={<DefaultRedirect />} />

            {/* Protected App Layout Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboards - support both /dashboard/* and top-level paths */}
              <Route
                path="/admin"
                element={<Navigate to="/dashboard/admin" replace />}
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff"
                element={<Navigate to="/dashboard/staff" replace />}
              />
              <Route
                path="/dashboard/staff"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/portal"
                element={<Navigate to="/dashboard/customer" replace />}
              />
              <Route
                path="/dashboard/customer"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Users & Customers */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <CustomerManagement />
                  </ProtectedRoute>
                }
              />

              {/* Products, Plans, Taxes, Discounts */}
              <Route
                path="/products"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <ProductManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <PlanManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/taxes"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <TaxManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discounts"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <DiscountManagement />
                  </ProtectedRoute>
                }
              />

              {/* Sales & Billing Modules */}
              <Route
                path="/quotations"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <QuotationManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <SubscriptionManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <InvoiceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
                    <PaymentManagement />
                  </ProtectedRoute>
                }
              />

              {/* Reporting & Settings */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <AnalyticsReports />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route
                path="/settings"
                element={<Navigate to="/settings/system" replace />}
              />
              <Route
                path="/settings/system"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SystemSettings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
