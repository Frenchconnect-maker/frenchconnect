
/* =========================================
   Admin Orders — Supabase
   - Login
   - Check profiles.admin = true
   - List all orders
   - Detail: items + shipping address
   - Update status
   ========================================= */

const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
// IMPORTANT: utilise sb_publishable_..., PAS sb_secret
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAdmin;
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
function fmtDate(iso){ try { return new Date(iso).toLocaleString("fr-FR"); } catch { return iso; } }

async function initAdmin(){
  if(!window.supabase){
    showMsg("err", "Supabase n’a pas chargé (CDN).");
    return;
  }
  if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
    showMsg("err", "Renseigne SUPABASE_URL et SUPABASE_KEY (sb_publishable) dans assets/js/admin.js");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Cart count
  try { if(typeof updateCartCount === "function") updateCartCount(); } catch(e){}

  const loginForm = $("login-form");
  const loginBtn = $("login-btn");
  const logoutBtn = $("logout-btn");
  const refreshBtn = $("refresh-btn");
  const panel = $("panel");
  const adminInfo = $("admin-info");

  let currentAdminId = null;
  let currentDetailOrderId = null;

  async function verifyAdmin(user){
    const prof = await sb
      .from("profiles")
      .select("email, first_name, last_name, admin, is_admin")
      .eq("id", user.id)
      .single();

    if(prof.error) throw prof.error;
    if(!(prof.data?.admin || prof.data?.is_admin)) return { ok:false, profile: prof.data };
    return { ok:true, profile: prof.data };
  }

  async function refreshUI(){
    hideMsg();
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user;

    if(!user){
      panel.style.display = "none";
      logoutBtn.style.display = "none";
      refreshBtn.style.display = "none";
      adminInfo.style.display = "none";
      currentAdminId = null;
      return;
    }

    const v = await verifyAdmin(user);
    if(!v.ok){
      panel.style.display = "none";
      logoutBtn.style.display = "inline-flex";
      refreshBtn.style.display = "none";
      adminInfo.style.display = "block";
      adminInfo.textContent = `Connecté en tant que ${v.profile?.email || user.email} — Accès refusé (pas admin).`;
      showMsg("err", "Accès refusé : ce compte n’est pas admin (profiles.admin = false).");
      return;
    }

    currentAdminId = user.id;
    adminInfo.style.display = "block";
    adminInfo.textContent = `Admin : ${v.profile?.email || user.email}`;
    logoutBtn.style.display = "inline-flex";
    refreshBtn.style.display = "inline-flex";
    panel.style.display = "block";

    await loadAllOrders();
  }

  async function loadAllOrders(){
    const rows = $("rows");
    rows.innerHTML = `<tr><td colspan="5" class="muted" style="padding:10px">Chargement…</td></tr>`;

    // récupère toutes les commandes
    const res = await sb
      .from("orders")
      .select("id, user_id, status, total_cents, currency, created_at")
      .order("created_at", { ascending: false });

    if(res.error){
      showMsg("err", "Impossible de charger les commandes (RLS/Policies admin manquantes).<br>" + escapeHtml(res.error.message||""));
      rows.innerHTML = "";
      return;
    }

    const orders = res.data || [];
    $("count").textContent = `${orders.length} commande(s)`;

    // on récupère les emails via profiles en une fois
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    let profilesById = {};
    if(userIds.length){
      const pRes = await sb.from("profiles").select("id, email, first_name, last_name, phone").in("id", userIds);
      if(!pRes.error){
        (pRes.data||[]).forEach(p => { profilesById[p.id] = p; });
      }
    }

    rows.innerHTML = orders.map(o => {
      const p = profilesById[o.user_id] || {};
      const who = (p.email || o.user_id || "-");
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
      const clientLine = `${escapeHtml(who)}${name ? "<br><span class='muted'>" + escapeHtml(name) + "</span>" : ""}`;

      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10)">${escapeHtml(fmtDate(o.created_at))}</td>
          <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10)">${clientLine}</td>
          <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10)"><strong>${escapeHtml(o.status||"")}</strong></td>
          <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10);text-align:right;font-weight:900">${euroCents(o.total_cents)}</td>
          <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10);text-align:right">
            <button class="btn ghost" data-view="${o.id}" type="button">Détail</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="5" class="muted" style="padding:10px">Aucune commande.</td></tr>`;

    document.querySelectorAll("button[data-view]").forEach(b => {
      b.addEventListener("click", async () => {
        await openDetail(b.getAttribute("data-view"));
      });
    });
  }

  async function openDetail(orderId){
    currentDetailOrderId = orderId;
    $("detail").style.display = "block";
    $("meta").textContent = "Chargement…";
    $("items").innerHTML = "";
    $("addr").innerHTML = "";
    $("total").textContent = "";
    $("status-msg").textContent = "";

    const oRes = await sb
      .from("orders")
      .select("id, user_id, status, subtotal_cents, shipping_cents, total_cents, shipping_method, created_at, note")
      .eq("id", orderId)
      .single();

    if(oRes.error){
      showMsg("err", "Erreur détail commande: " + escapeHtml(oRes.error.message||""));
      return;
    }
    const o = oRes.data;

    const iRes = await sb
      .from("order_items")
      .select("product_name, option_label, qty, line_total_cents")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    const aRes = await sb
      .from("addresses")
      .select("type, first_name, last_name, address1, address2, city, postal_code, country, phone, email")
      .eq("order_id", orderId);

    $("meta").innerHTML =
      `ID: <strong>${escapeHtml(o.id)}</strong> • ${escapeHtml(fmtDate(o.created_at))} • Statut: <strong>${escapeHtml(o.status)}</strong> • Livraison: ${escapeHtml(o.shipping_method||"-")}
      ${o.note ? `<br><span class="muted">Note: ${escapeHtml(o.note)}</span>` : ""}`;

    if(iRes.error){
      $("items").innerHTML = `<tr><td colspan="2" class="muted" style="padding:10px">Erreur items: ${escapeHtml(iRes.error.message||"")}</td></tr>`;
    } else {
      $("items").innerHTML = (iRes.data || []).map(it => {
        const label = [it.product_name, it.option_label ? `(${it.option_label})` : "", `x${it.qty}`].filter(Boolean).join(" ");
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10)">${escapeHtml(label)}</td>
            <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.10);text-align:right;font-weight:900">${euroCents(it.line_total_cents)}</td>
          </tr>
        `;
      }).join("") || `<tr><td colspan="2" class="muted" style="padding:10px">Aucun item</td></tr>`;
    }

    if(!aRes.error){
      const shipping = (aRes.data || []).find(x => x.type === "shipping") || (aRes.data || [])[0];
      if(shipping){
        $("addr").innerHTML = `
          <div style="font-weight:900;margin-bottom:6px">Adresse</div>
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

    $("total").textContent =
      `Total: ${euroCents(o.total_cents)} (Sous-total ${euroCents(o.subtotal_cents)} + Livraison ${euroCents(o.shipping_cents)})`;
  }

  async function setStatus(newStatus){
    if(!currentDetailOrderId) return;
    $("status-msg").textContent = "Mise à jour…";

    const res = await sb
      .from("orders")
      .update({ status: newStatus })
      .eq("id", currentDetailOrderId);

    if(res.error){
      $("status-msg").textContent = "Erreur: " + (res.error.message || "");
      return;
    }
    $("status-msg").textContent = "Statut mis à jour ✔";
    await openDetail(currentDetailOrderId);
    await loadAllOrders();
  }

  $("close-detail").addEventListener("click", () => {
    $("detail").style.display = "none";
    currentDetailOrderId = null;
  });

  document.querySelectorAll("#detail button[data-status]").forEach(b => {
    b.addEventListener("click", async () => {
      await setStatus(b.getAttribute("data-status"));
    });
  });

  refreshBtn.addEventListener("click", async () => {
    await loadAllOrders();
  });

  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    showMsg("ok", "Déconnecté ✔");
    await refreshUI();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();
    loginBtn.disabled = true;
    loginBtn.textContent = "Connexion…";

    try{
      const email = $("email").value.trim().toLowerCase();
      const password = $("password").value;
      const res = await sb.auth.signInWithPassword({ email, password });
      if(res.error) throw res.error;

      showMsg("ok", "Connecté ✔");
      await refreshUI();

    } catch(err){
      const rawMsg = (err?.message || "Erreur de connexion");
      const lower = rawMsg.toLowerCase();
      const nice = (lower.includes("email not confirmed") || lower.includes("not confirmed"))
        ? "Email non confirmé : ouvre ton mail de confirmation Supabase puis reconnecte-toi."
        : rawMsg;
      showMsg("err", escapeHtml(nice));
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Se connecter";
    }
  });

  await refreshUI();
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
