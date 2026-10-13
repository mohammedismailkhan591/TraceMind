import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", requestUrl.origin)
    );
  }

  const response = NextResponse.redirect(
    new URL("/login", requestUrl.origin)
  );

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/verify-email?error=missing_code", requestUrl.origin)
    );
  }

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/verify-email?error=verification_failed", requestUrl.origin)
    );
  }

  // Password recovery must return to the password-reset page.
  if (next === "/reset-password") {
    response.headers.set(
      "Location",
      new URL("/reset-password", requestUrl.origin).toString()
    );

    return response;
  }

  // A successfully verified email gets its own confirmation page.
  const verifiedResponse = NextResponse.redirect(
    new URL("/verify-email?verified=1", requestUrl.origin)
  );

  // Preserve the authentication cookies created during code exchange.
  response.cookies.getAll().forEach((cookie) => {
    verifiedResponse.cookies.set(cookie);
  });

  return verifiedResponse;
}