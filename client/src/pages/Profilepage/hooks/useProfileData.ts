import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/lib/types';

export const useProfileData = () => {
  const { user, userProfile, role, updateUserRole, updateProfile, resetPassword } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateUserRole(user.id, newRole);
      setSuccessMessage(`Rol succesvol bijgewerkt naar ${newRole}`);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het bijwerken van de rol');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileUpdate = async (fullName: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateProfile(user.id, { full_name: fullName });
      setSuccessMessage('Profielgegevens succesvol bijgewerkt');
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het bijwerken van het profiel');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      await resetPassword(user.email);
      setSuccessMessage(`Wachtwoord reset link is verstuurd naar ${user.email}`);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het versturen van de reset link');
    }
  };

  return {
    user,
    userProfile,
    role,
    isUpdating,
    error,
    successMessage,
    handleRoleChange,
    handleProfileUpdate,
    handlePasswordReset
  };
};

export default useProfileData; 