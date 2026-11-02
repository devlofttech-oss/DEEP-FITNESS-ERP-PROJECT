import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
  const { currentUser, role, isImpersonating, isPlanBlocked } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // An expired or not-yet-started plan confines the gym to the subscription
  // pages rather than ending the session, so the admin can actually pay.
  if (isPlanBlocked && !isImpersonating && !location.pathname.startsWith('/subscription')) {
    return <Navigate to="/subscription" replace />;
  }

  // If visiting /super-admin, redirect directly to Deep Fitness dashboard
  if (location.pathname.startsWith('/super-admin')) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role) && role !== 'superadmin' && !isImpersonating) {
    return <Navigate to={role === 'staff' ? '/checkin' : '/'} replace />;
  }

  return children;
}
