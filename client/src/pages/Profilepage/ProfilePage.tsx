// @ts-nocheck

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import useProfileData from './hooks/useProfileData';
import UserInfoCard from './components/UserInfoCard';
import DebugSettingsCard from './components/DebugSettingsCard';
import DebugInfoCard from './components/DebugInfoCard';
import AccountSettingsCard from './components/AccountSettingsCard';

const ProfilePage: React.FC = () => {
  const {
    user,
    userProfile,
    role,
    isUpdating,
    error,
    successMessage,
    handleRoleChange,
    handleProfileUpdate,
    handlePasswordReset
  } = useProfileData();

  // Check of gebruiker een super_admin is
  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Mijn Profiel</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basisinformatie kaart is altijd zichtbaar */}
        <UserInfoCard 
          user={user}
          userProfile={userProfile}
          role={role}
        />

        {/* Nieuwe account instellingen kaart - voor alle gebruikers */}
        <AccountSettingsCard
          user={user}
          userProfile={userProfile}
          onUpdateProfile={handleProfileUpdate}
          onResetPassword={handlePasswordReset}
          isUpdating={isUpdating}
          error={error}
          successMessage={successMessage}
        />

        {/* Debug componenten alleen zichtbaar voor super_admin gebruikers */}
        {isSuperAdmin && (
          <>
            <DebugSettingsCard
              role={role}
              isUpdating={isUpdating}
              error={error}
              successMessage={successMessage}
              onRoleChange={handleRoleChange}
            />

            <DebugInfoCard
              user={user}
              userProfile={userProfile}
              role={role}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 