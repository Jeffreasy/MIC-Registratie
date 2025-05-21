import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/themetoggle';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isSuperAdmin, role } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>MIC Registratie</Link>
          <nav className="hidden md:flex space-x-4">
            <Link to="/" className="hover:text-primary transition">Dashboard</Link>
            <Link to="/analytics" className="hover:text-primary transition">Analyses</Link>
            {isSuperAdmin() && (
              <Link to="/admin" className="hover:text-primary transition">Admin</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            to="/profile" 
            className="text-sm hidden md:inline hover:text-primary transition"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {user?.email} <span className="text-xs text-muted-foreground">({role || 'geen rol'})</span>
          </Link>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
            Uitloggen
          </Button>
          <div className="md:hidden">
            <Button variant="outline" size="icon" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto py-3 flex flex-col space-y-2">
            <Link to="/" className="hover:text-primary transition py-2" onClick={toggleMobileMenu}>Dashboard</Link>
            <Link to="/analytics" className="hover:text-primary transition py-2" onClick={toggleMobileMenu}>Analyses</Link>
            {isSuperAdmin() && (
              <Link to="/admin" className="hover:text-primary transition py-2" onClick={toggleMobileMenu}>Admin</Link>
            )}
            <Link to="/profile" className="hover:text-primary transition py-2 border-t border-border pt-3 mt-2" onClick={toggleMobileMenu}>
              Profiel: {user?.email}
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start py-2">
              Uitloggen
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header; 