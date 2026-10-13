import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  const safeNext =
    next === "/reset-password" ? "/reset-password" : "/verify-email?verified=1";

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", requestUrl.origin)
    );
  }

  if (!code) {
    const destination =
      next === "/reset-password"
        ? "/forgot-password?error=missing_code"
        : "/verify-email?error=missing_code";

    return NextResponse.redirect(
      new URL(destination, requestUrl.origin)
    );
  }

  const response = NextResponse.redirect(
    new URL(safeNext, requestUrl.origin)
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

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const destination =
      next === "/reset-password"
        ? "/forgot-password?error=reset_link_invalid"
        : "/verify-email?error=verification_failed";

    const errorResponse = NextResponse.redirect(
      new URL(destination, requestUrl.origin)
    );

    response.cookies.getAll().forEach((cookie) => {
      errorResponse.cookies.set(cookie);
    });

    return errorResponse;
  }

  return response;
}