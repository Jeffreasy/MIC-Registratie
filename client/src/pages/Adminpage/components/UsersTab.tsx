import React, { useState, useEffect } from 'react';
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
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Plus, Edit2, Check, X, Search, SortAsc, SortDesc, Trash2, AlertTriangle } from 'lucide-react';

interface UsersTabProps {
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Toast component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md ${type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'} transition-opacity duration-300 z-50`}>
      <div className="flex items-center">
        {type === 'success' ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <AlertTriangle className="h-4 w-4 mr-2" />
        )}
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="ml-4">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Type voor sorteeropties
type SortField = 'email' | 'full_name' | 'role';
type SortDirection = 'asc' | 'desc';

const UsersTab: React.FC<UsersTabProps> = ({ users, setUsers, setError }) => {
  const { userProfile } = useAuthStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('medewerker');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Paginering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Sortering
  const [sortBy, setSortBy] = useState<SortField>('email');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Generate a random password (10 characters)
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array(10).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  // Valideer e-mailadres
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUserEmail) return;
    
    // Format email - if it doesn't contain @ add @sheerenloo.nl
    const email = newUserEmail.includes('@') ? newUserEmail : `${newUserEmail}@sheerenloo.nl`;
    
    // Valideer e-mailadres
    if (!validateEmail(email)) {
      setToast({ message: 'Ongeldig e-mailadres formaat', type: 'error' });
      return;
    }
    
    setIsCreatingUser(true);
    setError(null);
    
    try {
      // Genereer een tijdelijk wachtwoord
      const tempPassword = generateRandomPassword();
      
      // Roep de Supabase Edge Function aan die een gebruiker aanmaakt
      const { data, error: fnError } = await supabase.functions.invoke('Register', {
        body: { 
          email,
          password: tempPassword,
          role: newUserRole
        }
      });
      
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.message || 'Kon gebruiker niet aanmaken');
      
      // Haal de nieuwe gebruiker op uit de respons
      const newUserId = data.userId;
      
      if (!newUserId) {
        throw new Error('Gebruiker is aangemaakt maar geen gebruikers-ID ontvangen');
      }
      
      // Update lokale gebruikerslijst
      const newUser: UserProfile = {
        id: newUserId,
        email: email,
        full_name: null,
        role: newUserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUsers([...users, newUser]);
      
      // Toon toast bericht
      setToast({ message: 'Gebruiker succesvol aangemaakt!', type: 'success' });
      
      // Reset form
      setNewUserEmail('');
      setNewUserRole('medewerker');
      
      // Kopieer wachtwoord naar klembord
      navigator.clipboard.writeText(tempPassword);
      
      // Geef de gebruiker een melding met het tijdelijke wachtwoord
      alert(`Gebruiker aangemaakt met email: ${email}\n\nTijdelijk wachtwoord: ${tempPassword}\n\nHet wachtwoord is gekopieerd naar het klembord.\n\nGeef dit wachtwoord door aan de gebruiker en vraag om het direct te wijzigen bij de eerste login.`);
      
    } catch (err: unknown) {
      console.error('Error creating user:', err);
      const message = err instanceof Error ? err.message : String(err);
      setToast({ message: `Kon gebruiker niet aanmaken: ${message}`, type: 'error' });
      setError('Kon gebruiker niet aanmaken: ' + message);
    } finally {
      setIsCreatingUser(false);
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
      setToast({ message: 'Gebruikersrol succesvol bijgewerkt', type: 'success' });
    } catch (err: unknown) {
      console.error('Error updating user role:', err);
      const message = err instanceof Error ? err.message : String(err);
      setToast({ message: `Kon gebruikersrol niet bijwerken: ${message}`, type: 'error' });
      setError('Kon gebruikersrol niet bijwerken: ' + message);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // In een echte implementatie zou je een Edge Function aanroepen die de Supabase Admin API gebruikt
      // om de gebruiker te verwijderen, vergelijkbaar met de aanmaakfunctie
      
      // Dit is een placeholder voor de daadwerkelijke implementatie:
      /*
      const { data, error: fnError } = await supabase.functions.invoke('delete-user', {
        body: { 
          userId: userToDelete.id
        }
      });
      
      if (fnError) throw fnError;
      */
      
      // Voor nu simuleren we het verwijderen door de gebruiker uit de lijst te halen
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      setToast({ message: 'Gebruiker succesvol verwijderd', type: 'success' });
      setUserToDelete(null);
      setShowDeleteDialog(false);
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      const message = err instanceof Error ? err.message : String(err);
      setToast({ message: `Kon gebruiker niet verwijderen: ${message}`, type: 'error' });
      setError('Kon gebruiker niet verwijderen: ' + message);
    }
  };

  // Toggle sort direction
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Filter en sorteer gebruikers
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.email?.toLowerCase().includes(searchLower) || false) || 
      (user.full_name?.toLowerCase().includes(searchLower) || false) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Sorteer gebruikers
  const sortedUsers = [...filteredUsers].sort((a: UserProfile, b: UserProfile) => {
    // Get values, prepare for string comparison
    const valA = a[sortBy];
    const valB = b[sortBy];

    // Convert to string for consistent comparison, treat null/undefined as empty string
    // UserRole will also be correctly converted to its string representation.
    const stringValA = String(valA === null || valA === undefined ? '' : valA);
    const stringValB = String(valB === null || valB === undefined ? '' : valB);
    
    if (sortDirection === 'asc') {
      return stringValA.localeCompare(stringValB);
    } else {
      return stringValB.localeCompare(stringValA);
    }
  });

  // Pagination
  const lastPage = Math.ceil(sortedUsers.length / itemsPerPage);
  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, lastPage)));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Nieuwe Gebruiker Kaart */}
      <Card>
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
                name="user-email"
                value={newUserEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserEmail(e.target.value)}
                placeholder="naam@sheerenloo.nl"
                aria-label="Email adres"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Als u geen domein invoert, wordt @sheerenloo.nl automatisch toegevoegd
              </p>
            </div>
            <div>
              <Label htmlFor="user-role">Rol</Label>
              <Select
                value={newUserRole}
                onValueChange={(value: string) => setNewUserRole(value as UserRole)}
                name="user-role"
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
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            Een tijdelijk wachtwoord wordt automatisch gegenereerd
          </p>
          <Button
            onClick={handleCreateUser}
            disabled={!newUserEmail || isCreatingUser}
          >
            {isCreatingUser ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Toevoegen...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Toevoegen
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Gebruikerslijst Kaart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gebruikers</CardTitle>
              <CardDescription>
                {filteredUsers.length} van {users.length} gebruikers
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset paginering bij zoeken
                }}
                className="pl-8"
                id="search-users"
                name="search-users"
                aria-label="Zoeken naar gebruikers"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortBy === 'email' && (
                        sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center">
                      Naam
                      {sortBy === 'full_name' && (
                        sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Rol
                      {sortBy === 'role' && (
                        sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Geen gebruikers gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((userItem: UserProfile) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="text-xs max-w-[100px] truncate font-mono">{userItem.id}</TableCell>
                      <TableCell>
                        {editingUser === userItem.id ? (
                          <Input
                            type="email"
                            value={users.find(u => u.id === userItem.id)?.email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUsers(currentUsers => currentUsers.map(u => 
                                u.id === userItem.id ? { ...u, email: e.target.value } : u
                              ))
                            }
                          />
                        ) : (
                          userItem.email || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser === userItem.id ? (
                          <Input
                            value={users.find(u => u.id === userItem.id)?.full_name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setUsers(currentUsers => currentUsers.map(u => 
                                u.id === userItem.id ? { ...u, full_name: e.target.value } : u
                              ))
                            }
                          />
                        ) : (
                          userItem.full_name || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser === userItem.id ? (
                          <Select 
                            value={users.find(u => u.id === userItem.id)?.role || 'medewerker'}
                            onValueChange={(value: string) => 
                              setUsers(currentUsers => currentUsers.map(u => 
                                u.id === userItem.id ? { ...u, role: value as UserRole } : u
                              ))
                            }
                          >
                            <SelectTrigger className="w-[140px]" id={`edit-role-trigger-${userItem.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medewerker">Medewerker</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`rounded-md px-2 py-1 text-xs ${userItem.role === 'super_admin' ? 'bg-primary/20 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
                            {userItem.role === 'super_admin' ? 'Super Admin' : 'Medewerker'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingUser === userItem.id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const current = users.find(u => u.id === userItem.id);
                                if (current) {
                                  handleUpdateUserRole(userItem.id, current.role as UserRole);
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
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(userItem.id)}
                              disabled={userItem.id === userProfile?.id} // Kan eigen rol niet wijzigen
                            >
                              <Edit2 className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(userItem);
                                setShowDeleteDialog(true);
                              }}
                              disabled={userItem.id === userProfile?.id} // Kan eigen account niet verwijderen
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginering */}
          {lastPage > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  {currentPage === 1 ? (
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                      <PaginationPrevious className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <PaginationPrevious className="h-4 w-4" />
                    </Button>
                  )}
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  // Logica voor het tonen van paginanummers rond de huidige pagina
                  let pageNumber;
                  if (lastPage <= 5) {
                    // Als er 5 of minder pagina's zijn, toon ze allemaal
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    // Aan het begin, toon 1-5
                    pageNumber = i + 1;
                  } else if (currentPage >= lastPage - 2) {
                    // Aan het einde, toon de laatste 5
                    pageNumber = lastPage - 4 + i;
                  } else {
                    // In het midden, toon huidige pagina ± 2
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  {currentPage === lastPage ? (
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                      <PaginationNext className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <PaginationNext className="h-4 w-4" />
                    </Button>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Verwijderbevestiging Dialog */}
      {showDeleteDialog && userToDelete && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gebruiker verwijderen</DialogTitle>
              <DialogDescription>
                Weet u zeker dat u de gebruiker <strong>{userToDelete?.full_name || userToDelete?.email || userToDelete?.id || 'Onbekend'}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setUserToDelete(null);
                }}
              >
                Annuleren
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UsersTab; 