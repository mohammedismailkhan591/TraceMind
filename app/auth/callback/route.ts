import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  console.log(
  "[AUTH CALLBACK]",
  JSON.stringify({
    pathname: requestUrl.pathname,
    hasCode: Boolean(requestUrl.searchParams.get("code")),
    hasTokenHash: Boolean(requestUrl.searchParams.get("token_hash")),
    type: requestUrl.searchParams.get("type"),
    next: requestUrl.searchParams.get("next"),
    error: requestUrl.searchParams.get("error"),
  })
);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  const isRecovery =
    next === "/reset-password" ||
    type === "recovery";

  const successPath = isRecovery
    ? "/reset-password"
    : "/verify-email?verified=1";

  const errorPath = isRecovery
    ? "/forgot-password?error=reset_link_invalid"
    : "/verify-email?error=verification_failed";

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL(
        "/login?error=supabase_not_configured",
        requestUrl.origin
      )
    );
  }

  const response = NextResponse.redirect(
    new URL(successPath, requestUrl.origin)
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

  let authError: { message: string } | null = null;
  let userExists = false;

  if (code) {
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    authError = error;
    userExists = Boolean(data.user);
  } else if (tokenHash && type) {
    const { data, error } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as
          | "recovery"
          | "signup"
          | "invite"
          | "magiclink"
          | "email"
          | "email_change",
      });

    authError = error;
    userExists = Boolean(data.user);
} else {
  const diagnosticUrl = new URL(
    "/forgot-password?error=missing_code",
    requestUrl.origin
  );

  diagnosticUrl.searchParams.set(
    "debug_type",
    type || "none"
  );

  diagnosticUrl.searchParams.set(
    "debug_has_token_hash",
    String(Boolean(tokenHash))
  );

  diagnosticUrl.searchParams.set(
    "debug_has_code",
    String(Boolean(code))
  );

  return NextResponse.redirect(diagnosticUrl);
}
  if (authError || !userExists) {
    return NextResponse.redirect(
      new URL(errorPath, requestUrl.origin)
    );
  }

  return response;
}