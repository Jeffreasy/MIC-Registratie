import React from 'react';
import useForgotPassword from './hooks/useForgotPassword';
import ResetPasswordForm from './components/ResetPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  const {
    username,
    setUsername,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    message,
    error,
    handleSubmit
  } = useForgotPassword();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-0">
      <ResetPasswordForm
        username={username}
        setUsername={setUsername}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        message={message}
        error={error}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default ForgotPasswordPage; 