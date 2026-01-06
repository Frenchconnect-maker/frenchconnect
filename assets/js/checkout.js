/* =========================================
   Supabase Checkout (Auth obligatoire)
   - Sign up / Login
   - Create order + items + addresses
   - Compatible avec ton panier localStorage (store.js)
   ========================================= */

// ✅ RENSEIGNÉ (OK POUR FRONT)
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

// 2) Charger supabase-js depuis CDN (sans build)
(function loadSupabaseCDN(){
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initCheckout;
  document.head.appendChild(s);
})();

function euro(n){ return (n).toFixed(2).replace(".", ",") + " €"; }
function toCents(eur){ return Math.round(Number(eur) * 100); }

function getSelectedShipping(){
  const el = document.querySelector('input[name="shipping"]:checked');
  const cents = Number(el?.dataset?.cents || 0);
  const method = el?.value || "relay";
  return { cents, method };
}

function showMsg(type, text){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML =
    `<div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">${type === "ok" ? "OK" : "Erreur"}</div>
     <div>${text}</div>`;
}

function hideMsg(){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

function setReq(id, yes){
  const el = document.getElementById(id);
  if(!el) return;
  el.required = !!yes;
}

function setDisabled(id, yes){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!yes;
  // petit visuel : on ne touche pas au CSS, juste une opacité légère
  el.style.opacity = yes ? "0.65" : "1";
}

async function initCheckout(){
  if(!window.supabase){
    showMsg("err", "Supabase n’a pas chargé (CDN). Vérifie ta connexion.");
    return;
  }
  if(!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY.startsWith("sb_")){
    showMsg("err", "Supabase URL / Key manquants. Renseigne SUPABASE_URL et SUPABASE_KEY dans assets/js/checkout.js.");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Cart helpers (depuis store.js)
  const cart = (typeof getCart === "function") ? getCart() : [];
  if(!cart || cart.length === 0){
    showMsg("err", "Ton panier est vide. Retourne à la boutique.");
    document.getElementById("place-order")?.setAttribute("disabled","disabled");
    return;
  }

  // Render order summary
  renderSummary(cart);

  // Auth mode toggle
  const passwordBox = document.getElementById("password_box");
  const passwordInp = document.getElementById("password");
  const authRadios  = document.querySelectorAll('input[name="authMode"]');

  function syncAuthMode(){
    const mode = document.querySelector('input[name="authMode"]:checked')?.value || "signup";

    // Mot de passe toujours requis (signup/login)
    if(passwordBox) passwordBox.style.display = "block";
    if(passwordInp) passwordInp.required = true;

    // ✅ Signup => champs requis
    // ✅ Login  => on enlève les requis (sinon ça bloque la connexion)
    const req = (mode === "signup");

    // Identité
    setReq("first_name", req);
    setReq("last_name",  req);
    setReq("phone",      req);

    // Adresse
    setReq("country",     req);
    setReq("address1",    req);
    setReq("city",        req);
    setReq("postal_code", req);

    // Optionnel : en login on grise les champs (mais tu peux les laisser éditables)
    // Ici je les garde éditables, juste non obligatoires => pas de casse design
    hideMsg();
    if(mode === "login"){
      showMsg("ok", "Connecte-toi avec ton email + mot de passe. (Les champs adresse/nom ne bloquent plus.)");
    }
  }

  authRadios.forEach(r => r.addEventListener("change", syncAuthMode));
  syncAuthMode();

  // Recalculate total when shipping changes
  document.querySelectorAll('input[name="shipping"]').forEach(r => {
    r.addEventListener("change", () => renderSummary(getCart()));
  });

  // Submit
  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const btn = document.getElementById("place-order");
    btn.disabled = true;
    btn.textContent = "Traitement…";

    try {
      // 1) Auth (signup ou login)
      const mode = document.querySelector('input[name="authMode"]:checked')?.value || "signup";
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;

      if(!email || !password) throw new Error("Email et mot de passe requis.");

      if(mode === "signup"){
        const sign = await sb.auth.signUp({ email, password });
        if(sign.error) throw sign.error;

        // Si confirm email activé, la session peut être null -> on tente login
        const { data: s0 } = await sb.auth.getSession();
        if(!s0?.session){
          const loginRes = await sb.auth.signInWithPassword({ email, password });
          if(loginRes.error) throw loginRes.error;
        }
      } else {
        const login = await sb.auth.signInWithPassword({ email, password });
        if(login.error) throw login.error;
      }

      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData?.session?.user;

      if(!user){
        throw new Error("Session introuvable. Si 'Confirm email' est activé, confirme ton email puis reconnecte-toi.");
      }

      // ✅ En mode login, on pré-remplit ce qu'on peut (profil + dernière adresse)
      // (Ça ne casse rien si pas de data)
      await hydrateFromAccount(sb, user.id);

      // 2) Update profile (on upsert, même en login)
      const profile = {
        id: user.id,
        email,
        first_name: document.getElementById("first_name")?.value.trim() || null,
        last_name:  document.getElementById("last_name")?.value.trim()  || null,
        phone:      document.getElementById("phone")?.value.trim()      || null,
      };

      const up = await sb.from("profiles").upsert(profile, { onConflict: "id" });
      if(up.error) throw up.error;

      // 3) Create order
      const cartNow = getCart();
      const subtotalCents = calcSubtotalCents(cartNow);
      const ship = getSelectedShipping();
      const totalCents = subtotalCents + ship.cents;

      const note = document.getElementById("note")?.value.trim() || "";

      const orderInsert = await sb
        .from("orders")
        .insert([{
          user_id: user.id,
          status: "new",
          currency: "EUR",
          subtotal_cents: subtotalCents,
          shipping_cents: ship.cents,
          total_cents: totalCents,
          shipping_method: ship.method,
          note: note || null
        }])
        .select("id")
        .single();

      if(orderInsert.error) throw orderInsert.error;
      const orderId = orderInsert.data.id;

      // 4) Insert items
      const itemsPayload = cartNow.map(line => {
        const p = (typeof findProduct === "function") ? findProduct(line.id) : null;
        const opt = p && line.optionId && (typeof getOption === "function") ? getOption(p, line.optionId) : null;

        const unitPrice = p ? (
          (typeof priceFor === "function") ? priceFor(p, line.optionId) : (p.price || 0)
        ) : 0;

        const unitCents = toCents(unitPrice);
        const qty = Number(line.qty || 1);
        const lineTotal = unitCents * qty;

        return {
          order_id: orderId,
          product_id: line.id,
          product_name: p?.name || line.id,
          option_id: line.optionId || null,
          option_label: opt?.label || null,
          unit_price_cents: unitCents,
          qty,
          line_total_cents: lineTotal
        };
      });

      const itemsInsert = await sb.from("order_items").insert(itemsPayload);
      if(itemsInsert.error) throw itemsInsert.error;

      // 5) Insert addresses (billing & shipping = pareil pour l’instant)
      // ⚠️ Si l’utilisateur a choisi "login" et n’a pas rempli l’adresse,
      // on doit quand même avoir des valeurs.
      // => On vérifie les champs minimum et on bloque proprement si vide.
      const country     = document.getElementById("country")?.value.trim() || "";
      const address1    = document.getElementById("address1")?.value.trim() || "";
      const city        = document.getElementById("city")?.value.trim() || "";
      const postal_code = document.getElementById("postal_code")?.value.trim() || "";

      if(!country || !address1 || !city || !postal_code){
        throw new Error("Adresse incomplète. Remplis Pays, Adresse, Ville, Code postal (même en mode 'J’ai déjà un compte').");
      }

      const addrBase = {
        first_name: profile.first_name || (document.getElementById("first_name")?.value.trim() || ""),
        last_name:  profile.last_name  || (document.getElementById("last_name")?.value.trim()  || ""),
        company:    document.getElementById("company")?.value.trim() || null,
        country,
        address1,
        address2:   document.getElementById("address2")?.value.trim() || null,
        city,
        postal_code,
        email: profile.email,
        phone: profile.phone || (document.getElementById("phone")?.value.trim() || null)
      };

      const addrInsert = await sb.from("addresses").insert([
        { order_id: orderId, type: "billing",  ...addrBase },
        { order_id: orderId, type: "shipping", ...addrBase },
      ]);
      if(addrInsert.error) throw addrInsert.error;

      // 6) Clear cart + success
      if(typeof setCart === "function") setCart([]);
      showMsg("ok", `Commande enregistrée ✅ (ID: <strong>${orderId}</strong>)<br>Tu peux la voir dans Supabase → Table Editor → <strong>orders</strong>.`);
      btn.textContent = "Commande envoyée ✔";
      btn.disabled = true;

    } catch (err) {
      console.error(err);
      showMsg("err", (err?.message || "Erreur inconnue"));
      btn.disabled = false;
      btn.textContent = "Commander";
    }
  });

  // Auto-fill email si déjà connecté
  try {
    const { data } = await sb.auth.getUser();
    if(data?.user?.email){
      document.getElementById("email").value = data.user.email;
    }
  } catch(e){ /* ignore */ }
}

// Pré-remplissage profil + dernière adresse shipping (si existe)
async function hydrateFromAccount(sb, userId){
  try{
    const profRes = await sb
      .from("profiles")
      .select("email, first_name, last_name, phone")
      .eq("id", userId)
      .single();

    const prof = profRes.data || {};
    if(prof.first_name) document.getElementById("first_name").value = prof.first_name;
    if(prof.last_name)  document.getElementById("last_name").value  = prof.last_name;
    if(prof.phone)      document.getElementById("phone").value      = prof.phone;

    const lastOrder = await sb
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if(!lastOrder.data?.id) return;

    const addr = await sb
      .from("addresses")
      .select("company, country, address1, address2, city, postal_code")
      .eq("order_id", lastOrder.data.id)
      .eq("type", "shipping")
      .maybeSingle();

    const a = addr.data;
    if(!a) return;

    if(a.company)     document.getElementById("company").value     = a.company;
    if(a.country)     document.getElementById("country").value     = a.country;
    if(a.address1)    document.getElementById("address1").value    = a.address1;
    if(a.address2)    document.getElementById("address2").value    = a.address2;
    if(a.city)        document.getElementById("city").value        = a.city;
    if(a.postal_code) document.getElementById("postal_code").value = a.postal_code;
  }catch(e){
    // on ignore si rien à hydrater
  }
}

function calcSubtotalCents(cart){
  let cents = 0;
  cart.forEach(line => {
    const p = (typeof findProduct === "function") ? findProduct(line.id) : null;
    const unit = p ? ((typeof priceFor === "function") ? priceFor(p, line.optionId) : (p.price || 0)) : 0;
    cents += toCents(unit) * Number(line.qty || 1);
  });
  return cents;
}

function renderSummary(cart){
  const tbody = document.getElementById("order-lines");
  const mini = document.getElementById("cart-mini");

  const subtotalCents = calcSubtotalCents(cart);
  const ship = getSelectedShipping();
  const totalCents = subtotalCents + ship.cents;

  if(mini){
    const count = cart.reduce((s,l)=> s + Number(l.qty||1), 0);
    mini.textContent = `${count} article(s)`;
  }

  if(tbody){
    tbody.innerHTML = cart.map(line => {
      const p = (typeof findProduct === "function") ? findProduct(line.id) : null;
      const optLabel = p && line.optionId && (typeof getOption === "function") ? (getOption(p, line.optionId)?.label || "") : "";
      const unit = p ? ((typeof priceFor === "function") ? priceFor(p, line.optionId) : (p.price || 0)) : 0;
      const lineTotal = unit * Number(line.qty || 1);

      return `
        <tr>
          <td>
            <div style="font-weight:900">${p?.name || line.id}</div>
            <div class="small-muted">${optLabel ? optLabel + " • " : ""}x ${Number(line.qty||1)}</div>
          </td>
          <td style="text-align:right;font-weight:900">${euro(lineTotal)}</td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("subtotal").textContent = euro(subtotalCents / 100);
  document.getElementById("total").textContent = euro(totalCents / 100);
}
