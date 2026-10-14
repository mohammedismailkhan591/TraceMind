import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const successUrl = new URL("/verify-email?verified=true", url.origin);
  const invalidUrl = new URL(
    "/verify-email?error=invalid_link",
    url.origin
  );
  const errorUrl = new URL(
    "/verify-email?error=verification_failed",
    url.origin
  );

  // The callback must receive the token hash from the email link.
  if (!tokenHash || type !== "signup") {
    return NextResponse.redirect(invalidUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing.");
    return NextResponse.redirect(errorUrl);
  }

  const cookieStore = await cookies();

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

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });

    if (error) {
      console.error("Signup verification failed:", error.message);
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Unexpected verification error:", error);
    return NextResponse.redirect(errorUrl);
  }
}