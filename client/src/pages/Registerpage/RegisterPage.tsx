import React from 'react';
import useRegister from './hooks/useRegister';
import RegisterForm from './components/RegisterForm';
import LoadingState from './components/LoadingState';

const RegisterPage: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    message,
    isAuthenticated,
    isLoading,
    handleRegister
  } = useRegister();

  // Toon laadindicator tijdens initiële sessie check
  if (isLoading) {
    return <LoadingState />;
  }

  // Render niets als al ingelogd (redirect gebeurt in useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-0 py-6 sm:py-0">
      <RegisterForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        message={message}
        handleRegister={handleRegister}
      />
    </div>
  );
};

export default RegisterPage; 