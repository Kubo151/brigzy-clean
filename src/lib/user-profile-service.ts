// User Profile Service
import { supabase } from './supabase';

export const fetchUserProfileWithAuth = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
