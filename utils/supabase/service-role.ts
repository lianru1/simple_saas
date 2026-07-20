import { createClient } from "@supabase/supabase-js";
import { ENV } from "@/lib/env";

export const createServiceRoleClient = () => {
  return createClient(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
