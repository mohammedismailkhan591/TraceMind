import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/memories";
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // If Supabase rejected the link, return a useful error.
  if (errorCode || errorDescription) {
    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "reset_link_invalid");
    return NextResponse.redirect(destination);
  }

  // A PKCE recovery link should contain a code.
  if (!code) {
    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "missing_code");
    return NextResponse.redirect(destination);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();

  const response = NextResponse.redirect(
    new URL(next, requestUrl.origin)
  );

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error(
      "[AUTH CALLBACK] Exchange failed:",
      error?.message ?? "No session returned"
    );

    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "reset_link_invalid");

    return NextResponse.redirect(destination);
  }

  // Keep the recovery destination restricted to local paths.
  const safeNext =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/memories";

  response.headers.set(
    "Location",
    new URL(safeNext, requestUrl.origin).toString()
  );

  return response;
}