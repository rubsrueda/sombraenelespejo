import { supabase } from "./supabase-client.js";
import { getAttributionSnapshot } from "./affiliate.js";

// Autenticación y registro de usuario con Supabase

function buildAppUrl(targetPath = "login.html") {
  const basePath = window.location.pathname.replace(/[^/]*$/, "");
  return `${window.location.origin}${basePath}${targetPath}`;
}

export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, nombre, idioma) {
  const attribution = getAttributionSnapshot({ auth_method: "email" });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, idioma, attribution },
    },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  return await signInWithProvider("google");
}

export async function signInWithProvider(provider) {
  const supported = ["google", "facebook", "twitter"];
  if (!supported.includes(provider)) {
    return {
      data: null,
      error: new Error(`Proveedor no soportado en Supabase: ${provider}`),
    };
  }

  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildAppUrl("login.html"),
    },
  });
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

async function getUsuarioIdByEmail(email) {
  const { data } = await supabase
    .from("af_usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id || null;
}

export async function logAuthAction(accion, email, detalles = {}) {
  if (!email) {
    return;
  }

  try {
    const usuarioId = await getUsuarioIdByEmail(email);
    const enriched = {
      ...getAttributionSnapshot(),
      ...detalles,
    };

    await supabase.from("af_logs").insert([
      {
        usuario_id: usuarioId,
        email,
        accion,
        detalles: enriched,
      },
    ]);
  } catch {
    // Evita bloquear la autenticación si falla logging.
  }
}

// Recuperación de contraseña por email
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAppUrl("login.html"),
  });
  return { error };
}
