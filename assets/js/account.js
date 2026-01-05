/* ======================================================
   ACCOUNT — Mes commandes (Supabase)
   - Liste orders du user connecté
   - Détail order_items
   - Déconnexion
   ====================================================== */

// ✅ Mets TA publishable key (PAS secret)
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM"; // <-- remplace

(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAccount;
  document.head.appendChild(s);
})();

function euroFromCents(cents){
  const n = (Number(cents || 0) / 100);
  return n.toFixed(2).replace(".", ",") + " €";
}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }catch(e){ return iso || ""; }
}
function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function showMsg(type, html){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `<div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">${type === "ok" ? "OK" : "Erreur"}</div><div>${html}</div>`;
}
function hideMsg(){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

async function initAccount(){
  if(!window.supabase){
    showMsg("err","Supabase n’a pas chargé (CDN).");
    return;
  }
  if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
    showMsg("err","Renseigne SUPABASE_URL et SUPABASE_KEY (publishable) dans assets/js/account.js.");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Qui est connecté ?
  const { data: sess } = await sb.auth.getSession();
  const user = sess?.session?.user;

  const who = document.getElementById("whoami");
  const logoutBtn = document.getElementById("logoutBtn");

  if(!user){
    if(who) who.innerHTML = `Non connecté.`;
    showMsg("err", `Tu dois être connecté pour voir tes commandes.<br><br>
      ➜ Va sur <a href="checkout.html" style="color:#fff;text-decoration:underline;">checkout</a> et choisis <strong>« J’ai déjà un compte »</strong>.`);
    renderEmpty();
    return;
  }

  if(who) who.innerHTML = `Connecté : <strong>${escapeHtml(user.email || "")}</strong>`;
  if(logoutBtn){
    logoutBtn.style.display = "";
    logoutBtn.onclick = async () => {
      await sb.auth.signOut();
      location.reload();
    };
  }

  // Charge orders du user
  // Important : RLS doit autoriser SELECT where user_id = auth.uid()
  const ordersRes = await sb
    .from("orders")
    .select("id, status, currency, subtotal_cents, shipping_cents, total_cents, shipping_method, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if(ordersRes.error){
    showMsg("err", "Impossible de lire les commandes (RLS/policies).<br>" + escapeHtml(ordersRes.error.message));
    renderEmpty();
    return;
  }

  const orders = ordersRes.data || [];
  if(orders.length === 0){
    hideMsg();
    showMsg("ok","Aucune commande pour le moment. 🔥");
    renderEmpty();
    return;
  }

  // Récupère tous les items de ces commandes en 1 fois
  const orderIds = orders.map(o => o.id);
  const itemsRes = await sb
    .from("order_items")
    .select("order_id, product_name, option_label, qty, unit_price_cents, line_total_cents")
    .in("order_id", orderIds)
    .order("order_id", { ascending: false });

  if(itemsRes.error){
    showMsg("err", "Commandes OK mais items bloqués (RLS/policies).<br>" + escapeHtml(itemsRes.error.message));
  }

  const items = itemsRes.data || [];
  const byOrder = new Map();
  items.forEach(it => {
    if(!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
    byOrder.get(it.order_id).push(it);
  });

  renderOrders(orders, byOrder);
}

function renderEmpty(){
  const box = document.getElementById("orders");
  if(box) box.innerHTML = "";
}

function statusTag(status){
  const s = (status || "new").toLowerCase();
  if(s.includes("new")) return `<span class="tag new">NEW</span>`;
  if(s.includes("paid")) return `<span class="tag paid">PAID</span>`;
  if(s.includes("ship")) return `<span class="tag shipped">SHIPPED</span>`;
  if(s.includes("cancel")) return `<span class="tag cancelled">CANCELLED</span>`;
  return `<span class="tag">${escapeHtml(status || "—")}</span>`;
}

function renderOrders(orders, byOrder){
  const box = document.getElementById("orders");
  if(!box) return;

  box.innerHTML = orders.map(o => {
    const its = byOrder.get(o.id) || [];
    const itemsHtml = its.length
      ? `<div class="items">` + its.map(it => {
          const opt = it.option_label ? ` • ${escapeHtml(it.option_label)}` : "";
          return `
            <div class="item">
              <div>
                <strong>${escapeHtml(it.product_name || "Produit")}</strong>
                <div class="muted-sm">${opt} • x ${Number(it.qty || 1)}</div>
              </div>
              <div class="right">
                <div style="font-weight:900">${euroFromCents(it.line_total_cents)}</div>
                <div class="muted-sm">${euroFromCents(it.unit_price_cents)} / u</div>
              </div>
            </div>
          `;
        }).join("") + `</div>`
      : `<div class="muted-sm" style="margin-top:10px;">Aucun item trouvé.</div>`;

    const meta = `
      <div class="order-meta">
        ${statusTag(o.status)}
        <span>Commande: <strong>#${escapeHtml(o.id)}</strong></span>
        <span>•</span>
        <span>${escapeHtml(fmtDate(o.created_at))}</span>
      </div>
    `;

    const totals = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-top:10px;">
        <div class="muted-sm">
          Sous-total: <strong>${euroFromCents(o.subtotal_cents)}</strong> •
          Livraison: <strong>${euroFromCents(o.shipping_cents)}</strong> •
          Méthode: <strong>${escapeHtml(o.shipping_method || "—")}</strong>
        </div>
        <div style="font-weight:900;font-size:1.05rem;">
          Total: ${euroFromCents(o.total_cents)}
        </div>
      </div>
    `;

    const note = o.note ? `<div class="notice muted-sm" style="margin-top:10px;">Note: ${escapeHtml(o.note)}</div>` : "";

    return `
      <section class="panel-card">
        <div class="hd">
          <strong style="letter-spacing:.6px;text-transform:uppercase;">Commande</strong>
          <span class="muted-sm">${escapeHtml(o.currency || "EUR")}</span>
        </div>
        <div class="bd">
          ${meta}
          ${totals}
          ${itemsHtml}
          ${note}
        </div>
      </section>
    `;
  }).join("");
}
