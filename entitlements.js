import { hasAccess, grantAccess } from "./access-control.js";
import { supabase } from "./supabase-client.js";
import { getAttributionSnapshot } from "./affiliate.js";
import { trackEvent } from "./analytics.js";
import { GUEST_READER_EMAILS } from "./admin-config.js";

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function getUsuarioByEmail(email) {
  const { data } = await supabase
    .from("af_usuarios")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();
  return data || null;
}

async function ensureUsuario(email) {
  const existing = await getUsuarioByEmail(email);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("af_usuarios")
    .upsert([{ email, ultimo_login: new Date().toISOString() }], { onConflict: "email" })
    .select("id, email")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveEntitlementForCurrentUser(grantId) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return false;
  }

  try {
    const usuario = await ensureUsuario(user.email);

    const { data: existing } = await supabase
      .from("af_entitlements")
      .select("id")
      .eq("usuario_id", usuario.id)
      .eq("producto", grantId)
      .eq("activo", true)
      .maybeSingle();

    if (!existing) {
      await supabase.from("af_entitlements").insert([
        {
          usuario_id: usuario.id,
          producto: grantId,
          activo: true,
        },
      ]);
    }

    await supabase.from("af_compras").insert([
      {
        usuario_id: usuario.id,
        email: user.email,
        producto: grantId,
        exito: true,
        metadata: {
          origen: "checkout_redirect",
          ...getAttributionSnapshot({ grant_id: grantId }),
        },
      },
    ]);

    await supabase.from("af_logs").insert([
      {
        usuario_id: usuario.id,
        email: user.email,
        accion: "compra_asignada",
        detalles: getAttributionSnapshot({ grant_id: grantId }),
      },
    ]);

    grantAccess(grantId);
    trackEvent("af_purchase_attributed", { grant_id: grantId });
    return true;
  } catch {
    return false;
  }
}

export async function hasEntitlementInSupabase(grantId) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return false;
  }

  const usuario = await getUsuarioByEmail(user.email);
  if (!usuario) {
    return false;
  }

  const { data, error } = await supabase
    .from("af_entitlements")
    .select("id")
    .eq("usuario_id", usuario.id)
    .eq("producto", grantId)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  const [local = "", domain = ""] = value.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = local.split("+")[0].replace(/\./g, "");
    return `${cleanLocal}@gmail.com`;
  }
  return value;
}

function isGuestReaderEmail(email) {
  if (!email) {
    return false;
  }
  const normalized = normalizeEmail(email);
  return GUEST_READER_EMAILS.map(normalizeEmail).includes(normalized);
}

export async function resolveAccess(grantId) {
  if (hasAccess(grantId)) {
    return true;
  }

  try {
    const user = await getCurrentUser();
    if (isGuestReaderEmail(user?.email)) {
      grantAccess(grantId);
      return true;
    }

    const unlocked = await hasEntitlementInSupabase(grantId);
    if (unlocked) {
      grantAccess(grantId);
    }
    return unlocked;
  } catch {
    return false;
  }
}
