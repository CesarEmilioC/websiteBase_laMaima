"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_LOGIN_PATH } from "@/lib/supabase/middleware";

/** Cierra la sesión y borra las cookies de Supabase Auth. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ADMIN_LOGIN_PATH);
}
