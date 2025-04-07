import React from 'react';
import useLogin from './hooks/useLogin';
import LoginForm from './components/LoginForm';
import LoadingState from './components/LoadingState';

const LoginPage: React.FC = () => {
  const {
    username,
    setUsername,
    password, 
    setPassword,
    loading,
    error,
    isLoading,
    handleLogin
  } = useLogin();

  // Toon loader wanneer authStore nog aan het laden is
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <LoginForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          handleLogin={handleLogin}
        />
      </div>
    </div>
  );
};

export default LoginPage; 