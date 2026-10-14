import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/memories";

  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Supabase rejected the authentication link.
  if (errorCode || errorDescription) {
    console.error("[AUTH CALLBACK] Supabase rejected link:", {
      errorCode,
      errorDescription,
    });

    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "reset_link_invalid");

    return NextResponse.redirect(destination);
  }

  if (!code) {
    console.error("[AUTH CALLBACK] Authorization code is missing");

    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "missing_code");

    return NextResponse.redirect(destination);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[AUTH CALLBACK] Supabase environment variables missing");

    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();

  // Use the same response for redirects and Supabase cookie updates.
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
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    // Log the actual reason in Vercel without exposing tokens.
    console.error("[AUTH CALLBACK] Code exchange failed:", {
      message: error?.message ?? "No session returned",
      status: error?.status ?? null,
      code: error?.code ?? null,
    });

    const destination = new URL("/forgot-password", requestUrl.origin);
    destination.searchParams.set("error", "reset_link_invalid");

    return NextResponse.redirect(destination);
  }

  // Only allow redirects to local paths.
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