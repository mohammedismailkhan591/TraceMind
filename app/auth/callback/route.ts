import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/memories";

  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorCode || errorDescription) {
    const destination = new URL(
      "/forgot-password?error=reset_link_invalid",
      requestUrl.origin
    );

    return NextResponse.redirect(destination);
  }

  if (!code) {
    console.error("[AUTH CALLBACK] Missing authorization code");

    const destination = new URL(
      "/forgot-password?error=missing_code",
      requestUrl.origin
    );

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
    new URL("/reset-password", requestUrl.origin)
  );

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        }
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

    return NextResponse.redirect(
      new URL(
        "/forgot-password?error=reset_link_invalid",
        requestUrl.origin
      )
    );
  }

  // Preserve other authentication destinations while restricting redirects
  // to local application paths.
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