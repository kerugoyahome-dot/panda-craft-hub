import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    // Role-based routing after authentication is loaded
    if (!loading && user && userRole !== null) {
      // If admin is required but user is not admin, redirect to client portal
      if (requireAdmin && !isAdmin) {
        navigate('/client-portal');
        return;
      }

      // If user is on root and is a client (not admin), redirect to client portal
      if (location.pathname === '/' && !isAdmin) {
        navigate('/client-portal');
        return;
      }

      // If user is admin trying to access client portal, redirect to admin dashboard
      if (location.pathname === '/client-portal' && isAdmin) {
        navigate('/');
        return;
      }
    }
  }, [user, loading, navigate, isAdmin, userRole, location.pathname, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-cyber-gray/10 to-background">
        <div className="text-cyber-blue font-share-tech text-xl animate-pulse">AUTHENTICATING...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
