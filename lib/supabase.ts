import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured yet. Copy .env.local.example to .env.local and add your Supabase project URL and anon key.";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function missingConfigResult() {
  return { data: null, error: new Error(SUPABASE_SETUP_MESSAGE) };
}

function makeFallbackClient() {
  const chain = (): any =>
    new Proxy(
      {},
      {
        get(_target, property) {
          if (property === "then") {
            return (resolve: (value: unknown) => void) =>
              resolve(missingConfigResult());
          }
          return (..._args: unknown[]) => chain();
        },
      }
    );

  const fallback = {
    auth: {
      getUser: async () => missingConfigResult(),
      getSession: async () => ({ data: { session: null }, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      resetPasswordForEmail: async () => ({ data: {}, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      signOut: async () => ({ error: new Error(SUPABASE_SETUP_MESSAGE) }),
      refreshSession: async () => ({ data: { session: null, user: null }, error: new Error(SUPABASE_SETUP_MESSAGE) }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: (_table: string) => chain(),
    storage: {
      from: (_bucket: string) => chain(),
    },
  };

  return fallback as unknown as SupabaseClient;
}

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return makeFallbackClient();

  return createBrowserClient(url, key);
}
