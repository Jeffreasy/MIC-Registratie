import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const isSuperAdmin = role === 'super_admin';
    
    if (role !== requiredRole && !isSuperAdmin) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold mb-4">Toegang geweigerd</h1>
          <p className="text-lg mb-6">Je hebt niet de juiste rechten voor deze pagina.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Terug
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 