import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/lib/types';

export const useProfileData = () => {
  const { user, userProfile, role, updateUserRole } = useAuthStore();
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

  return {
    user,
    userProfile,
    role,
    isUpdating,
    error,
    successMessage,
    handleRoleChange
  };
};

export default useProfileData; 