import { supabase } from "./supabase-client.js";

// Autenticación y registro de usuario con Supabase

export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, nombre, idioma) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, idioma },
    },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({ provider: "google" });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function upsertUsuario({ email, nombre, idioma }) {
  // Crea o actualiza usuario en af_usuarios
  return await supabase.from("af_usuarios").upsert([
    { email, nombre, idioma, ultimo_login: new Date().toISOString() },
  ], { onConflict: ["email"] });
}

// Recuperación de contraseña por email
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`,
  });
  return { error };
}
