import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a proxy that throws a descriptive error when any property is accessed
      return new Proxy({} as any, {
        get() {
          throw new Error('Supabase URL and Anon Key are required. Please configure them in the Settings menu.');
        }
      });
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// Export a proxy that lazily initializes the client on first access
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return (getSupabase() as any)[prop];
  }
});
