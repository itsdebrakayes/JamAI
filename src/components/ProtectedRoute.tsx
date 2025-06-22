
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600 rounded-2xl mb-4 animate-pulse">
            <span className="text-2xl">🇯🇲</span>
          </div>
          <p className="text-lg font-medium text-green-800">Loading JamAI...</p>
        </div>
      </div>
    );
  }

  // Allow access if user is authenticated OR in guest mode
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
