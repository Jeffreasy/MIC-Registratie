import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Check, X } from 'lucide-react';

interface UsersTabProps {
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, setUsers, setError }) => {
  const { userProfile } = useAuthStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('medewerker');

  // Create new user
  const handleCreateUser = async () => {
    if (!newUserEmail) return;
    
    try {
      // In een echte implementatie zou je een server endpoint gebruiken
      // die de Supabase Admin API aanroept om gebruikers aan te maken
      alert('In een productieomgeving zou dit een nieuwe gebruiker aanmaken: ' + newUserEmail);
      
      // Reset form
      setNewUserEmail('');
      setNewUserRole('medewerker');
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError('Kon gebruiker niet aanmaken: ' + err.message);
    }
  };
  
  // Update user role
  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role } : u
      ));
      
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError('Kon gebruikersrol niet bijwerken: ' + err.message);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Nieuwe Gebruiker</CardTitle>
          <CardDescription>
            Voeg een nieuwe gebruiker toe en wijs een rol toe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="naam@sheerenloo.nl"
              />
            </div>
            <div>
              <Label htmlFor="user-role">Rol</Label>
              <Select
                value={newUserRole}
                onValueChange={(value: any) => setNewUserRole(value)}
              >
                <SelectTrigger id="user-role" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medewerker">Medewerker</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-6"
              onClick={handleCreateUser}
              disabled={!newUserEmail}
            >
              <Plus className="h-4 w-4 mr-1" />
              Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gebruikers</CardTitle>
          <CardDescription>
            {users.length} gebruikers in totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Naam</th>
                  <th className="text-left py-2">Rol</th>
                  <th className="text-right py-2">Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 text-xs max-w-[120px] truncate">{user.id}</td>
                    <td className="py-2">{user.full_name || '-'}</td>
                    <td className="py-2">
                      {editingUser === user.id ? (
                        <Select
                          value={users.find(u => u.id === user.id)?.role || 'medewerker'}
                          onValueChange={(value: any) => {
                            setUsers(users.map(u => 
                              u.id === user.id ? { ...u, role: value } : u
                            ));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medewerker">Medewerker</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={user.role === 'super_admin' ? 'font-medium text-primary' : ''}>
                          {user.role === 'super_admin' ? 'Super Admin' : 'Medewerker'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editingUser === user.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = users.find(u => u.id === user.id);
                              if (current) {
                                handleUpdateUserRole(user.id, current.role as UserRole);
                              }
                            }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(null)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user.id)}
                          disabled={user.id === userProfile?.id} // Kan eigen rol niet wijzigen
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersTab; 