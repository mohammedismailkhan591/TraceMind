import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const origin = url.origin;

  // Only accept signup confirmation links.
  if (!tokenHash || type !== "signup") {
    return NextResponse.redirect(
      new URL("/verify-email?error=invalid_link", origin)
    );
  }

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing.");

    return NextResponse.redirect(
      new URL("/verify-email?error=verification_failed", origin)
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });

  if (error) {
    console.error("Email verification failed:", error.message);

    return NextResponse.redirect(
      new URL("/verify-email?error=verification_failed", origin)
    );
  }

  return NextResponse.redirect(
    new URL("/verify-email?verified=true", origin)
  );
}