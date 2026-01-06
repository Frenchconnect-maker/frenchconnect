/* =========================================
   Admin Orders — Supabase (GitHub Pages friendly)
   - Connexion (email + mot de passe)
   - Vérifie le flag admin dans public.profiles (colonne: is_admin boolean)
   - Liste les commandes + items + adresses
   ========================================= */

// 1) ✅ RENSEIGNE ICI (publishable only)
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

// 2) Load supabase-js from CDN (no build)
(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = () => initAdmin().catch(console.error);
  document.head.appendChild(s);
})();

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function escapeHtml(str){
  return (""+(str ?? "")).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function euroFromCents(c){
  const n = (Number(c || 0) / 100);
  return n.toFixed(2).replace(".", ",") + " €";
}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("fr-FR");
  }catch(e){ return iso || ""; }
}
function showMsg(type, text){
  const box = $("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `
    <div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">
      ${type === "ok" ? "OK" : "Erreur"}
    </div>
    <div>${text}</div>
  `;
}
function hideMsg(){
  const box = $("msg");
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

async function initAdmin(){
  if(!window.supabase){
    showMsg("err", "Supabase n’a pas chargé (CDN). Vérifie ta connexion.");
    return;
  }
  if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
    showMsg("err", "Renseigne SUPABASE_URL et SUPABASE_KEY (sb_publishable) dans assets/js/admin.js");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // DOM refs (match admin.html)
  const loginBox  = $("login-box");
  const loginForm = $("login-form");
  const emailInp  = $("login-email");
  const passInp   = $("login-password");
  const logoutBtn = $("logoutBtn");
  const refreshBtn= $("refreshBtn");
  const qInp      = $("q");
  const statusSel = $("status");
  const ordersBox = $("orders");
  const whoami    = $("whoami");

  // Guard: if admin.html missing something, avoid crash
  if(!loginForm || !emailInp || !passInp || !ordersBox){
    showMsg("err", "admin.html ne contient pas les éléments attendus (login-form / login-email / login-password / orders).");
    return;
  }

  function setLoggedOutUI(){
    if(loginBox) loginBox.style.display = "block";
    if(whoami) whoami.textContent = "Non connecté";
    if(logoutBtn) logoutBtn.style.display = "none";
    if(refreshBtn) refreshBtn.disabled = true;
    ordersBox.innerHTML = `<p class="muted">Connecte-toi pour voir les commandes.</p>`;
  }

  function setLoggedInUI(userEmail){
    if(loginBox) loginBox.style.display = "none";
    if(whoami) whoami.textContent = userEmail || "Connecté";
    if(logoutBtn) logoutBtn.style.display = "inline-flex";
    if(refreshBtn) refreshBtn.disabled = false;
  }

  async function requireAdmin(user){
    // On vérifie la colonne is_admin dans public.profiles
    const prof = await sb.from("profiles")
      .select("id,email,is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if(prof.error){
      throw new Error("Impossible de lire profiles. Vérifie: table profiles + colonne is_admin + policies RLS.");
    }
    if(!prof.data?.is_admin){
      throw new Error("Accès refusé: ton compte n'est pas admin (profiles.is_admin = false).");
    }
    return true;
  }

  async function loadOrders(){
    hideMsg();
    ordersBox.innerHTML = `<p class="muted">Chargement…</p>`;

    // 1) fetch orders (basic)
    let query = sb
      .from("orders")
      .select("id,user_id,status,currency,subtotal_cents,shipping_cents,total_cents,shipping_method,note,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const status = (statusSel?.value || "").trim();
    if(status) query = query.eq("status", status);

    const { data: orders, error: e1 } = await query;
    if(e1) throw e1;

    if(!orders || orders.length === 0){
      ordersBox.innerHTML = `<p class="muted">Aucune commande.</p>`;
      return;
    }

    const q = (qInp?.value || "").trim().toLowerCase();

    // 2) fetch items for all orders
    const orderIds = orders.map(o => o.id);
    const { data: items, error: e2 } = await sb
      .from("order_items")
      .select("order_id,product_name,option_label,qty,unit_price_cents,line_total_cents")
      .in("order_id", orderIds);
    if(e2) throw e2;

    // 3) fetch addresses for all orders (shipping only)
    const { data: addrs, error: e3 } = await sb
      .from("addresses")
      .select("order_id,type,first_name,last_name,company,country,address1,address2,city,postal_code,email,phone")
      .in("order_id", orderIds);
    if(e3) throw e3;

    // 4) fetch profiles for all users (nice display)
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    let profiles = [];
    if(userIds.length){
      const { data, error } = await sb
        .from("profiles")
        .select("id,email,first_name,last_name,phone")
        .in("id", userIds);
      if(error) throw error;
      profiles = data || [];
    }
    const profById = Object.fromEntries((profiles||[]).map(p => [p.id, p]));

    const itemsByOrder = {};
    (items || []).forEach(it => {
      (itemsByOrder[it.order_id] ||= []).push(it);
    });

    const shipAddrByOrder = {};
    (addrs || []).forEach(a => {
      if(a.type === "shipping") shipAddrByOrder[a.order_id] = a;
    });

    // 5) filter by search (email / id / produit)
    const filtered = !q ? orders : orders.filter(o => {
      const p = profById[o.user_id];
      const email = (p?.email || "").toLowerCase();
      const id = (o.id || "").toLowerCase();
      const hasProduct = (itemsByOrder[o.id] || []).some(it => (it.product_name || "").toLowerCase().includes(q));
      return email.includes(q) || id.includes(q) || hasProduct;
    });

    if(filtered.length === 0){
      ordersBox.innerHTML = `<p class="muted">Aucun résultat pour “${escapeHtml(q)}”.</p>`;
      return;
    }

    ordersBox.innerHTML = filtered.map(o => {
      const p = profById[o.user_id] || {};
      const addr = shipAddrByOrder[o.id] || {};
      const its = itemsByOrder[o.id] || [];

      const clientName = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Client";
      const clientEmail = p.email || "";
      const clientPhone = p.phone || "";

      const addrLine = [
        [addr.address1, addr.address2].filter(Boolean).join(" "),
        [addr.postal_code, addr.city].filter(Boolean).join(" "),
        addr.country
      ].filter(Boolean).join(" • ");

      const itemsHtml = its.map(it => `
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div>
            <strong>${escapeHtml(it.product_name)}</strong>
            <div class="muted" style="font-size:.9rem">
              ${it.option_label ? escapeHtml(it.option_label) + " • " : ""}x ${Number(it.qty||1)}
            </div>
          </div>
          <div style="white-space:nowrap;font-weight:900">${euroFromCents(it.line_total_cents)}</div>
        </div>
      `).join("");

      return `
        <article class="card" style="padding:14px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <div class="pill outline">#${escapeHtml(o.id)}</div>
              <div style="font-weight:900;margin-top:8px">${escapeHtml(clientName)} <span class="muted" style="font-weight:600">(${escapeHtml(clientEmail)})</span></div>
              ${clientPhone ? `<div class="muted">${escapeHtml(clientPhone)}</div>` : ""}
              <div class="muted" style="margin-top:6px">${escapeHtml(fmtDate(o.created_at))} • statut: <strong>${escapeHtml(o.status)}</strong></div>
            </div>
            <div style="text-align:right">
              <div style="font-size:1.05rem;font-weight:1000">${euroFromCents(o.total_cents)}</div>
              <div class="muted" style="font-size:.9rem">Sous-total ${euroFromCents(o.subtotal_cents)} • Livraison ${euroFromCents(o.shipping_cents)}</div>
              <div class="muted" style="font-size:.9rem">${escapeHtml(o.shipping_method || "")}</div>
            </div>
          </div>

          <div style="margin-top:12px;display:grid;gap:10px">
            <div style="padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.03)">
              ${itemsHtml || `<div class="muted">Aucun article</div>`}
            </div>

            <div style="padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.03)">
              <div style="font-weight:900;margin-bottom:6px">Livraison</div>
              <div class="muted">${escapeHtml(addrLine || "—")}</div>
            </div>

            ${o.note ? `
            <div style="padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.03)">
              <div style="font-weight:900;margin-bottom:6px">Note</div>
              <div class="muted">${escapeHtml(o.note)}</div>
            </div>` : ``}
          </div>
        </article>
      `;
    }).join("");
  }

  async function boot(){
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData?.session?.user;

    if(!user){
      setLoggedOutUI();
      return;
    }

    await requireAdmin(user);

    setLoggedInUI(user.email);
    await loadOrders();
  }

  // Events
  if(refreshBtn){
    refreshBtn.addEventListener("click", (e) => {
      e.preventDefault();
      boot().catch(err => showMsg("err", escapeHtml(err?.message || "Erreur")));
    });
  }
  if(qInp){
    qInp.addEventListener("input", () => loadOrders().catch(err => showMsg("err", escapeHtml(err?.message || "Erreur"))));
  }
  if(statusSel){
    statusSel.addEventListener("change", () => loadOrders().catch(err => showMsg("err", escapeHtml(err?.message || "Erreur"))));
  }
  if(logoutBtn){
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await sb.auth.signOut();
      setLoggedOutUI();
      showMsg("ok", "Déconnecté ✔");
    });
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const email = (emailInp.value || "").trim().toLowerCase();
    const password = passInp.value || "";
    if(!email || !password){
      showMsg("err", "Email et mot de passe requis.");
      return;
    }

    try{
      const res = await sb.auth.signInWithPassword({ email, password });
      if(res.error) throw res.error;

      const { data } = await sb.auth.getSession();
      const user = data?.session?.user;
      if(!user) throw new Error("Session introuvable après connexion.");

      await requireAdmin(user);

      setLoggedInUI(user.email);
      await loadOrders();
      showMsg("ok", "Connecté ✔");
    }catch(err){
      console.error(err);
      showMsg("err", escapeHtml(err?.message || "Erreur de connexion."));
      setLoggedOutUI();
    }
  });

  // initial
  try{
    await boot();
  }catch(err){
    console.error(err);
    showMsg("err", escapeHtml(err?.message || "Erreur"));
    setLoggedOutUI();
  }

  // keep UI synced on auth changes
  sb.auth.onAuthStateChange((_event, session) => {
    if(!session?.user){
      setLoggedOutUI();
    }
  });
}
