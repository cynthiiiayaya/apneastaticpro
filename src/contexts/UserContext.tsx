import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface UserContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
  login: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user session on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
        } else {
          // Check for saved user in localStorage
          const savedUser = localStorage.getItem('apneastatic_user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.id && parsedUser.email) {
                setUser(parsedUser);
              }
            } catch (error) {
              console.error('Error parsing saved user:', error);
              localStorage.removeItem('apneastatic_user');
            }
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Simple login function - just check if user exists, or create a new one
  const login = async (email: string): Promise<{ error: string | null }> => {
    try {
      setLoading(true);
      
      // First, check if the user exists in our users table
      const { data: existingUsers, error: queryError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (queryError) {
        console.error('Error checking if user exists:', queryError);
        return { error: 'Error checking user account' };
      }

      // If user exists in our table, we can just simulate login
      if (existingUsers) {
        console.log('User found, simulating login');
        
        // Set the user in context
        const userData = {
          id: existingUsers.id,
          email: existingUsers.email
        };
        
        setUser(userData);
        
        // Save to localStorage for persistence
        localStorage.setItem('apneastatic_user', JSON.stringify(userData));
        
        return { error: null };
      } else {
        // User doesn't exist, create a new one
        console.log('User not found, creating new user');

        // Create a new UUID for the user
        const newUserId = crypto.randomUUID();
        
        // Insert the new user into our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id: newUserId, email: email }]);
        
        if (insertError) {
          console.error('Error creating user:', insertError);
          return { error: 'Unable to create user account. Please try again.' };
        }
        
        // Set the user in context
        const userData = {
          id: newUserId,
          email: email
        };
        
        setUser(userData);
        
        // Save to localStorage for persistence
        localStorage.setItem('apneastatic_user', JSON.stringify(userData));
        
        return { error: null };
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Simple logout - just clear the user from context and localStorage
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setUser(null);
      localStorage.removeItem('apneastatic_user');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};