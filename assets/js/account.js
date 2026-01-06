/* =========================================
   Account (Client) — Supabase Auth + Orders
   - Login / Signup
   - Upsert profile (first/last/phone)
   - List own orders
   ========================================= */

const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
// IMPORTANT: utilise sb_publishable_..., PAS sb_secret
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAccount;
  document.head.appendChild(s);
})();

function $(id){ return document.getElementById(id); }

function showMsg(type, html){
  const box = $("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `
    <div style="font-weight:900;margin-bottom:6px">${type === "ok" ? "OK" : "Erreur"}</div>
    <div class="muted">${html}</div>
  `;
  box.style.border = "1px solid rgba(255,255,255,.14)";
  box.style.borderRadius = "12px";
  box.style.padding = "12px";
  box.style.background = type === "ok" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)";
}

function hideMsg(){
  const box = $("msg");
  if(!box) return;
  box.style.display = "none";
  box.innerHTML = "";
}

function euroCents(c){ return (Number(c||0)/100).toFixed(2).replace(".", ",") + " €"; }
function fmtDate(iso){
  try { return new Date(iso).toLocaleString("fr-FR"); } catch { return iso; }
}

async function initAccount(){
  if(!window.supabase){
    showMsg("err", "Supabase n’a pas chargé (CDN).");
    return;
  }
  if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
    showMsg("err", "Renseigne SUPABASE_URL et SUPABASE_KEY (sb_publishable) dans assets/js/account.js");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // UI refs
  const form = $("auth-form");
  const btn = $("submit-btn");
  const logoutBtn = $("logout-btn");
  const dash = $("dash");

  const modeRadios = document.querySelectorAll('input[name="mode"]');
  function currentMode(){
    return document.querySelector('input[name="mode"]:checked')?.value || "login";
  }
  function syncMode(){
    const m = currentMode();
    btn.textContent = (m === "signup") ? "Créer le compte" : "Se connecter";
  }
  modeRadios.forEach(r => r.addEventListener("change", syncMode));
  syncMode();

  // Cart count (si store.js le gère)
  try { if(typeof updateCartCount === "function") updateCartCount(); } catch(e){}

  async function refreshSessionUI(){
    hideMsg();
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user;

    if(!user){
      dash.style.display = "none";
      logoutBtn.style.display = "none";
      btn.disabled = false;
      btn.textContent = (currentMode() === "signup") ? "Créer le compte" : "Se connecter";
      return;
    }

    logoutBtn.style.display = "inline-flex";
    dash.style.display = "block";

    // Load profile
    const prof = await sb.from("profiles").select("email, first_name, last_name, phone, admin").eq("id", user.id).single();
    const p = prof.data || {};
    $("me-line").textContent = `${p.email || user.email} • ${p.first_name || ""} ${p.last_name || ""} ${p.phone ? "• " + p.phone : ""}`.trim();

    await loadMyOrders(user.id);
  }

  async function loadMyOrders(userId){
    const list = $("orders-list");
    const empty = $("orders-empty");
    list.innerHTML = "";

    const res = await sb
      .from("orders")
      .select("id, status, currency, subtotal_cents, shipping_cents, total_cents, shipping_method, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if(res.error){
      showMsg("err", "Impossible de charger tes commandes (RLS/Policies).<br>" + (res.error.message || ""));
      return;
    }

    const orders = res.data || [];
    if(orders.length === 0){
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    orders.forEach(o => {
      const el = document.createElement("div");
      el.className = "card";
      el.innerHTML = `
        <div class="pad">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
            <div>
              <div style="font-weight:900">Commande #${o.id.slice(0,8).toUpperCase()}</div>
              <div class="muted">${fmtDate(o.created_at)} • Statut: <strong>${o.status}</strong> • Livraison: ${o.shipping_method || "-"}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:900">${euroCents(o.total_cents)}</div>
              <button class="btn ghost" data-order="${o.id}" type="button">Voir détail</button>
            </div>
          </div>
          ${o.note ? `<div class="muted" style="margin-top:8px">Note: ${escapeHtml(o.note)}</div>` : ""}
        </div>
      `;
      list.appendChild(el);
    });

    list.querySelectorAll("button[data-order]").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.getAttribute("data-order");
        await openOrderDetail(id);
      });
    });
  }

  async function openOrderDetail(orderId){
    const wrap = $("order-detail");
    wrap.style.display = "block";
    $("detail-items").innerHTML = "";
    $("detail-meta").textContent = "Chargement…";
    $("detail-addr").textContent = "";
    $("detail-total").textContent = "";

    // order
    const oRes = await sb
      .from("orders")
      .select("id, status, total_cents, shipping_cents, subtotal_cents, shipping_method, created_at")
      .eq("id", orderId)
      .single();

    if(oRes.error){
      showMsg("err", "Impossible de charger la commande.<br>" + (oRes.error.message || ""));
      return;
    }
    const o = oRes.data;

    // items
    const iRes = await sb
      .from("order_items")
      .select("product_name, option_label, qty, line_total_cents")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    // addresses (shipping)
    const aRes = await sb
      .from("addresses")
      .select("type, first_name, last_name, address1, address2, city, postal_code, country, phone, email")
      .eq("order_id", orderId);

    $("detail-meta").textContent =
      `ID: ${o.id} • ${fmtDate(o.created_at)} • Statut: ${o.status} • Livraison: ${o.shipping_method || "-"}`;

    if(iRes.error){
      $("detail-items").innerHTML = `<tr><td colspan="2" class="muted" style="padding:10px">Erreur items: ${escapeHtml(iRes.error.message||"")}</td></tr>`;
    } else {
      $("detail-items").innerHTML = (iRes.data || []).map(it => {
        const label = [it.product_name, it.option_label ? `(${it.option_label})` : "", `x${it.qty}`].filter(Boolean).join(" ");
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10)">${escapeHtml(label)}</td>
            <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10);text-align:right;font-weight:900">${euroCents(it.line_total_cents)}</td>
          </tr>
        `;
      }).join("") || `<tr><td colspan="2" class="muted" style="padding:10px">Aucun item</td></tr>`;
    }

    // address render
    if(!aRes.error){
      const shipping = (aRes.data || []).find(x => x.type === "shipping") || (aRes.data || [])[0];
      if(shipping){
        $("detail-addr").innerHTML = `
          <div style="font-weight:900;margin-bottom:6px">Adresse livraison</div>
          <div class="muted">
            ${escapeHtml(shipping.first_name||"")} ${escapeHtml(shipping.last_name||"")}<br>
            ${escapeHtml(shipping.address1||"")}<br>
            ${shipping.address2 ? escapeHtml(shipping.address2) + "<br>" : ""}
            ${escapeHtml(shipping.postal_code||"")} ${escapeHtml(shipping.city||"")}<br>
            ${escapeHtml(shipping.country||"")}<br>
            ${shipping.phone ? "📞 " + escapeHtml(shipping.phone) + "<br>" : ""}
            ✉️ ${escapeHtml(shipping.email||"")}
          </div>
        `;
      }
    }

    $("detail-total").textContent = `Total: ${euroCents(o.total_cents)} (Sous-total ${euroCents(o.subtotal_cents)} + Livraison ${euroCents(o.shipping_cents)})`;
  }

  $("close-detail").addEventListener("click", () => {
    $("order-detail").style.display = "none";
  });

  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    showMsg("ok", "Déconnecté ✔");
    await refreshSessionUI();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();
    btn.disabled = true;

    try{
      const email = $("email").value.trim().toLowerCase();
      const password = $("password").value;
      const first_name = $("first_name").value.trim();
      const last_name = $("last_name").value.trim();
      const phone = $("phone").value.trim();

      if(!email || !password) throw new Error("Email et mot de passe requis.");

      const mode = currentMode();

      if(mode === "signup"){
        const res = await sb.auth.signUp({ email, password });
        if(res.error) throw res.error;

        // si confirm email est ON, session peut être null : on tente login direct pour dev
        const { data: ses } = await sb.auth.getSession();
        if(!ses?.session){
          const login = await sb.auth.signInWithPassword({ email, password });
          if(login.error) throw login.error;
        }
      } else {
        const res = await sb.auth.signInWithPassword({ email, password });
        if(res.error) throw res.error;
      }

      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData?.session?.user;
      if(!user) throw new Error("Session introuvable. (Confirm email activé ?)");

      // upsert profile (safe)
      const up = await sb.from("profiles").upsert({
        id: user.id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null
      }, { onConflict: "id" });

      if(up.error) throw up.error;

      showMsg("ok", "Connecté ✔");
      await refreshSessionUI();

    } catch(err){
      showMsg("err", escapeHtml(err?.message || "Erreur inconnue"));
    } finally {
      btn.disabled = false;
      syncMode();
    }
  });

  // auto refresh on load
  await refreshSessionUI();
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
