import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isTeam, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    // Only do role-based routing once role is loaded
    if (!loading && user && userRole !== null) {
      // If admin is required but user is not admin, redirect based on role
      if (requireAdmin && !isAdmin) {
        if (isTeam) {
          navigate('/team-dashboard');
        } else {
          navigate('/client-portal');
        }
        return;
      }

      // Redirect users to their appropriate dashboard from root
      if (location.pathname === '/') {
        if (!isAdmin && !isTeam) {
          navigate('/client-portal');
          return;
        }
        if (isTeam) {
          navigate('/team-dashboard');
          return;
        }
      }

      // Prevent non-team users from accessing team dashboard
      if (location.pathname === '/team-dashboard' && !isTeam && !isAdmin) {
        navigate('/client-portal');
        return;
      }

      // Prevent non-clients from accessing client portal (except admin can access all)
      if (location.pathname === '/client-portal' && (isTeam || isAdmin)) {
        if (isAdmin) {
          navigate('/');
        } else {
          navigate('/team-dashboard');
        }
        return;
      }
    }
  }, [user, loading, navigate, isAdmin, isTeam, userRole, location.pathname, requireAdmin]);

  // Show loading only while checking session, not while fetching role
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

  // Show content immediately, role-based redirects happen when role loads
  return <>{children}</>;
};

export default ProtectedRoute;
