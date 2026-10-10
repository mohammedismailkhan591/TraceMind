import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Read the user's access token from the request.
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Your session is missing. Please sign in again.",
        },
        { status: 401 }
      );
    }

    // 2. Initialize Supabase using the public project credentials.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publicKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publicKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase public configuration is missing.",
        },
        { status: 500 }
      );
    }

    // Validate the token with Supabase Auth.
    const authClient = createClient(url, publicKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your session is invalid or expired. Please sign in again.",
        },
        { status: 401 }
      );
    }

    // 3. Initialize the privileged client on the server only.
    const serverKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!serverKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server-side account deletion is not configured.",
        },
        { status: 500 }
      );
    }

    const admin = createClient(url, serverKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const userId = user.id;

    // 4. Find the user's uploaded files.
    const { data: assets, error: assetLookupError } = await admin
      .from("memory_assets")
      .select("storage_path")
      .eq("user_id", userId);

    if (assetLookupError) {
      throw new Error(
        `Could not prepare uploaded files: ${assetLookupError.message}`
      );
    }

    const paths = (assets ?? [])
      .map((item) => item.storage_path)
      .filter(
        (path): path is string =>
          typeof path === "string" && path.length > 0
      );

    // 5. Remove uploaded files from storage.
    if (paths.length > 0) {
      const { error } = await admin.storage
        .from("memory-assets")
        .remove(paths);

      if (error) {
        throw new Error(
          `Could not remove uploaded files: ${error.message}`
        );
      }
    }

    // 6. Delete the user's application data.
    const tables = [
      "memory_assets",
      "reminders",
      "memories",
      "profiles",
    ] as const;

    for (const table of tables) {
      const column = table === "profiles" ? "id" : "user_id";

      const { error } = await admin
        .from(table)
        .delete()
        .eq(column, userId);

      if (error) {
        throw new Error(
          `Could not delete ${table}: ${error.message}`
        );
      }
    }

    // 7. Delete the Supabase Auth account.
    const { error: deleteUserError } =
      await admin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(
        `Could not delete authentication account: ${deleteUserError.message}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your TraceMind account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Account deletion failed.",
      },
      { status: 500 }
    );
  }
}