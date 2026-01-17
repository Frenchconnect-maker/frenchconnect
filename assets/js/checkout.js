// ================= AUTH SIMPLE CHECKOUT =================
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);

async function refreshAuth() {
  const { data } = await sb.auth.getSession();
  const user = data?.session?.user;

  if ($("auth-status")) {
    $("auth-status").textContent = user
      ? "Connecté : " + user.email
      : "Non connecté";
  }

  if ($("login-form")) $("login-form").style.display = user ? "none" : "block";
  if ($("logoutBtn")) $("logoutBtn").style.display = user ? "inline-block" : "none";

  return user;
}

document.addEventListener("DOMContentLoaded", async () => {
  await refreshAuth();

  $("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("login-email").value;
    const password = $("login-password").value;

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);

    await refreshAuth();
  });

  $("logoutBtn")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    await refreshAuth();
  });
});
/* ============================================================
   checkout.js — FrenchConnect (Supabase + Mollie) ✅ SANS STRIPE
   - Lit le panier depuis store.js (localStorage)
   - Login / logout Supabase + reset password
   - Crée commande: orders + order_items + addresses
   - Appelle Edge Function: mollie-create-checkout (JWT ON)
   - Redirige vers Mollie
   ============================================================ */

(function () {
  // ✅ Si tu as déjà SUPABASE_URL/KEY dans store.js, tu peux SUPPRIMER ces 2 lignes.
  // (Mais en attendant, on les laisse pour éviter "undefined".)
  
  // ton domaine (sans www OK). Si tu utilises www partout, mets https://www.frenchconnect31.com
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
    box.innerHTML = "";
  }

  function showAuthMsg(type, text) {
    const box = $("auth-msg");
    if (!box) return;
    box.style.display = "block";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.background = type === "ok" ? "rgba(0,180,80,.12)" : "rgba(220,50,50,.12)";
    box.style.color = "#fff";
    box.innerHTML = text;
  }
  function hideAuthMsg() {
    const box = $("auth-msg");
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
    // store.js peut exposer getCart()
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
      const p = typeof window.findProduct === "function" ? window.findProduct(line.id) : null;
      const unit = p
        ? (typeof window.priceFor === "function" ? window.priceFor(p, line.optionId) : (p.price || 0))
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

          const p = typeof window.findProduct === "function" ? window.findProduct(line.id) : null;
          if (p?.name) name = p.name;
          if (!unit && p) {
            unit = typeof window.priceFor === "function" ? window.priceFor(p, line.optionId) : (p.price || 0);
          }

          const lineTotal = unit * qty;

          return `
            <tr>
              <td>
                <div style="font-weight:1000">${name}</div>
                <div class="muted-sm">x ${qty}</div>
              </td>
              <td style="text-align:right;font-weight:1000">${euro(lineTotal)}</td>
            </tr>
          `;
        })
        .join("");
    }

    if ($("subtotal")) $("subtotal").textContent = euro(subtotalCents / 100);
    if ($("shipping")) $("shipping").textContent = euro(ship.cents / 100);
    if ($("total")) $("total").textContent = euro(totalCents / 100);

    return {
      subtotalCents,
      shippingCents: ship.cents,
      totalCents,
      shippingMethod: ship.method,
    };
  }

  async function hydrateAuthUI(sb) {
    const chip = $("auth-mini");
    const status = $("auth-status");
    const loginForm = $("login-form");
    const logoutBtn = $("logoutBtn");

    if (chip) chip.textContent = "Vérification…";
    if (status) status.textContent = "Vérification…";

    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;

    if (user) {
      const text = `Connecté: ${user.email || "OK"}`;
      if (chip) chip.textContent = text;
      if (status) status.textContent = text;
      if (loginForm) loginForm.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "";
    } else {
      if (chip) chip.textContent = "Non connecté";
      if (status) status.textContent = "Non connecté";
      if (loginForm) loginForm.style.display = "";
      if (logoutBtn) logoutBtn.style.display = "none";
    }

    return user;
  }

  async function startMollieCheckout(sb, orderId, totalCents) {
    // JWT ON => on doit envoyer Authorization: Bearer ACCESS_TOKEN
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error("Tu dois être connecté (token manquant).");
    }

    const payload = {
      order_id: orderId,
      amount: (totalCents / 100).toFixed(2),
      description: `Commande ${orderId}`,
    };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/mollie-create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Edge Function (${res.status}) : ${text}`);
    }

    const data = await res.json();
    const url = data?.url || data?._links?.checkout?.href || data?._links?.checkout?.url;

    if (!url) throw new Error("Mollie n’a pas renvoyé d’URL de paiement.");

    window.location.href = url;
  }

  async function init() {
    window.__CHECKOUT_LOADED__ = true;

    if (!window.supabase?.createClient) {
      showMsg("err", "Supabase JS n’est pas chargé. Vérifie le script CDN supabase.js dans checkout.html.");
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 20) {
      showMsg("err", "SUPABASE_URL / SUPABASE_ANON_KEY manquants (ANON KEY doit commencer par eyJ...).");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb; // debug console

    // Re-render / UI quand auth change
    sb.auth.onAuthStateChange(() => hydrateAuthUI(sb));

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

    // Auth UI (au boot)
    await hydrateAuthUI(sb);

    // Logout
    ["logoutBtn", "logoutBtnTop"].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener("click", async () => {
    hideAuthMsg?.();
    await sb.auth.signOut();
    location.reload(); // plus propre, reset total
  });
});


    

    // Reset password
    $("forgot-btn")?.addEventListener("click", async () => {
      hideAuthMsg();
      const email = ($("login-email")?.value || "").trim().toLowerCase();

      if (!email) {
        showAuthMsg("err", "Entre ton email puis clique sur “Mot de passe oublié ?”");
        return;
      }

      try {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${SITE_ORIGIN}/reset-password.html`,
        });
        if (error) throw error;

        showAuthMsg("ok", "Email envoyé ✅ (vérifie tes spams).");
      } catch (err) {
        showAuthMsg("err", err?.message || "Impossible d’envoyer l’email.");
      }
    });

    // Place order + Mollie
    $("order-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("place-order");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Traitement…";
      }

      try {
        // user obligatoire (JWT ON)
        const { data } = await sb.auth.getSession();
        const user = data?.session?.user;
        if (!user) throw new Error("Tu dois être connecté pour payer.");

        // cart + totals
        const cartNow = readCartSafe();
        if (!cartNow.length) throw new Error("Panier vide.");

        const totals = renderSummary(cartNow);
        const subtotalCents = totals.subtotalCents;
        const shippingCents = totals.shippingCents;
        const totalCents = totals.totalCents;
        const shippingMethod = totals.shippingMethod;

        // address validations
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

        if (!first_name || !last_name || !phone) throw new Error("Prénom / Nom / Téléphone obligatoires.");
        if (!country || !address1 || !city || !postal_code) throw new Error("Adresse incomplète.");

        // 1) créer commande
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

        // 2) items
        const items = cartNow.map((l) => {
          const qty = Number(l.qty || 1);

          let product_name = l.name || l.id || "Produit";
          let unit = Number(l.price || 0);

          const p = typeof window.findProduct === "function" ? window.findProduct(l.id) : null;
          if (p?.name) product_name = p.name;
          if (!unit && p) unit = typeof window.priceFor === "function" ? window.priceFor(p, l.optionId) : (p.price || 0);

          const unitCents = toCents(unit);

          return {
            order_id: order.id,
            product_id: l.id || null,
            product_name,
            option_id: l.optionId || null,
            qty,
            unit_price_cents: unitCents,
            line_total_cents: unitCents * qty,
          };
        });

        const itemsRes = await sb.from("order_items").insert(items);
        if (itemsRes.error) throw itemsRes.error;

        // 3) addresses
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

        // 4) payer Mollie
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
