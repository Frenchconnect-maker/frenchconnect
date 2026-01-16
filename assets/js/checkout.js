/* ============================================================
   checkout.js — FrenchConnect (Supabase + Mollie) ✅ SANS STRIPE
   - Lit le panier depuis store.js (localStorage)
   - Login / logout Supabase
   - Crée commande: orders + order_items + addresses
   - Appelle Edge Function: mollie-create-checkout
   - Redirige vers Mollie
   ============================================================ */

(function () {
  // ✅ Mets tes vraies valeurs (ANON KEY = eyJ...).
  // IMPORTANT: si tu définis déjà ça dans store.js, tu peux supprimer ces 2 lignes.
  window.SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  window.SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

  // (optionnel)
  const SITE_ORIGIN = "https://frenchconnect31.com";

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

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
    box.style.padding = "12px";
    box.style.borderRadius = "12px";
    box.style.fontWeight = "700";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.background =
      type === "ok" ? "rgba(0,180,80,.12)" : "rgba(220,50,50,.12)";
    box.innerHTML = text;
  }
  function hideMsg() {
    const box = $("msg");
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  }

  function getSelectedShipping() {
    const el = document.querySelector('input[name="shipping"]:checked');
    return {
      method: el?.value || "relay",
      cents: Number(el?.dataset?.cents || 0),
    };
  }

  function readCartSafe() {
    // store.js peut exposer getCart(), sinon localStorage direct
    if (typeof window.getCart === "function") return window.getCart() || [];
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  }

  function calcSubtotalCents(cart) {
    let cents = 0;

    cart.forEach((line) => {
      const qty = Number(line.qty || 1);

      // 1) si le panier stocke déjà price
      if (line.price != null) {
        cents += toCents(line.price) * qty;
        return;
      }

      // 2) sinon via store.js catalogue
      const p =
        typeof window.findProduct === "function" ? window.findProduct(line.id) : null;
      const unit = p
        ? typeof window.priceFor === "function"
          ? window.priceFor(p, line.optionId)
          : p.price || 0
        : 0;

      cents += toCents(unit) * qty;
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
          const qty = Number(line.qty || 1);

          let name = line.name || line.id || "Produit";
          let unit = Number(line.price || 0);

          const p =
            typeof window.findProduct === "function" ? window.findProduct(line.id) : null;
          if (p?.name) name = p.name;
          if (!unit && p) {
            unit =
              typeof window.priceFor === "function"
                ? window.priceFor(p, line.optionId)
                : p.price || 0;
          }

          const lineTotal = unit * qty;

          return `
            <tr>
              <td style="padding:8px 0;">
                <div style="font-weight:900;">${name}</div>
                <div class="muted-sm">x ${qty}</div>
              </td>
              <td style="padding:8px 0;text-align:right;font-weight:900;">${euro(
                lineTotal
              )}</td>
            </tr>
          `;
        })
        .join("");
    }

    if ($("subtotal")) $("subtotal").textContent = euro(subtotalCents / 100);
    if ($("shipping")) $("shipping").textContent = euro(ship.cents / 100);
    if ($("total")) $("total").textContent = euro(totalCents / 100);

    return { subtotalCents, shippingCents: ship.cents, totalCents, shippingMethod: ship.method };
  }

  async function hydrateAuthUI(sb) {
    const authMini = $("auth-mini");
    const loginCard = $("login-card");
    const logoutBtn = $("logoutBtn");

    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;

    if (user) {
      if (authMini) authMini.textContent = `Connecté: ${user.email || "OK"}`;
      if (loginCard) loginCard.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "";
    } else {
      if (authMini) authMini.textContent = "Non connecté";
      if (loginCard) loginCard.style.display = "";
      if (logoutBtn) logoutBtn.style.display = "none";
    }

    return user;
  }

  // ✅ IMPORTANT: on utilise sb.functions.invoke (plus fiable, gère mieux l’auth)
 async function startMollieCheckout(sb, orderId, totalCents) {
  const { data: sessionData } = await sb.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error("Utilisateur non authentifié (token manquant)");
  }

  const payload = {
    amount: (totalCents / 100).toFixed(2),
    description: `Commande ${orderId}`,
    order_id: orderId,
  };

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/mollie-create-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // 🔴 OBLIGATOIRE QUAND Verify JWT = ON
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge Function error ${res.status}: ${text}`);
  }

  const data = await res.json();

  const url =
    data?.url ||
    data?._links?.checkout?.href ||
    data?._links?.checkout?.url;

  if (!url) {
    throw new Error("URL Mollie introuvable");
  }

  window.location.href = url;
}

  async function init() {
    // marqueur debug
    window.__CHECKOUT_LOADED__ = true;

    if (!window.supabase?.createClient) {
      showMsg(
        "err",
        "Supabase JS n’est pas chargé. Vérifie le script CDN supabase.js dans checkout.html."
      );
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 20) {
      showMsg(
        "err",
        "SUPABASE_URL / SUPABASE_ANON_KEY manquants. Mets la vraie ANON KEY (eyJ...)."
      );
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // (optionnel) debug dans console:
    window.supabaseClient = sb;

    // Panier
    const cart = readCartSafe();
    if (!cart.length) {
      showMsg("err", "Panier vide. Retourne à la boutique.");
      $("place-order")?.setAttribute("disabled", "disabled");
      return;
    }

    // Summary + shipping change
    renderSummary(cart);
    document.querySelectorAll('input[name="shipping"]').forEach((r) => {
      r.addEventListener("change", () => renderSummary(readCartSafe()));
    });

    // Auth UI
    await hydrateAuthUI(sb);

    // Logout
    $("logoutBtn")?.addEventListener("click", async () => {
      await sb.auth.signOut();
      location.reload();
    });

    // Login
    $("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("login-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Connexion…";
      }

      try {
        const email = ($("login-email")?.value || "").trim().toLowerCase();
        const password = $("login-password")?.value || "";
        if (!email || !password) throw new Error("Email et mot de passe requis.");

        const res = await sb.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;

        await hydrateAuthUI(sb);
        showMsg("ok", "Connecté ✅ Tu peux payer.");
      } catch (err) {
        showMsg("err", err?.message || "Erreur de connexion");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Se connecter";
        }
      }
    });

    // Place order (Mollie)
    $("order-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("place-order");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Traitement…";
      }

      try {
        // 1) user connecté obligatoire
        const { data } = await sb.auth.getSession();
        const user = data?.session?.user;
        if (!user) throw new Error("Tu dois être connecté pour payer.");

        // 2) cart + totals
        const cartNow = readCartSafe();
        if (!cartNow.length) throw new Error("Panier vide.");

        const totals = renderSummary(cartNow);
        const subtotalCents = totals.subtotalCents;
        const shippingCents = totals.shippingCents;
        const totalCents = totals.totalCents;
        const shippingMethod = totals.shippingMethod;

        // 3) validations adresse
        const first_name = ($("first_name")?.value || "").trim();
        const last_name = ($("last_name")?.value || "").trim();
        const phone = ($("phone")?.value || "").trim();

        const company = ($("company")?.value || "").trim();
        const country = ($("country")?.value || "").trim();
        const address1 = ($("address1")?.value || "").trim();
        const address2 = ($("address2")?.value || "").trim();
        const city = ($("city")?.value || "").trim();
        const postal_code = ($("postal_code")?.value || "").trim();
        const note = ($("note")?.value || "").trim();

        if (!first_name || !last_name || !phone)
          throw new Error("Prénom / Nom / Téléphone obligatoires.");
        if (!country || !address1 || !city || !postal_code)
          throw new Error("Adresse incomplète.");

        // 4) créer commande
        const { data: order, error: orderErr } = await sb
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending_payment",
            currency: "EUR",
            subtotal_cents: subtotalCents,
            shipping_cents: shippingCents,
            total_cents: totalCents,
            shipping_method: shippingMethod,
            note: note || null,
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        // 5) items
        const items = cartNow.map((l) => {
          const qty = Number(l.qty || 1);

          let product_name = l.name || l.id || "Produit";
          let unit = Number(l.price || 0);

          const p =
            typeof window.findProduct === "function" ? window.findProduct(l.id) : null;
          if (p?.name) product_name = p.name;
          if (!unit && p) {
            unit =
              typeof window.priceFor === "function"
                ? window.priceFor(p, l.optionId)
                : p.price || 0;
          }

          const unitCents = toCents(unit);

          return {
            order_id: order.id,
            product_id: l.id || null,
            product_name,
            qty,
            unit_price_cents: unitCents,
            line_total_cents: unitCents * qty,
          };
        });

        const itemsRes = await sb.from("order_items").insert(items);
        if (itemsRes.error) throw itemsRes.error;

        // 6) adresses (billing + shipping identiques)
        const addrBase = {
          first_name,
          last_name,
          company: company || null,
          country,
          address1,
          address2: address2 || null,
          city,
          postal_code,
          email: user.email,
          phone,
        };

        const addrRes = await sb.from("addresses").insert([
          { order_id: order.id, type: "billing", ...addrBase },
          { order_id: order.id, type: "shipping", ...addrBase },
        ]);
        if (addrRes.error) throw addrRes.error;

        showMsg("ok", `Commande créée ✅ Redirection Mollie… (ID: <b>${order.id}</b>)`);

        // 7) payer Mollie
        await startMollieCheckout(sb, order.id, totalCents);
      } catch (err) {
        console.error(err);
        showMsg("err", err?.message || "Erreur paiement");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Payer avec Mollie";
        }
      }
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
