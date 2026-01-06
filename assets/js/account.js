/* ======================================================
   ACCOUNT — Espace client (Supabase)
   - Login depuis account.html
   - Mot de passe oublié (envoi email)
   - Nouveau mot de passe (recovery)
   - Affiche profil + commandes du user
   ====================================================== */

const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initAccount;
  document.head.appendChild(s);
})();

const $ = (id) => document.getElementById(id);

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
  return (""+(s ?? "")).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}
function showMsg(type, html){
  const box = $("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `<div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">${type === "ok" ? "OK" : "Erreur"}</div><div>${html}</div>`;
}
function hideMsg(){
  const box = $("msg");
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

function showOnly(boxId){
  const ids = ["resetBox","loginBox","forgotBox","accountBox"];
  ids.forEach(id => {
    const el = $(id);
    if(el) el.style.display = (id === boxId) ? "" : "none";
  });
}

function hasRecoveryInHash(){
  // Supabase reset email renvoie souvent un hash du type:
  // #access_token=...&refresh_token=...&type=recovery
  const h = (window.location.hash || "").toLowerCase();
  return h.includes("type=recovery") || h.includes("recovery");
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

  // Store cart count if available
  try { if(typeof updateCartCount === "function") updateCartCount(); } catch(e){}

  // DOM
  const whoami     = $("whoami");
  const logoutBtn  = $("logoutBtn");

  const loginForm  = $("loginForm");
  const loginBtn   = $("loginBtn");
  const emailInp   = $("email");
  const passInp    = $("password");

  const forgotOpen = $("forgotOpen");
  const forgotBox  = $("forgotBox");
  const forgotForm = $("forgotForm");
  const forgotBtn  = $("forgotBtn");
  const forgotBack = $("forgotBack");
  const forgotEmail= $("forgot_email");

  const resetBox   = $("resetBox");
  const resetForm  = $("resetForm");
  const resetBtn   = $("resetBtn");
  const resetCancel= $("resetCancel");
  const newPass1   = $("new_password");
  const newPass2   = $("new_password2");

  function setLoggedOut(){
    if(whoami) whoami.textContent = "Non connecté.";
    if(logoutBtn) logoutBtn.style.display = "none";
    showOnly("loginBox");
  }

  function setLoggedIn(email){
    if(whoami) whoami.innerHTML = `Connecté : <strong>${escapeHtml(email || "")}</strong>`;
    if(logoutBtn) logoutBtn.style.display = "";
    showOnly("accountBox");
  }

  // logout
  if(logoutBtn){
    logoutBtn.onclick = async () => {
      await sb.auth.signOut();
      // Nettoie le hash au cas où
      if(location.hash) history.replaceState({}, "", location.pathname + location.search);
      location.reload();
    };
  }

  // UI: open forgot
  if(forgotOpen){
    forgotOpen.addEventListener("click", () => {
      hideMsg();
      if(forgotEmail && emailInp?.value) forgotEmail.value = emailInp.value.trim();
      showOnly("forgotBox");
    });
  }
  if(forgotBack){
    forgotBack.addEventListener("click", () => {
      hideMsg();
      showOnly("loginBox");
    });
  }

  // Forgot password: send email
  if(forgotForm){
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();
      forgotBtn.disabled = true;
      forgotBtn.textContent = "Envoi…";

      try{
        const email = (forgotEmail.value || "").trim().toLowerCase();
        if(!email) throw new Error("Email requis.");

        // important: redirect back to account.html
        const redirectTo = location.origin + location.pathname.replace(/\/[^/]*$/, "/account.html");

        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if(error) throw error;

        showMsg("ok", "Email envoyé ✅ Vérifie ta boîte mail (et les spams).");
      }catch(err){
        showMsg("err", escapeHtml(err?.message || "Erreur envoi email"));
      }finally{
        forgotBtn.disabled = false;
        forgotBtn.textContent = "Envoyer le lien";
      }
    });
  }

  // Reset password form (recovery)
  if(resetCancel){
    resetCancel.addEventListener("click", async () => {
      hideMsg();
      // On enlève le hash et on retourne au login
      if(location.hash) history.replaceState({}, "", location.pathname + location.search);
      showOnly("loginBox");
    });
  }

  if(resetForm){
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const p1 = newPass1.value || "";
      const p2 = newPass2.value || "";
      if(!p1 || p1.length < 6) { showMsg("err", "Mot de passe trop court (min 6)."); return; }
      if(p1 !== p2) { showMsg("err", "Les mots de passe ne correspondent pas."); return; }

      resetBtn.disabled = true;
      resetBtn.textContent = "Mise à jour…";

      try{
        // À l’ouverture du lien, supabase-js lit souvent les tokens dans le hash
        // et crée une session. On tente updateUser().
        const { data: sess } = await sb.auth.getSession();
        if(!sess?.session?.user){
          throw new Error("Session de récupération introuvable. Re-clique le lien reçu par email.");
        }

        const { error } = await sb.auth.updateUser({ password: p1 });
        if(error) throw error;

        showMsg("ok", "Mot de passe mis à jour ✅ Tu peux te connecter.");
        // Nettoie le hash
        if(location.hash) history.replaceState({}, "", location.pathname + location.search);
        showOnly("loginBox");
      }catch(err){
        showMsg("err", escapeHtml(err?.message || "Erreur mise à jour"));
      }finally{
        resetBtn.disabled = false;
        resetBtn.textContent = "Mettre à jour";
      }
    });
  }

  // Login form
  if(loginForm){
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      loginBtn.disabled = true;
      loginBtn.textContent = "Connexion…";

      try{
        const email = (emailInp.value || "").trim().toLowerCase();
        const password = passInp.value || "";
        if(!email || !password) throw new Error("Email et mot de passe requis.");

        const res = await sb.auth.signInWithPassword({ email, password });
        if(res.error) throw res.error;

        const { data } = await sb.auth.getSession();
        const user = data?.session?.user;
        if(!user) throw new Error("Session introuvable après connexion.");

        setLoggedIn(user.email);
        await hydrateProfile(sb, user.id, user.email);
        await hydrateOrders(sb, user.id);

        showMsg("ok", "Connexion OK ✔");
      }catch(err){
        showMsg("err", escapeHtml(err?.message || "Erreur connexion"));
        setLoggedOut();
      }finally{
        loginBtn.disabled = false;
        loginBtn.textContent = "Se connecter";
      }
    });
  }

  // ---- BOOT ----
  // Si l'utilisateur arrive via un lien reset password
  if(hasRecoveryInHash()){
    if(whoami) whoami.textContent = "Récupération en cours…";
    if(logoutBtn) logoutBtn.style.display = "none";
    showOnly("resetBox");
    showMsg("ok", "Définis ton nouveau mot de passe.");
    return;
  }

  // Session normale
  const { data: sess } = await sb.auth.getSession();
  const user = sess?.session?.user;

  if(!user){
    setLoggedOut();
    return;
  }

  setLoggedIn(user.email);
  await hydrateProfile(sb, user.id, user.email);
  await hydrateOrders(sb, user.id);

  // Sync auth
  sb.auth.onAuthStateChange((_evt, session) => {
    if(!session?.user){
      setLoggedOut();
    }
  });
}

async function hydrateProfile(sb, userId, email){
  const profRes = await sb
    .from("profiles")
    .select("first_name,last_name,phone,email")
    .eq("id", userId)
    .maybeSingle();

  const p = profRes.data || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ""; };

  setVal("p_first", p.first_name || "");
  setVal("p_last",  p.last_name  || "");
  setVal("p_phone", p.phone      || "");
  setVal("p_email", p.email || email || "");
}

async function hydrateOrders(sb, userId){
  const ordersBox = document.getElementById("orders");
  if(!ordersBox) return;

  ordersBox.innerHTML = `<p class="muted-sm">Chargement…</p>`;

  const ordersRes = await sb
    .from("orders")
    .select("id, status, currency, subtotal_cents, shipping_cents, total_cents, shipping_method, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if(ordersRes.error){
    ordersBox.innerHTML = "";
    showMsg("err", "Impossible de lire tes commandes (RLS/policies).<br>" + escapeHtml(ordersRes.error.message));
    return;
  }

  const orders = ordersRes.data || [];
  if(orders.length === 0){
    ordersBox.innerHTML = `<div class="notice ok">Aucune commande pour le moment 🔥</div>`;
    return;
  }

  const orderIds = orders.map(o => o.id);
  const itemsRes = await sb
    .from("order_items")
    .select("order_id, product_name, option_label, qty, unit_price_cents, line_total_cents")
    .in("order_id", orderIds);

  const items = itemsRes.data || [];
  const byOrder = new Map();
  items.forEach(it => {
    if(!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
    byOrder.get(it.order_id).push(it);
  });

  ordersBox.innerHTML = orders.map(o => {
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
