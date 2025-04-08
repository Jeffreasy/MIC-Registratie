import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/themetoggle';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const Header: React.FC = () => {
  const { user, isSuperAdmin, role, userProfile } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold text-lg">MIC Registratie</Link>
          <nav className="hidden md:flex space-x-4">
            <Link to="/" className="hover:text-primary transition">Dashboard</Link>
            <Link to="/analytics" className="hover:text-primary transition">Analyses</Link>
            {isSuperAdmin() && (
              <Link to="/admin" className="hover:text-primary transition">Admin</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="text-sm hidden md:inline hover:text-primary transition">
            {user?.email} <span className="text-xs text-muted-foreground">({role || 'geen rol'})</span>
          </Link>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Uitloggen
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header; 