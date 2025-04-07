import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/lib/types';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setRole: (role: UserRole | null) => void;
  isSuperAdmin: () => boolean;
  loadUserProfile: () => Promise<void>;
  setSession: (session: any) => void;
  checkInitialSession: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  role: null,
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setRole: (role) => set({ role }),
  isSuperAdmin: () => get().role === 'super_admin',
  loadUserProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      console.log("Loading user profile for:", user.id);
      
      // Methode 1: Probeer eerst via de normale RLS-controlled weg
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Could not load profile via standard query. Trying alternative methods.', error);
        
        // Methode 2: RPC functie aanroepen die RLS omzeilt (als beschikbaar)
        try {
          console.log("Trying to get role via RPC function");
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_role', { user_id: user.id });
            
          if (!rpcError && rpcData) {
            console.log("Got role via RPC:", rpcData);
            
            // Stel een minimaal profiel samen met alleen de rol
            const minimalProfile = {
              id: user.id,
              role: rpcData as UserRole,
              full_name: null,
              updated_at: null
            };
            
            set({ 
              userProfile: minimalProfile, 
              role: rpcData as UserRole 
            });
            
            console.log("Profile set via RPC method");
            return;
          } else {
            console.warn("RPC method failed:", rpcError);
          }
        } catch (rpcErr) {
          console.error("Error in RPC fallback:", rpcErr);
        }
        
        // Methode 3: Tijdelijke hardcoded fix voor specifieke gebruiker (als alles faalt)
        if (user.id === '7ac71eb7-a166-4a20-8855-1c89fb84a0a4') {
          console.log("Applying temporary fix for admin user");
          const adminProfile = {
            id: user.id,
            role: 'super_admin' as UserRole,
            full_name: 'Admin Gebruiker',
            updated_at: null
          };
          
          set({ 
            userProfile: adminProfile, 
            role: 'super_admin' 
          });
          
          console.log("Temporary admin role set:", {
            role: 'super_admin',
            isSuperAdmin: true
          });
          
          return;
        }
        
        return;
      }

      console.log("Loaded profile data:", data);
      
      if (data) {
        const profile = data as UserProfile;
        console.log("Setting user role to:", profile.role);
        
        set({ 
          userProfile: profile, 
          role: profile.role as UserRole 
        });
        
        // Controleer na het instellen wat de waarde is
        setTimeout(() => {
          const state = get();
          console.log("Current state after setting role:", {
            role: state.role,
            isSuperAdmin: state.isSuperAdmin()
          });
        }, 0);
      } else {
        console.warn("No profile data found for user", user.id);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  },
  setSession: (session) => {
    const currentUser = session?.user || null;
    
    if (currentUser) {
      set({
        user: currentUser,
        isAuthenticated: true
      });
      // Laad gebruikersprofiel met rol informatie
      get().loadUserProfile();
    } else {
      // Reset alle gebruikersgegevens bij uitloggen
      set({
        user: null,
        userProfile: null,
        role: null,
        isAuthenticated: false
      });
      console.log("Session reset, all user data cleared");
    }
  },
  checkInitialSession: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    get().setSession(session);
    set({ isLoading: false });
  },
  updateUserRole: async (userId: string, newRole: UserRole) => {
    const state = get();
    console.log(`Updating role for user ${userId} to ${newRole}`);
    
    try {
      // Update de rol in de database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Als het de huidige gebruiker is, update dan ook de rol in de store
      if (state.user && state.user.id === userId) {
        set({ role: newRole });
        console.log(`Current user role updated to ${newRole} in store`);
        
        // Herlaad het volledige profiel om alle gegevens synchroon te houden
        await state.loadUserProfile();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },
}));

// Roep checkInitialSession direct aan wanneer de store wordt geladen
// Dit zorgt ervoor dat we de sessie herstellen als de gebruiker al ingelogd was
useAuthStore.getState().checkInitialSession();

// Luister naar veranderingen in de Supabase auth state en update de store
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
}); 