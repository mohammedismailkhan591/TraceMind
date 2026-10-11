import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to delete your account." },
        { status: 401 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serverKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!url || !serverKey) {
      return NextResponse.json(
        { success: false, error: "Server-side Supabase deletion is not configured." },
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

    const { data: assets, error: assetLookupError } = await admin
      .from("memory_assets")
      .select("storage_path")
      .eq("user_id", userId);

    if (assetLookupError) {
      throw new Error(`Could not prepare uploaded files: ${assetLookupError.message}`);
    }

    const paths = (assets ?? [])
      .map((item) => item.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    if (paths.length > 0) {
      const { error } = await admin.storage.from("memory-assets").remove(paths);
      if (error) {
        throw new Error(`Could not remove uploaded files: ${error.message}`);
      }
    }

    const tables = ["memory_assets", "reminders", "memories", "profiles"] as const;
    for (const table of tables) {
      const column = table === "profiles" ? "id" : "user_id";
      const { error } = await admin.from(table).delete().eq(column, userId);
      if (error) {
        throw new Error(`Could not delete ${table}: ${error.message}`);
      }
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteUserError) {
      throw new Error(`Could not delete authentication account: ${deleteUserError.message}`);
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
        error: error instanceof Error ? error.message : "Account deletion failed.",
      },
      { status: 500 }
    );
  }
}
