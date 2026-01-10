/* ==========================================================
   Admin — Commandes clients (Supabase)
   - Login obligatoire
   - Accès réservé aux profils is_admin = true
   - Liste commandes + recherche / filtre
   - Actions: changer statut + bouton "Marquer expédiée"
   - Export CSV

   IMPORTANT (sécurité):
   - Utilise uniquement la publishable key côté navigateur.
   - La protection réelle = RLS + policies (is_admin).
   ========================================================== */

// ✅ RENSEIGNE ICI (mêmes valeurs que checkout.js)
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

// Charge supabase-js depuis CDN
(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAdmin;
  document.head.appendChild(s);
})();

// ----------------- utils -----------------
const euro = (cents) => (Number(cents || 0) / 100).toFixed(2).replace(".", ",") + " €";
const fmtDate = (iso) => {
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
};

function qs(id){ return document.getElementById(id); }
function setMsg(text, type="info"){
  const box = qs("msg");
  if(!box) return;
  box.style.display = text ? "block" : "none";
  box.textContent = text || "";
  box.className = "";
  box.classList.add(type === "err" ? "danger" : "ok");
}

function safeText(s){
  return (s ?? "").toString().replace(/[<>&]/g, (c)=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
}

// ----------------- state -----------------
let sb;
let currentUser = null;
let ordersCache = [];
let profilesById = new Map();

async function initAdmin(){
  try{
    if(!window.supabase) throw new Error("Supabase CDN non chargé.");
    if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
      throw new Error("SUPABASE_URL / SUPABASE_KEY manquants dans assets/js/admin.js");
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Bind UI
    qs("login-form")?.addEventListener("submit", onLogin);
    qs("logout-btn")?.addEventListener("click", onLogout);
    qs("refresh-btn")?.addEventListener("click", () => loadAndRender());
    qs("q")?.addEventListener("input", () => render());
    qs("status")?.addEventListener("change", () => render());
    qs("export-csv")?.addEventListener("click", exportCSV);

    // Boot
    const { data } = await sb.auth.getSession();
    currentUser = data?.session?.user || null;

    if(currentUser){
      await enterAdmin();
    } else {
      showLogin();
    }
  } catch(err){
    console.error(err);
    setMsg(err?.message || "Erreur init admin", "err");
    showLogin();
  }
}

function showLogin(){
  qs("admin-login")?.classList.remove("hidden");
  qs("admin-app")?.classList.add("hidden");
}

function showApp(){
  qs("admin-login")?.classList.add("hidden");
  qs("admin-app")?.classList.remove("hidden");
}

async function onLogin(e){
  e.preventDefault();
  setMsg("");
  const email = (qs("login-email")?.value || "").trim().toLowerCase();
  const password = qs("login-password")?.value || "";
  if(!email || !password){
    setMsg("Email et mot de passe requis.", "err");
    return;
  }
  const btn = qs("login-btn");
  if(btn){ btn.disabled = true; btn.textContent = "Connexion…"; }
  try{
    const res = await sb.auth.signInWithPassword({ email, password });
    if(res.error) throw res.error;
    const { data } = await sb.auth.getSession();
    currentUser = data?.session?.user || null;
    if(!currentUser) throw new Error("Connexion OK mais session introuvable.");
    await enterAdmin();
  } catch(err){
    console.error(err);
    setMsg(err?.message || "Erreur connexion", "err");
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = "Se connecter"; }
  }
}

async function onLogout(){
  await sb.auth.signOut();
  currentUser = null;
  ordersCache = [];
  profilesById = new Map();
  qs("orders") && (qs("orders").innerHTML = "");
  showLogin();
}

async function enterAdmin(){
  // Vérifie is_admin
  const prof = await sb
    .from("profiles")
    .select("id,email,first_name,last_name,phone,is_admin")
    .eq("id", currentUser.id)
    .maybeSingle();

  if(prof.error){
    throw prof.error;
  }
  if(!prof.data || prof.data.is_admin !== true){
    await sb.auth.signOut();
    currentUser = null;
    showLogin();
    setMsg("Accès refusé : ce compte n’est pas admin.", "err");
    return;
  }

  qs("admin-email") && (qs("admin-email").textContent = prof.data.email || currentUser.email || "");
  showApp();
  await loadAndRender();
}

// ----------------- data -----------------
async function loadAndRender(){
  setMsg("");
  qs("orders") && (qs("orders").innerHTML = "<div class='muted'>Chargement…</div>");

  // 1) commandes + items + addresses
  const res = await sb
    .from("orders")
    .select("id,user_id,status,created_at,currency,subtotal_cents,shipping_cents,total_cents,shipping_method,note,order_items(*),addresses(*)")
    .order("created_at", { ascending:false })
    .limit(200);

  if(res.error){
    console.error(res.error);
    setMsg(res.error.message || "Erreur chargement commandes", "err");
    qs("orders") && (qs("orders").innerHTML = "");
    return;
  }
  ordersCache = res.data || [];

  // 2) profils des clients
  const userIds = [...new Set(ordersCache.map(o => o.user_id).filter(Boolean))];
  profilesById = new Map();
  if(userIds.length){
    const pr = await sb
      .from("profiles")
      .select("id,email,first_name,last_name,phone")
      .in("id", userIds);
    if(pr.error){
      console.warn("profiles fetch failed", pr.error);
    } else {
      (pr.data || []).forEach(p => profilesById.set(p.id, p));
    }
  }

  render();
}

function filteredOrders(){
  const q = (qs("q")?.value || "").trim().toLowerCase();
  const st = (qs("status")?.value || "").trim();

  return (ordersCache || []).filter(o => {
    const prof = profilesById.get(o.user_id) || {};
    const hay = [
      o.id,
      o.status,
      o.shipping_method,
      prof.email,
      prof.first_name,
      prof.last_name,
      (o.order_items || []).map(i => i.product_name).join(" ")
    ].join(" ").toLowerCase();

    const okQ = !q || hay.includes(q);
    const okS = !st || (o.status === st);
    return okQ && okS;
  });
}

// ----------------- render -----------------
function render(){
  const box = qs("orders");
  if(!box) return;

  const list = filteredOrders();
  if(!list.length){
    box.innerHTML = "<div class='muted'>Aucune commande.</div>";
    return;
  }

  box.innerHTML = list.map(renderOrderCard).join("");

  // bind actions per card
  list.forEach(o => {
    const sel = qs(`st_${o.id}`);
    const save = qs(`save_${o.id}`);
    const ship = qs(`ship_${o.id}`);

    if(sel && save){
      sel.addEventListener("change", () => {
        save.disabled = false;
        save.textContent = "Enregistrer";
      });
      save.addEventListener("click", async () => {
        await updateStatus(o.id, sel.value);
      });
    }

    if(ship){
      ship.addEventListener("click", async () => {
        await updateStatus(o.id, "shipped");
      });
    }
  });
}

function renderOrderCard(o){
  const prof = profilesById.get(o.user_id) || {};
  const fullName = [prof.first_name, prof.last_name].filter(Boolean).join(" ") || "Client";
  const email = prof.email || "";
  const phone = prof.phone || "";

  const items = (o.order_items || []).map(i => {
    const opt = i.option_label ? ` • ${safeText(i.option_label)}` : "";
    const qty = Number(i.qty || 1);
    return `
      <div class="admin-item">
        <div class="admin-item-name">${safeText(i.product_name || i.product_id)}<span class="muted">${opt}</span></div>
        <div class="admin-item-meta">x ${qty}</div>
        <div class="admin-item-price">${euro(i.line_total_cents)}</div>
      </div>
    `;
  }).join("");

  const shipAddr = (o.addresses || []).find(a => a.type === "shipping") || (o.addresses || [])[0] || null;
  const addrLine = shipAddr ? [
    shipAddr.address1,
    shipAddr.address2,
    shipAddr.postal_code,
    shipAddr.city,
    shipAddr.country
  ].filter(Boolean).join(" • ") : "—";

  const statusOptions = ["new","paid","shipped","cancelled"].map(s =>
    `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`
  ).join("");

  const note = o.note ? `<div class="admin-note"><span class="muted">Note:</span> ${safeText(o.note)}</div>` : "";

  return `
    <article class="admin-card">
      <div class="admin-top">
        <div class="admin-id">#${safeText(o.id)}</div>
        <div class="admin-total">${euro(o.total_cents)}</div>
      </div>

      <div class="admin-meta">
        <div>
          <div class="admin-name">${safeText(fullName)}</div>
          <div class="muted">${safeText(email)}${phone ? ` • ${safeText(phone)}` : ""}</div>
          <div class="muted">${fmtDate(o.created_at)} • statut: <strong>${safeText(o.status)}</strong></div>
        </div>
        <div class="admin-actions">
          <select id="st_${safeText(o.id)}" class="admin-select">
            ${statusOptions}
          </select>
          <button id="save_${safeText(o.id)}" class="btn" disabled>Enregistré</button>
          <button id="ship_${safeText(o.id)}" class="btn ghost">Marquer expédiée</button>
        </div>
      </div>

      <div class="admin-subtotals">
        <div class="muted">Sous-total ${euro(o.subtotal_cents)} • Livraison ${euro(o.shipping_cents)} • ${safeText(o.shipping_method || "")}</div>
      </div>

      <div class="admin-items">
        ${items}
      </div>

      <div class="admin-addr">
        <div class="muted" style="font-weight:900; margin-bottom:6px;">Livraison</div>
        <div>${safeText(addrLine)}</div>
      </div>
      ${note}
    </article>
  `;
}

async function updateStatus(orderId, status){
  try{
    const saveBtn = qs(`save_${orderId}`);
    if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = "…"; }

    const up = await sb.from("orders").update({ status }).eq("id", orderId);
    if(up.error) throw up.error;

    // update local cache
    const o = ordersCache.find(x => x.id === orderId);
    if(o) o.status = status;
    render();
    setMsg("Statut mis à jour ✔", "ok");
  } catch(err){
    console.error(err);
    setMsg(err?.message || "Erreur update status", "err");
  }
}

// ----------------- CSV export -----------------
function exportCSV(){
  const list = filteredOrders();
  if(!list.length){
    setMsg("Aucune commande à exporter.", "err");
    return;
  }

  const rows = [];
  rows.push([
    "order_id","created_at","status","customer_email","customer_name","phone",
    "subtotal_eur","shipping_eur","total_eur","shipping_method",
    "address","items"
  ]);

  list.forEach(o => {
    const prof = profilesById.get(o.user_id) || {};
    const fullName = [prof.first_name, prof.last_name].filter(Boolean).join(" ");
    const shipAddr = (o.addresses || []).find(a => a.type === "shipping") || (o.addresses || [])[0] || {};
    const address = [shipAddr.address1, shipAddr.address2, shipAddr.postal_code, shipAddr.city, shipAddr.country]
      .filter(Boolean).join(" ");

    const items = (o.order_items || []).map(i => {
      const opt = i.option_label ? ` (${i.option_label})` : "";
      return `${i.product_name || i.product_id}${opt} x${i.qty}`;
    }).join(" | ");

    rows.push([
      o.id,
      o.created_at,
      o.status,
      prof.email || "",
      fullName || "",
      prof.phone || "",
      (Number(o.subtotal_cents||0)/100).toFixed(2),
      (Number(o.shipping_cents||0)/100).toFixed(2),
      (Number(o.total_cents||0)/100).toFixed(2),
      o.shipping_method || "",
      address,
      items
    ]);
  });

  const csv = rows.map(r => r.map(cell => {
    const s = (cell ?? "").toString();
    // CSV safe
    if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commandes_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
