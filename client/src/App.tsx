import { useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/Homepage';
import LoginPage from './pages/Loginpage';
import RegisterPage from './pages/Registerpage';
import ForgotPasswordPage from './pages/Forgotpasswordpage';
import AnalyticsPage from './pages/Analyticspage';
import AdminPage from './pages/Adminpage';
import ProfilePage from './pages/Profilepage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import './App.css';

const App = () => {
  const { 
    setUser, 
    isAuthenticated, 
    setIsAuthenticated, 
    isLoading, 
    setIsLoading,
    loadUserProfile 
  } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Controleer of gebruiker is ingelogd
      const { data: { session } } = await supabase.auth.getSession();
      const initialUser = session?.user || null;
      
      setUser(initialUser);
      setIsAuthenticated(!!initialUser);
      
      // Haal profiel op met rol informatie als er een gebruiker is
      if (initialUser) {
        await loadUserProfile();
      }
      
      setIsLoading(false);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const currentUser = session?.user || null;
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
          
          if (currentUser) {
            await loadUserProfile();
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();
  }, [setUser, setIsAuthenticated, setIsLoading, loadUserProfile]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Laden...</div>;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {isAuthenticated && <Header />}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPasswordPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="super_admin">
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
