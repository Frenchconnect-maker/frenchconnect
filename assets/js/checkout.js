/* ============================================================
   checkout.js — FrenchConnect (Supabase + Mollie) ✅
   - Login / logout / reset password
   - Crée orders + order_items + addresses
   - Appelle Edge Function: mollie-create-checkout (JWT ON)
   ============================================================ */

(() => {
  const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";
  const SITE_ORIGIN = "https://frenchconnect31.com";

  const $ = (id) => document.getElementById(id);

  const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
  const toCents = (eur) => Math.round(Number(eur) * 100);

  function cartRead() {
    if (typeof window.getCart === "function") return window.getCart() || [];
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
  }

  function cartSubtotalCents(cart) {
    let cents = 0;
    for (const l of cart) {
      const qty = Number(l.qty || 1);

      if (l.price != null) { cents += toCents(l.price) * qty; continue; }

      const p = (typeof window.findProduct === "function") ? window.findProduct(l.id) : null;
      const unit = p
        ? ((typeof window.priceFor === "function") ? window.priceFor(p, l.optionId) : (p.price || 0))
        : 0;

      cents += toCents(unit) * qty;
    }
    return cents;
  }

  function shippingSelected() {
    const el = document.querySelector('input[name="shipping"]:checked');
    return { method: el?.value || "relay", cents: Number(el?.dataset?.cents || 0) };
  }

  function msg(text, ok = false) {
    const box = $("msg");
    if (!box) return;
    box.style.display = "block";
    box.style.padding = "10px 12px";
    box.style.borderRadius = "12px";
    box.style.fontWeight = "700";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.background = ok ? "rgba(0,180,80,.12)" : "rgba(220,50,50,.12)";
    box.innerHTML = text;
  }
  function msgHide() {
    const box = $("msg");
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  }

  function authMsg(text, ok = false) {
    const box = $("auth-msg");
    if (!box) return;
    box.style.display = "block";
    box.style.marginTop = "12px";
    box.style.padding = "10px 12px";
    box.style.borderRadius = "12px";
    box.style.fontWeight = "700";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.background = ok ? "rgba(0,180,80,.12)" : "rgba(220,50,50,.12)";
    box.innerHTML = text;
  }
  function authMsgHide() {
    const box = $("auth-msg");
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  }

  function renderSummary() {
    const cart = cartRead();
    const ship = shippingSelected();

    const subtotalCents = cartSubtotalCents(cart);
    const totalCents = subtotalCents + ship.cents;

    if ($("cart-mini")) {
      const count = cart.reduce((s, l) => s + Number(l.qty || 1), 0);
      $("cart-mini").textContent = `${count} article(s)`;
    }

    if ($("order-lines")) {
      $("order-lines").innerHTML = cart.map((l) => {
        const qty = Number(l.qty || 1);

        let name = l.name || l.id || "Produit";
        let unit = Number(l.price || 0);

        const p = (typeof window.findProduct === "function") ? window.findProduct(l.id) : null;
        if (p?.name) name = p.name;
        if (!unit && p) unit = (typeof window.priceFor === "function") ? window.priceFor(p, l.optionId) : (p.price || 0);

        return `
          <tr>
            <td style="padding:8px 0;">
              <div style="font-weight:900;">${name}</div>
              <div class="muted-sm">x ${qty}</div>
            </td>
            <td style="padding:8px 0;text-align:right;font-weight:900;">${euro(unit * qty)}</td>
          </tr>`;
      }).join("");
    }

    $("subtotal") && ($("subtotal").textContent = euro(subtotalCents / 100));
    $("shipping") && ($("shipping").textContent = euro(ship.cents / 100));
    $("total") && ($("total").textContent = euro(totalCents / 100));

    return { cart, subtotalCents, totalCents, shippingCents: ship.cents, shippingMethod: ship.method };
  }

  async function mollieRedirect(sb, orderId, totalCents) {
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Tu dois être connecté (token manquant).");

    const res = await fetch(`${SUPABASE_URL}/functions/v1/mollie-create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: (totalCents / 100).toFixed(2),
        description: `Commande ${orderId}`,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const out = await res.json();
    const url = out?.url || out?._links?.checkout?.href;
    if (!url) throw new Error("Mollie n’a pas renvoyé d’URL checkout.");
    location.href = url;
  }

  async function refreshAuth(sb) {
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;

    if ($("auth-status")) $("auth-status").textContent = user ? `Connecté : ${user.email}` : "Non connecté";
    if ($("login-form")) $("login-form").style.display = user ? "none" : "block";

    const showLogout = user ? "" : "none";
    if ($("logoutBtn")) $("logoutBtn").style.display = showLogout;
    if ($("logoutBtnTop")) $("logoutBtnTop").style.display = showLogout;

    return user;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.supabase?.createClient) {
      msg("Supabase JS pas chargé → vérifie le script supabase.js dans checkout.html");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb; // debug

    // summary
    const cart = cartRead();
    if (!cart.length) {
      msg("Panier vide. Retourne à la boutique.");
      $("place-order")?.setAttribute("disabled", "disabled");
      return;
    }
    renderSummary();
    document.querySelectorAll('input[name="shipping"]').forEach((r) => r.addEventListener("change", renderSummary));

    // auth
    await refreshAuth(sb);
    sb.auth.onAuthStateChange(() => refreshAuth(sb));

    // login
    $("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      authMsgHide(); msgHide();

      const email = ($("login-email")?.value || "").trim().toLowerCase();
      const password = $("login-password")?.value || "";
      if (!email || !password) return authMsg("Email + mot de passe requis.");

      const btn = $("login-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Connexion…"; }

      const { error } = await sb.auth.signInWithPassword({ email, password });

      if (btn) { btn.disabled = false; btn.textContent = "Se connecter"; }

      if (error) return authMsg(error.message);
      authMsg("Connecté ✅", true);
      await refreshAuth(sb);
    });

    // reset password
    $("forgot-btn")?.addEventListener("click", async () => {
      authMsgHide();
      const email = ($("login-email")?.value || "").trim().toLowerCase();
      if (!email) return authMsg("Entre ton email puis clique à nouveau.");

      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_ORIGIN}/reset-password.html`,
      });
      if (error) return authMsg(error.message);
      authMsg("Email de reset envoyé ✅ (check spams).", true);
    });

    // logout (2 boutons possibles)
    ["logoutBtn", "logoutBtnTop"].forEach((id) => {
      const b = $(id);
      if (!b) return;
      b.addEventListener("click", async () => {
        await sb.auth.signOut();
        await refreshAuth(sb);
      });
    });

    // pay / create order
    $("order-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      msgHide();

      const { data: sess } = await sb.auth.getSession();
      const user = sess?.session?.user;
      if (!user) return msg("Tu dois être connecté pour payer.");

      const btn = $("place-order");
      if (btn) { btn.disabled = true; btn.textContent = "Traitement…"; }

      try {
        const totals = renderSummary();
        const first_name = ($("first_name")?.value || "").trim();
        const last_name = ($("last_name")?.value || "").trim();
        const phone = ($("phone")?.value || "").trim();
        const country = ($("country")?.value || "").trim();
        const address1 = ($("address1")?.value || "").trim();
        const city = ($("city")?.value || "").trim();
        const postal_code = ($("postal_code")?.value || "").trim();

        if (!first_name || !last_name || !phone) throw new Error("Prénom / Nom / Téléphone obligatoires.");
        if (!country || !address1 || !city || !postal_code) throw new Error("Adresse incomplète.");

        const { data: order, error: oerr } = await sb
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending_payment",
            currency: "EUR",
            subtotal_cents: totals.subtotalCents,
            shipping_cents: totals.shippingCents,
            total_cents: totals.totalCents,
            shipping_method: totals.shippingMethod,
            note: ($("note")?.value || "").trim() || null,
          })
          .select()
          .single();
        if (oerr) throw oerr;

        const items = totals.cart.map((l) => {
          const qty = Number(l.qty || 1);

          let product_name = l.name || l.id || "Produit";
          let unit = Number(l.price || 0);
          const p = (typeof window.findProduct === "function") ? window.findProduct(l.id) : null;
          if (p?.name) product_name = p.name;
          if (!unit && p) unit = (typeof window.priceFor === "function") ? window.priceFor(p, l.optionId) : (p.price || 0);

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

        const { error: ierr } = await sb.from("order_items").insert(items);
        if (ierr) throw ierr;

        const addrBase = {
          order_id: order.id,
          first_name,
          last_name,
          company: ($("company")?.value || "").trim() || null,
          country,
          address1,
          address2: ($("address2")?.value || "").trim() || null,
          city,
          postal_code,
          email: user.email,
          phone,
        };
        const { error: aerr } = await sb.from("addresses").insert([
          { type: "billing", ...addrBase },
          { type: "shipping", ...addrBase },
        ]);
        if (aerr) throw aerr;

        msg(`Commande créée ✅ Redirection Mollie… (ID: <b>${order.id}</b>)`, true);
        await mollieRedirect(sb, order.id, totals.totalCents);
      } catch (err) {
        msg(err?.message || "Erreur paiement");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Payer avec Mollie"; }
      }
    });
  });
})();
