import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getTenantCollection } from './firebase/tenantDb';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/auth/RoleRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemberList from './pages/members/MemberList';
import AddMember from './pages/members/AddMember';
import MemberProfile from './pages/members/MemberProfile';
import BulkImportMembers from './pages/members/BulkImportMembers';
import PaymentsList from './pages/payments/PaymentsList';
import PaymentPage from './pages/payments/PaymentPage';
import CheckinScreen from './pages/attendance/CheckinScreen';
import AllCheckins from './pages/attendance/AllCheckins';
import ScannerKiosk from './pages/attendance/ScannerKiosk';
import Settings from './pages/settings/Settings';
import StaffList from './pages/staff/StaffList';
import StaffProfile from './pages/staff/StaffProfile';
import EquipmentList from './pages/equipment/EquipmentList';
import SupplementList from './pages/supplements/SupplementList';
import ClassList from './pages/classes/ClassList';
import ClassDetail from './pages/classes/ClassDetail';
import AddClass from './pages/classes/AddClass';
import ExpenseList from './pages/expenses/ExpenseList';
import MonthlyReport from './pages/reports/MonthlyReport';
import PlanList from './pages/plans/PlanList';
import LeadList from './pages/leads/LeadList';
import MeasurementList from './pages/measurements/MeasurementList';
import WorkoutList from './pages/workouts/WorkoutList';
import PTList from './pages/pt/PTList';
import RenewalsList from './pages/renewals/RenewalsList';
import WACreditsPage from './pages/communication/WACreditsPage';
import WACreditsReturn from './pages/communication/WACreditsReturn';
import MemberQRPage from './pages/public/MemberQRPage';
import ReceiptPage from './pages/public/ReceiptPage';
import RegisterPage from './pages/RegisterPage';
import Onboarding from './pages/Onboarding';
import SubscriptionEnded from './pages/SubscriptionEnded';
import SubscribePage from './pages/subscription/SubscribePage';
import PaymentReturn from './pages/subscription/PaymentReturn';

function RoleRedirect() {
  const { role, gymId } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasPlans, setHasPlans] = useState(true);

  useEffect(() => {
    if (role !== 'admin' || !gymId) { setChecking(false); return; }
    getTenantCollection(gymId, 'plans')
      .then(plans => setHasPlans(plans.length > 0))
      .catch(() => setHasPlans(true))
      .finally(() => setChecking(false));
  }, [gymId, role]);

  if (role === 'staff') return <Navigate to="/checkin" replace />;
  if (checking) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!hasPlans) return <Navigate to="/onboarding" replace />;
  return <Dashboard />;
}

const ADMIN = ['admin', 'superadmin'];
const ALL   = ['admin', 'staff', 'superadmin'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/subscription-ended" element={<SubscriptionEnded />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/qr/:memberId" element={<MemberQRPage />} />
      <Route path="/receipt/:receiptId" element={<ReceiptPage />} />

      {/* Redirect /super-admin directly to Deep Fitness dashboard */}
      <Route path="/super-admin/*" element={<Navigate to="/" replace />} />
      <Route path="/super-admin" element={<Navigate to="/" replace />} />

      {/* First-login onboarding */}
      <Route path="/onboarding" element={
        <RoleRoute allowedRoles={ADMIN}>
          <Onboarding />
        </RoleRoute>
      } />

      {/* Standalone scanner kiosk */}
      <Route path="/scanner" element={
        <RoleRoute allowedRoles={ALL}>
          <ScannerKiosk />
        </RoleRoute>
      } />

      {/* Deep Fitness Gym ERP (admin + staff) */}
      <Route path="/*" element={
        <RoleRoute allowedRoles={ALL}>
          <DashboardLayout />
        </RoleRoute>
      } />
      <Route path="/" element={
        <RoleRoute allowedRoles={ALL}>
          <DashboardLayout />
        </RoleRoute>
      }>
        <Route index element={<RoleRedirect />} />

        {/* Admin-only */}
        <Route path="subscription"               element={<RoleRoute allowedRoles={ADMIN}><SubscribePage /></RoleRoute>} />
        <Route path="subscription/return"        element={<RoleRoute allowedRoles={ADMIN}><PaymentReturn /></RoleRoute>} />
        <Route path="members"            element={<RoleRoute allowedRoles={ADMIN}><MemberList /></RoleRoute>} />
        <Route path="members/import"     element={<RoleRoute allowedRoles={ADMIN}><BulkImportMembers /></RoleRoute>} />
        <Route path="members/add"        element={<RoleRoute allowedRoles={ADMIN}><AddMember /></RoleRoute>} />
        <Route path="members/:id"        element={<RoleRoute allowedRoles={ADMIN}><MemberProfile /></RoleRoute>} />
        <Route path="payments"           element={<RoleRoute allowedRoles={ADMIN}><PaymentsList /></RoleRoute>} />
        <Route path="payments/new"       element={<RoleRoute allowedRoles={ADMIN}><PaymentPage /></RoleRoute>} />
        <Route path="plans"              element={<RoleRoute allowedRoles={ADMIN}><PlanList /></RoleRoute>} />
        <Route path="classes"            element={<RoleRoute allowedRoles={ADMIN}><ClassList /></RoleRoute>} />
        <Route path="classes/new"        element={<RoleRoute allowedRoles={ADMIN}><AddClass /></RoleRoute>} />
        <Route path="classes/:id"        element={<RoleRoute allowedRoles={ADMIN}><ClassDetail /></RoleRoute>} />
        <Route path="staff"              element={<RoleRoute allowedRoles={ADMIN}><StaffList /></RoleRoute>} />
        <Route path="staff/:id"          element={<RoleRoute allowedRoles={ADMIN}><StaffProfile /></RoleRoute>} />
        <Route path="equipment"          element={<RoleRoute allowedRoles={ADMIN}><EquipmentList /></RoleRoute>} />
        <Route path="supplements"        element={<RoleRoute allowedRoles={ADMIN}><SupplementList /></RoleRoute>} />
        <Route path="expenses"           element={<RoleRoute allowedRoles={ADMIN}><ExpenseList /></RoleRoute>} />
        <Route path="reports/monthly"    element={<RoleRoute allowedRoles={ADMIN}><MonthlyReport /></RoleRoute>} />
        <Route path="leads"              element={<RoleRoute allowedRoles={ADMIN}><LeadList /></RoleRoute>} />
        <Route path="workouts"           element={<RoleRoute allowedRoles={ADMIN}><WorkoutList /></RoleRoute>} />
        <Route path="pt"                 element={<RoleRoute allowedRoles={ADMIN}><PTList /></RoleRoute>} />
        <Route path="renewals"           element={<RoleRoute allowedRoles={ADMIN}><RenewalsList /></RoleRoute>} />
        <Route path="wa-credits"         element={<RoleRoute allowedRoles={ADMIN}><WACreditsPage /></RoleRoute>} />
        <Route path="wa-credits/return"  element={<RoleRoute allowedRoles={ADMIN}><WACreditsReturn /></RoleRoute>} />
        <Route path="settings"           element={<RoleRoute allowedRoles={ADMIN}><Settings /></RoleRoute>} />

        {/* Staff + Admin */}
        <Route path="checkin"            element={<RoleRoute allowedRoles={ALL}><CheckinScreen /></RoleRoute>} />
        <Route path="attendance"         element={<RoleRoute allowedRoles={ALL}><AllCheckins /></RoleRoute>} />
        <Route path="measurements"       element={<RoleRoute allowedRoles={ALL}><MeasurementList /></RoleRoute>} />
      </Route>
    </Routes>
  );
}
