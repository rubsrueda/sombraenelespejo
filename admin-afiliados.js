import { supabase } from "./supabase-client.js";
import { getCurrentUser } from "./auth-supabase.js";
import { ADMIN_EMAILS } from "./admin-config.js";

const adminStatus = document.getElementById("adminStatus");
const totalRefsNode = document.getElementById("totalRefs");
const totalConversionsNode = document.getElementById("totalConversions");
const totalPurchasesNode = document.getElementById("totalPurchases");
const topRefsTable = document.getElementById("topRefsTable");
const conversionsTable = document.getElementById("conversionsTable");
const purchasesTable = document.getElementById("purchasesTable");
const refreshBtn = document.getElementById("refreshAffiliateStats");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAdminUser(user) {
  const email = normalizeEmail(user?.email);
  if (!email) {
    return false;
  }

  const allowList = ADMIN_EMAILS.map(normalizeEmail);
  if (allowList.includes(email)) {
    return true;
  }

  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  return role === "admin";
}

function extractOriginFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "directo";
  }

  const attribution = payload.attribution || {};
  const candidates = [
    attribution.ref,
    attribution.utm_source,
    payload.preferred_origin,
    payload.ref,
    payload.utm_source,
  ];

  const found = candidates.find((item) => String(item || "").trim());
  return found ? String(found).trim().toLowerCase() : "directo";
}

function renderSimpleTable(tbody, rows, columns) {
  tbody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = columns.length;
    td.className = "p-3 text-sm text-slate-500";
    td.textContent = "Sin datos todavía.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-200";
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.className = "p-3 text-sm";
      td.textContent = String(row[column] ?? "-");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

async function fetchStats() {
  const [logsResult, purchasesResult] = await Promise.all([
    supabase
      .from("af_logs")
      .select("accion, detalles, fecha, email")
      .order("fecha", { ascending: false })
      .limit(1000),
    supabase
      .from("af_compras")
      .select("email, producto, fecha_pago, exito, metadata")
      .order("fecha_pago", { ascending: false })
      .limit(1000),
  ]);

  if (logsResult.error) {
    throw new Error(`af_logs: ${logsResult.error.message}`);
  }

  if (purchasesResult.error) {
    throw new Error(`af_compras: ${purchasesResult.error.message}`);
  }

  const logs = logsResult.data || [];
  const purchases = (purchasesResult.data || []).filter((row) => row.exito !== false);

  const refsMap = new Map();
  const conversionsMap = new Map();
  const purchasesMap = new Map();

  logs.forEach((row) => {
    const origin = extractOriginFromPayload(row.detalles);
    refsMap.set(origin, (refsMap.get(origin) || 0) + 1);

    const action = String(row.accion || "").toLowerCase();
    const isConversionAction = action.includes("registro") || action.includes("signup") || action.includes("login");

    if (isConversionAction) {
      conversionsMap.set(origin, (conversionsMap.get(origin) || 0) + 1);
    }
  });

  purchases.forEach((row) => {
    const origin = extractOriginFromPayload(row.metadata);
    purchasesMap.set(origin, (purchasesMap.get(origin) || 0) + 1);
  });

  const topRefs = Array.from(refsMap.entries())
    .map(([origen, visitas]) => ({ origen, visitas }))
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, 20);

  const topConversions = Array.from(conversionsMap.entries())
    .map(([origen, conversiones]) => ({ origen, conversiones }))
    .sort((a, b) => b.conversiones - a.conversiones)
    .slice(0, 20);

  const topPurchases = Array.from(purchasesMap.entries())
    .map(([origen, compras]) => ({ origen, compras }))
    .sort((a, b) => b.compras - a.compras)
    .slice(0, 20);

  return {
    totalRefs: Array.from(refsMap.values()).reduce((acc, n) => acc + n, 0),
    totalConversions: Array.from(conversionsMap.values()).reduce((acc, n) => acc + n, 0),
    totalPurchases: Array.from(purchasesMap.values()).reduce((acc, n) => acc + n, 0),
    topRefs,
    topConversions,
    topPurchases,
  };
}

async function loadAdminPanel() {
  const user = await getCurrentUser();

  if (!user) {
    adminStatus.textContent = "Debes iniciar sesión para acceder al panel de afiliados.";
    return;
  }

  if (!isAdminUser(user)) {
    adminStatus.textContent = `Acceso denegado. Usuario autenticado: ${user.email}. No tiene rol administrador.`;
    return;
  }

  adminStatus.textContent = `Acceso concedido. Administrador: ${user.email}`;

  try {
    const stats = await fetchStats();

    totalRefsNode.textContent = String(stats.totalRefs);
    totalConversionsNode.textContent = String(stats.totalConversions);
    totalPurchasesNode.textContent = String(stats.totalPurchases);

    renderSimpleTable(topRefsTable, stats.topRefs, ["origen", "visitas"]);
    renderSimpleTable(conversionsTable, stats.topConversions, ["origen", "conversiones"]);
    renderSimpleTable(purchasesTable, stats.topPurchases, ["origen", "compras"]);
  } catch (error) {
    adminStatus.textContent = `Error leyendo Supabase: ${error.message}`;
  }
}

refreshBtn.addEventListener("click", () => {
  loadAdminPanel();
});

loadAdminPanel();
