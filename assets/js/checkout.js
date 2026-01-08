/* =========================================
   Checkout — Option A (UI propre)
   - Carte 1: Login (email + mdp)
   - Carte 2: Livraison + Commande
     - si pas connecté: création compte (email+mdp)
     - si connecté: commande directe
   - Stripe Checkout (redirect) après création de commande
   - Compatible panier localStorage (store.js)
   ========================================= */

/* ================================
   ✅ IMPORTANT
   Mets ici la VRAIE ANON KEY Supabase (elle commence par "eyJ...")
   PAS une clé "sb_publishable_..."
================================ */
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ"; // <-- eyJ...

// Load supabase-js (CDN)
(function loadSupabaseCDN() {
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.defer = true;
  s.onload = initCheckout;
  document.head.appendChild(s);
})();

const $ = (id) => document.getElementById(id);

function euro(n) {
  return Number(n).toFixed(2).replace(".", ",") + " €";
}
function toCents(eur) {
  return Math.round(Number(eur) * 100);
}

function showMsg(type, text) {
  const box = $("msg");
  if (!box) return;
  box.style.display = "block";
  box.innerHTML = `
    <div class="${type === "ok" ? "ok" : "danger"}" style="font-weight:900;margin-bottom:6px;">
      ${type === "ok" ? "OK" : "Erreur"}
    </div>
    <div>${text}</div>
  `;
}
function hideMsg() {
  const box = $("msg");
  if (!box) return;
  box.style.display = "none";
  box.textContent = "";
}

function getSelectedShipping() {
  const el = document.querySelector('input[name="shipping"]:checked');
  const cents = Number(el?.dataset?.cents || 0);
  const method = el?.value || "relay";
  return { cents, method };
}

function calcSubtotalCents(cart) {
  let cents = 0;
  cart.forEach((line) => {
    const p = typeof findProduct === "function" ? findProduct(line.id) : null;
    const unit = p
      ? typeof priceFor === "function"
        ? priceFor(p, line.optionId)
        : p.price || 0
      : 0;
    cents += toCents(unit) * Number(line.qty || 1);
  });
  return cents;
}

function renderSummary(cart) {
  const tbody = $("order-lines");
  const mini = $("cart-mini");

  const subtotalCents = calcSubtotalCents(cart);
  const ship = getSelectedShipping();
  const totalCents = subtotalCents + ship.cents;

  if (mini) {
    const count = cart.reduce((s, l) => s + Number(l.qty || 1), 0);
    mini.textContent = `${count} article(s)`;
  }

  if (tbody) {
    tbody.innerHTML = cart
      .map((line) => {
        const p = typeof findProduct === "function" ? findProduct(line.id) : null;
        const optLabel =
          p && line.optionId && typeof getOption === "function"
            ? getOption(p, line.optionId)?.label || ""
            : "";
        const unit = p
          ? typeof priceFor === "function"
            ? priceFor(p, line.optionId)
            : p.price || 0
          : 0;

        const qty = Number(line.qty || 1);
        const lineTotal = unit * qty;

        return `
          <tr>
            <td>
              <div style="font-weight:1000">${p?.name || line.id}</div>
              <div class="muted-sm">${optLabel ? optLabel + " • " : ""}x ${qty}</div>
            </td>
            <td style="text-align:right;font-weight:1000">${euro(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");
  }

  $("subtotal").textContent = euro(subtotalCents / 100);
  $("total").textContent = euro(totalCents / 100);
}

async function hydrateFromAccount(sb, userId) {
  // profil
  const profRes = await sb
    .from("profiles")
    .select("email, first_name, last_name, phone")
    .eq("id", userId)
    .maybeSingle();

  const p = profRes.data || {};
  if (p.first_name) $("first_name").value = p.first_name;
  if (p.last_name) $("last_name").value = p.last_name;
  if (p.phone) $("phone").value = p.phone;

  // dernière adresse shipping via dernière commande
  const lastOrder = await sb
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastOrder.data?.id) return;

  const addr = await sb
    .from("addresses")
    .select("company, country, address1, address2, city, postal_code")
    .eq("order_id", lastOrder.data.id)
    .eq("type", "shipping")
    .maybeSingle();

  const a = addr.data;
  if (!a) return;

  if (a.company) $("company").value = a.company;
  if (a.country) $("country").value = a.country;
  if (a.address1) $("address1").value = a.address1;
  if (a.address2) $("address2").value = a.address2;
  if (a.city) $("city").value = a.city;
  if (a.postal_code) $("postal_code").value = a.postal_code;
}

function setAuthUI(user) {
  const authMini = $("auth-mini");
  const loginCard = $("login-card");
  const signupCred = $("signup-cred-box");
  const logoutBtn = $("logoutBtn");

  if (user) {
    if (authMini) authMini.textContent = `Connecté: ${user.email || "OK"}`;
    if (loginCard) loginCard.style.display = "none";
    if (signupCred) signupCred.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "";
  } else {
    if (authMini) authMini.textContent = "Non connecté";
    if (loginCard) loginCard.style.display = "";
    if (signupCred) signupCred.style.display = "";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

/* ================================
   ✅ STRIPE CHECKOUT (Edge Function)
   On utilise sb.functions.invoke() :
   - gère apikey + authorization automatiquement
   - évite les erreurs d’URL
================================ */
async function startStripeCheckout(sb, orderId) {
  // 1) Vérifier session
  let {
    data: { session },
  } = await sb.auth.getSession();

  // 2) Si pas de session -> tenter refresh
  if (!session?.access_token) {
    try {
      await sb.auth.refreshSession();
      ({
        data: { session },
      } = await sb.auth.getSession());
    } catch (e) {
      // ignore
    }
  }

  // 3) Toujours rien => stop
  if (!session?.access_token) {
    throw new Error(
      "Tu dois être connecté pour payer. Clique sur “Se connecter”, puis réessaie."
    );
  }

  // 4) Appel Edge Function
  const { data, error } = await sb.functions.invoke("stripe-create-checkout", {
    body: { order_id: orderId },
  });

  if (error) {
    // error.message est souvent parlant (401/403/500)
    throw new Error(error.message || "Erreur Edge Function");
  }

  if (!data?.url) {
    throw new Error("Stripe n’a pas renvoyé d’URL de paiement.");
  }

  window.location.href = data.url;
}

async function initCheckout() {
  if (!window.supabase) {
    showMsg("err", "Supabase n’a pas chargé (CDN). Vérifie ta connexion.");
    return;
  }
  if (!SUPABASE_URL.startsWith("http") || !SUPABASE_KEY || SUPABASE_KEY.length < 20) {
    showMsg("err", "Supabase URL / ANON KEY manquants dans assets/js/checkout.js.");
    return;
  }

  // ✅ createClient avec ANON KEY (eyJ...)
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // cart
  const cart = typeof getCart === "function" ? getCart() : [];
  if (!cart || cart.length === 0) {
    showMsg("err", "Ton panier est vide. Retourne à la boutique.");
    $("place-order")?.setAttribute("disabled", "disabled");
    return;
  }

  // summary
  renderSummary(cart);
  document.querySelectorAll('input[name="shipping"]').forEach((r) => {
    r.addEventListener("change", () => renderSummary(getCart()));
  });

  // logout
  $("logoutBtn")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });

  // boot session
  const {
    data: { session },
  } = await sb.auth.getSession();
  const user = session?.user || null;

  setAuthUI(user);
  if (user) {
    try {
      await hydrateFromAccount(sb, user.id);
    } catch (e) {
      /* ignore */
    }
  }

  // -------- LOGIN (carte gauche) --------
  $("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const btn = $("login-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Connexion…";
    }

    try {
      const email = ($("login-email").value || "").trim().toLowerCase();
      const password = $("login-password").value || "";
      if (!email || !password) throw new Error("Email et mot de passe requis.");

      const res = await sb.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;

      const {
        data: { session: s2 },
      } = await sb.auth.getSession();
      const u = s2?.user;
      if (!u) throw new Error("Session introuvable après connexion.");

      setAuthUI(u);
      await hydrateFromAccount(sb, u.id);
      showMsg("ok", "Connecté ✔ Tu peux maintenant valider ta commande.");
    } catch (err) {
      showMsg("err", err?.message || "Erreur de connexion.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Se connecter";
      }
    }
  });

  // -------- ORDER FORM (carte droite) --------
  $("order-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const btn = $("place-order");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Traitement…";
    }

    try {
      // session?
      const {
        data: { session: s0 },
      } = await sb.auth.getSession();
      let userNow = s0?.user || null;

      // si pas connecté => création compte (email+mdp)
      if (!userNow) {
        const email = ($("signup-email").value || "").trim().toLowerCase();
        const password = $("signup-password").value || "";
        if (!email || !password) {
          throw new Error("Pour créer un compte: email + mot de passe requis.");
        }

        const sign = await sb.auth.signUp({ email, password });
        if (sign.error) throw sign.error;

        // si confirm email activé, pas de session => on stop et on explique
        const {
          data: { session: s1 },
        } = await sb.auth.getSession();
        userNow = s1?.user || null;

        if (!userNow) {
          throw new Error(
            "Compte créé ✅ Vérifie ton email pour le confirmer, puis reviens ici et connecte-toi avec “J’ai déjà un compte”."
          );
        }
      }

      // validations adresse mini
      const first_name = ($("first_name").value || "").trim();
      const last_name = ($("last_name").value || "").trim();
      const phone = ($("phone").value || "").trim();

      const country = ($("country").value || "").trim();
      const address1 = ($("address1").value || "").trim();
      const address2 = ($("address2").value || "").trim();
      const city = ($("city").value || "").trim();
      const postal_code = ($("postal_code").value || "").trim();
      const company = ($("company").value || "").trim();
      const note = ($("note").value || "").trim();

      if (!first_name || !last_name || !phone)
        throw new Error("Infos client incomplètes (prénom/nom/téléphone).");
      if (!country || !address1 || !city || !postal_code)
        throw new Error("Adresse incomplète (pays/adresse/ville/code postal).");

      // upsert profile
      const up = await sb
        .from("profiles")
        .upsert(
          {
            id: userNow.id,
            email: userNow.email,
            first_name,
            last_name,
            phone,
          },
          { onConflict: "id" }
        );

      if (up.error) throw up.error;

      // create order
      const cartNow = typeof getCart === "function" ? getCart() : [];
      const subtotalCents = calcSubtotalCents(cartNow);
      const ship = getSelectedShipping();
      const totalCents = subtotalCents + ship.cents;

      const orderInsert = await sb
        .from("orders")
        .insert([
          {
            user_id: userNow.id,
            status: "new",
            currency: "EUR",
            subtotal_cents: subtotalCents,
            shipping_cents: ship.cents,
            total_cents: totalCents,
            shipping_method: ship.method,
            note: note || null,
          },
        ])
        .select("id")
        .single();

      if (orderInsert.error) throw orderInsert.error;
      const orderId = orderInsert.data.id;

      // items
      const itemsPayload = cartNow.map((line) => {
        const p = typeof findProduct === "function" ? findProduct(line.id) : null;
        const opt =
          p && line.optionId && typeof getOption === "function"
            ? getOption(p, line.optionId)
            : null;

        const unitPrice = p
          ? typeof priceFor === "function"
            ? priceFor(p, line.optionId)
            : p.price || 0
          : 0;

        const unitCents = toCents(unitPrice);
        const qty = Number(line.qty || 1);

        return {
          order_id: orderId,
          product_id: line.id,
          product_name: p?.name || line.id,
          option_id: line.optionId || null,
          option_label: opt?.label || null,
          unit_price_cents: unitCents,
          qty,
          line_total_cents: unitCents * qty,
        };
      });

      const itemsInsert = await sb.from("order_items").insert(itemsPayload);
      if (itemsInsert.error) throw itemsInsert.error;

      // addresses
      const addrBase = {
        first_name,
        last_name,
        company: company || null,
        country,
        address1,
        address2: address2 || null,
        city,
        postal_code,
        email: userNow.email,
        phone,
      };

      const addrInsert = await sb.from("addresses").insert([
        { order_id: orderId, type: "billing", ...addrBase },
        { order_id: orderId, type: "shipping", ...addrBase },
      ]);
      if (addrInsert.error) throw addrInsert.error;

      // ✅ Ici on NE vide PAS le panier avant paiement
      // Le panier sera vidé sur success.html après retour Stripe.

      setAuthUI(userNow);
      showMsg(
        "ok",
        `Commande créée ✅ (ID: <strong>${orderId}</strong>)<br>Redirection vers le paiement…`
      );

      // ✅ Lance Stripe Checkout
      await startStripeCheckout(sb, orderId);
    } catch (err) {
      showMsg("err", err?.message || "Erreur lors de la commande.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Payer";
      }
    }
  });
}
