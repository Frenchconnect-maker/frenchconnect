/* =========================================
   Supabase Checkout (Auth obligatoire)
   - Sign up / Login
   - Create order + items + addresses
   - Compatible avec ton panier localStorage (store.js)
   ========================================= */

// 1) ✅ RENSEIGNE ICI (OK: publishable + URL)
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
  // Prend uniquement une option visible (utile quand on masque FR/EU selon le pays)
  const radios = Array.from(document.querySelectorAll('input[name="shipping"]'));
  const visible = radios.filter(r => r && r.offsetParent !== null);

  let el = visible.find(r => r.checked);
  if(!el){
    el = visible[0] || radios.find(r => r.checked) || radios[0];
    if(el) el.checked = true;
  }

  const cents = Number(el?.dataset?.cents || 0);
  const method = el?.value || "fr_mondial";
  return { cents, method };
}

function showMsg(type, text){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "block";
  box.innerHTML = `<div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">${type === "ok" ? "OK" : "Erreur"}</div><div>${text}</div>`;
}

function hideMsg(){
  const box = document.getElementById("msg");
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
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

  // --- Shipping: afficher FR ou EUROPE selon le pays sélectionné ---
  const countrySelect = document.getElementById("country");

  function setShippingRegion(region){
    const blocks = Array.from(document.querySelectorAll(".shipping-region"));
    blocks.forEach(b => {
      b.style.display = (b.getAttribute("data-region") === region) ? "" : "none";
    });

    // Si une option cachée est cochée, on force une option visible
    const radios = Array.from(document.querySelectorAll('input[name="shipping"]'));
    const visible = radios.filter(r => r.offsetParent !== null);
    if(visible.length){
      const checkedVisible = visible.some(r => r.checked);
      if(!checkedVisible){
        visible[0].checked = true;
      }
    }

    // Recalcule les totaux
    renderSummary((typeof getCart === "function") ? getCart() : cart);
  }

  function syncShippingByCountry(){
    const c = (countrySelect?.value || "").toLowerCase();
    if(c === "france"){
      setShippingRegion("fr");
    } else {
      setShippingRegion("eu");
    }
  }

  if(countrySelect){
    countrySelect.addEventListener("change", syncShippingByCountry);
  }
  syncShippingByCountry();

  // Auth mode toggle
  const passwordBox = document.getElementById("password_box");
  const passwordInp = document.getElementById("password");
  const authRadios = document.querySelectorAll('input[name="authMode"]');

  function syncAuthMode(){
    // Compte obligatoire : dans les 2 modes, mdp requis (signup / login)
    passwordBox.style.display = "block";
    passwordInp.required = true;
    hideMsg();
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

      let authRes;
      if(mode === "signup"){
        authRes = await sb.auth.signUp({ email, password });
        if(authRes.error) throw authRes.error;

        // Si email confirmation activée, session peut être null
        // On tente une connexion directe pour simplifier le test
        if(!authRes.data.session){
          const loginRes = await sb.auth.signInWithPassword({ email, password });
          if(loginRes.error) throw loginRes.error;
        }
      } else {
        authRes = await sb.auth.signInWithPassword({ email, password });
        if(authRes.error) throw authRes.error;
      }

      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData?.session?.user;
      if(!user) throw new Error("Impossible de récupérer la session utilisateur. Vérifie Auth Settings (confirm email peut bloquer).");

      // 2) Update profile (first/last/phone)
      const profile = {
        id: user.id,
        email,
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
      };

      // Upsert profile
      const up = await sb.from("profiles").upsert(profile, { onConflict: "id" });
      if(up.error) throw up.error;

      // 3) Create order
      const cartNow = getCart();
      const subtotalCents = calcSubtotalCents(cartNow);
      const ship = getSelectedShipping();
      const totalCents = subtotalCents + ship.cents;

      const note = document.getElementById("note").value.trim();

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

      // 5) Insert addresses (billing & shipping = pareil)
      const addrBase = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        company: document.getElementById("company").value.trim() || null,
        country: document.getElementById("country").value.trim(),
        address1: document.getElementById("address1").value.trim(),
        address2: document.getElementById("address2").value.trim() || null,
        city: document.getElementById("city").value.trim(),
        postal_code: document.getElementById("postal_code").value.trim(),
        email: profile.email,
        phone: profile.phone
      };

      const addrInsert = await sb.from("addresses").insert([
        { order_id: orderId, type: "billing",  ...addrBase },
        { order_id: orderId, type: "shipping", ...addrBase },
      ]);
      if(addrInsert.error) throw addrInsert.error;

      // 6) Clear cart + success
      if(typeof setCart === "function") setCart([]);
      showMsg("ok", `Commande enregistrée ✅ (ID: ${orderId})<br>Tu peux la voir dans Supabase → Table Editor → <strong>orders</strong>.`);
      btn.textContent = "Commande envoyée ✔";
      btn.disabled = true;

    } catch (err) {
      console.error(err);
      showMsg("err", (err?.message || "Erreur inconnue") + "<br><span class='small-muted'>Astuce: si tu as laissé 'Confirm email' activé, la session peut être vide après signUp. Désactive-le pour tester.</span>");
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
