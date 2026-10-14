import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // Keep the redirects on the same origin as the incoming request.
  const successUrl = new URL(
    "/verify-email?verified=true",
    requestUrl.origin
  );

  const invalidUrl = new URL(
    "/verify-email?error=invalid_link",
    requestUrl.origin
  );

  const errorUrl = new URL(
    "/verify-email?error=verification_failed",
    requestUrl.origin
  );

  // A token hash and a valid OTP type are required.
  const allowedTypes: EmailOtpType[] = [
    "signup",
    "email",
    "recovery",
    "invite",
    "magiclink",
    "email_change",
  ];

  if (
    !tokenHash ||
    !type ||
    !allowedTypes.includes(type as EmailOtpType)
  ) {
    return NextResponse.redirect(invalidUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Supabase configuration error: required environment variables are missing."
    );

    return NextResponse.redirect(errorUrl);
  }

  try {
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

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error) {
      console.error(
        "Email verification failed:",
        error.message
      );

      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error(
      "Unexpected error during email verification:",
      error
    );

    return NextResponse.redirect(errorUrl);
  }
}