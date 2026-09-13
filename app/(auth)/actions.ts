"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/ofertas");

  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(redirectTo || "/ofertas");
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nombre || !email || !password) {
    return { error: "Completa nombre, email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    console.error("[signUp] Supabase error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  redirect("/perfil?bienvenida=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
