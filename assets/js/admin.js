// ============================
// ADMIN COMMANDES (Supabase)
// Sécurisé via RLS + profiles.is_admin
// ============================

const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_TA_CLE_ICI"; // <-- ta publishable key

(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAdmin;
  document.head.appendChild(s);
})();

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function euroFromCents(c){
  const n = (Number(c||0)/100);
  return n.toFixed(2).replace(".", ",") + " €";
}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }catch(e){ return iso || ""; }
}
function showMsg(type, html){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `<div class="${type==="ok" ? "ok":"danger"}" style="font-weight:900;margin-bottom:6px;">${type==="ok" ? "OK":"Erreur"}</div><div>${html}</div>`;
}
function hideMsg(){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

function statusTag(status){
  const s = (status || "new").toLowerCase();
  if(s.includes("new")) return `<span class="tag new">NEW</span>`;
  if(s.includes("paid")) return `<span class="tag paid">PAID</span>`;
  if(s.includes("ship")) return `<span class="tag shipped">SHIPPED</span>`;
  if(s.includes("cancel")) return `<span class="tag cancelled">CANCELLED</span>`;
  return `<span class="tag">${escapeHtml(status || "—")}</span>`;
}

async function initAdmin(){
  if(!window.supabase){
    showMsg("err","Supabase n’a pas chargé.");
    return;
  }
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const who = document.getElementById("whoami");
  const loginBox = document.getElementById("login-box");
  const logoutBtn = document.getElementById("logoutBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const qEl = document.getElementById("q");
  const statusEl = document.getElementById("status");

  // session ?
  const { data: sess } = await sb.auth.getSession();
  const user = sess?.session?.user;

  // Branch login form
  const form = document.getElementById("login-form");
  if(form){
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const email = document.getElementById("login-email").value.trim().toLowerCase();
      const password = document.getElementById("login-password").value;

      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(error){ showMsg("err", escapeHtml(error.message)); return; }
      location.reload();
    });
  }

  if(!user){
    if(who) who.innerHTML = "Non connecté (admin).";
    if(loginBox) loginBox.style.display = "block";
    showMsg("err","Connecte-toi avec ton compte admin.");
    return;
  }

  // check is_admin
  const prof = await sb.from("profiles").select("is_admin, email").eq("id", user.id).single();
  if(prof.error){
    showMsg("err","Impossible de lire le profil admin (RLS).<br>" + escapeHtml(prof.error.message));
    return;
  }
  if(!prof.data?.is_admin){
    if(who) who.innerHTML = `Connecté : <strong>${escapeHtml(user.email||"")}</strong>`;
    showMsg("err","Accès refusé : ton compte n’est pas admin (profiles.is_admin = false).");
    return;
  }

  if(loginBox) loginBox.style.display = "none";
  if(who) who.innerHTML = `Admin : <strong>${escapeHtml(user.email||"")}</strong>`;
  if(logoutBtn){
    logoutBtn.style.display = "";
    logoutBtn.onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }

  async function loadOrders(){
    hideMsg();

    const status = (statusEl?.value || "").trim();
    const q = (qEl?.value || "").trim().toLowerCase();

    // 1) charge les orders (les plus récents)
    let req = sb
      .from("orders")
      .select("id, user_id, status, currency, subtotal_cents, shipping_cents, total_cents, shipping_method, note, created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    if(status) req = req.eq("status", status);

    const res = await req;
    if(res.error){
      showMsg("err","Lecture orders impossible (RLS).<br>" + escapeHtml(res.error.message));
      return;
    }

    let orders = res.data || [];
    if(orders.length === 0){
      document.getElementById("orders").innerHTML = "";
      showMsg("ok","Aucune commande.");
      return;
    }

    // 2) charge items & adresses associés
    const ids = orders.map(o => o.id);

    const itemsRes = await sb
      .from("order_items")
      .select("order_id, product_name, option_label, qty, unit_price_cents, line_total_cents")
      .in("order_id", ids);

    const addrRes = await sb
      .from("addresses")
      .select("order_id, type, first_name, last_name, email, phone, country, city, postal_code, address1")
      .in("order_id", ids);

    // 3) map
    const itemsBy = new Map();
    (itemsRes.data || []).forEach(it => {
      if(!itemsBy.has(it.order_id)) itemsBy.set(it.order_id, []);
      itemsBy.get(it.order_id).push(it);
    });

    const shipBy = new Map();
    (addrRes.data || []).forEach(a => {
      if(a.type === "shipping") shipBy.set(a.order_id, a);
    });

    // 4) filtre recherche (email, id, produit)
    if(q){
      orders = orders.filter(o => {
        const ship = shipBy.get(o.id);
        const items = itemsBy.get(o.id) || [];
        const hay = [
          o.id,
          o.status,
          ship?.email,
          ship?.first_name,
          ship?.last_name,
          ship?.city,
          ...items.map(i => i.product_name),
          ...items.map(i => i.option_label || "")
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    renderOrders(orders, itemsBy, shipBy);
  }

  refreshBtn?.addEventListener("click", loadOrders);
  qEl?.addEventListener("input", () => { loadOrders(); });
  statusEl?.addEventListener("change", loadOrders);

  await loadOrders();

  // refresh auto (simple) toutes les 20s
  setInterval(loadOrders, 20000);
}

function renderOrders(orders, itemsBy, shipBy){
  const box = document.getElementById("orders");
  if(!box) return;

  box.innerHTML = orders.map(o => {
    const ship = shipBy.get(o.id);
    const items = itemsBy.get(o.id) || [];

    const shipLine = ship
      ? `${escapeHtml(ship.first_name||"")} ${escapeHtml(ship.last_name||"")} • ${escapeHtml(ship.email||"")} • ${escapeHtml(ship.phone||"")}<br>
         ${escapeHtml(ship.address1||"")} • ${escapeHtml(ship.postal_code||"")} ${escapeHtml(ship.city||"")} • ${escapeHtml(ship.country||"")}`
      : `<span class="muted-sm">Adresse shipping non trouvée</span>`;

    const itemsHtml = items.length ? `
      <div class="items">
        ${items.map(it => `
          <div class="item">
            <div>
              <strong>${escapeHtml(it.product_name||"Produit")}</strong>
              <div class="muted-sm">${it.option_label ? escapeHtml(it.option_label) + " • " : ""}x ${Number(it.qty||1)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:900">${euroFromCents(it.line_total_cents)}</div>
              <div class="muted-sm">${euroFromCents(it.unit_price_cents)} / u</div>
            </div>
          </div>
        `).join("")}
      </div>
    ` : `<div class="muted-sm">Aucun item</div>`;

    return `
      <section class="panel-card">
        <div class="hd">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            ${statusTag(o.status)}
            <strong>Commande #${escapeHtml(o.id)}</strong>
            <span class="muted-sm">• ${escapeHtml(fmtDate(o.created_at))}</span>
          </div>
          <div style="font-weight:900">Total: ${euroFromCents(o.total_cents)}</div>
        </div>
        <div class="bd">
          <div class="muted-sm"><strong>Livraison:</strong><br>${shipLine}</div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-top:10px;">
            <div class="muted-sm">
              Sous-total: <strong>${euroFromCents(o.subtotal_cents)}</strong> •
              Livraison: <strong>${euroFromCents(o.shipping_cents)}</strong> •
              Méthode: <strong>${escapeHtml(o.shipping_method||"—")}</strong>
            </div>
          </div>

          ${itemsHtml}

          ${o.note ? `<div class="notice muted-sm" style="margin-top:10px;"><strong>Note:</strong> ${escapeHtml(o.note)}</div>` : ""}
        </div>
      </section>
    `;
  }).join("");
}
