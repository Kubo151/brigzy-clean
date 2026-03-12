// Logout Service
import { supabase } from './supabase';

export const performLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};
