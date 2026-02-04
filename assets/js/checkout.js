/* ============================================================
   checkout.js — FrenchConnect (Supabase + Mollie) ✅
   - 1ère commande: création compte obligatoire (email+mdp dans le même formulaire)
   - Déjà client: login possible
   - profiles rempli (plus de null)
   - orders + order_items + addresses
   - Mollie Edge Function: mollie-create-checkout (JWT ON)
   ============================================================ */

(() => {
  const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

  const SITE_ORIGIN = "https://frenchconnect31.com";
  const $ = (id) => document.getElementById(id);

  const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
  const toCents = (eur) => Math.round(Number(eur) * 100);

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

  function showAuthMsg(type, text) {
    const box = $("auth-msg");
    if (!box) return;
    box.style.display = "block";
    box.style.padding = "10px 12px";
    box.style.borderRadius = "12px";
    box.style.fontWeight = "700";
    box.style.border = "1px solid rgba(255,255,255,.12)";
    box.style.background =
      type === "ok" ? "rgba(0,180,80,.12)" : "rgba(220,50,50,.12)";
    box.innerHTML = text;
  }
  function hideAuthMsg() {
    const box = $("auth-msg");
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  }

  function readCartSafe() {
    if (typeof window.getCart === "function") return window.getCart() || [];
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  }

  function getSelectedShipping() {
    const el = document.querySelector('input[name="shipping"]:checked');
    return {
      method: el?.value || "relay",
      cents: Number(el?.dataset?.cents || 0),
    };
  }

  function calcSubtotalCents(cart) {
    let cents = 0;

    cart.forEach((line) => {
      const qty = Number(line.qty || 1);

      if (line.price != null) {
        cents += toCents(line.price) * qty;
        return;
      }

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

          return `
            <tr>
              <td style="padding:8px 0;">
                <div style="font-weight:900;">${name}</div>
                <div class="muted-sm">x ${qty}</div>
              </td>
              <td style="padding:8px 0;text-align:right;font-weight:900;">${euro(unit * qty)}</td>
            </tr>`;
        })
        .join("");
    }

    $("subtotal") && ($("subtotal").textContent = euro(subtotalCents / 100));
    $("shipping") && ($("shipping").textContent = euro(ship.cents / 100));
    $("total") && ($("total").textContent = euro(totalCents / 100));

    return {
      subtotalCents,
      shippingCents: ship.cents,
      totalCents,
      shippingMethod: ship.method,
    };
  }

  async function refreshAuthUI(sb) {
    const status = $("auth-status");
    const loginForm = $("login-form");
    const logoutBtn = $("logoutBtn");

    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;

    if (user) {
      if (status) status.textContent = `Connecté : ${user.email}`;
      if (loginForm) loginForm.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-flex";
    } else {
      if (status) status.textContent = "Non connecté";
      if (loginForm) loginForm.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
    return user;
  }

  // ✅ 1ère commande: création compte obligatoire via signup-email/signup-password
  async function ensureUserOrCreate(sb) {
    const { data } = await sb.auth.getSession();
    const existing = data?.session?.user;
    if (existing) return existing;

    // On prend les champs "création compte" (dans le même bloc commande)
    const email = ($("signup-email")?.value || "").trim().toLowerCase();
    const password = $("signup-password")?.value || "";

    if (!email || !password) {
      throw new Error("Entre ton email + mot de passe (création de compte obligatoire).");
    }

    // signup
    const signUp = await sb.auth.signUp({ email, password });

    // Si email existe déjà => sign in
    const msg = signUp?.error?.message?.toLowerCase?.() || "";
    const already =
      msg.includes("already") || msg.includes("exists") || msg.includes("registered");

    if (signUp.error && already) {
      const signIn = await sb.auth.signInWithPassword({ email, password });
      if (signIn.error) throw signIn.error;
    } else if (signUp.error) {
      throw signUp.error;
    }

    // session ?
    const { data: after } = await sb.auth.getSession();
    const u2 = after?.session?.user || null;

    // Si confirm email activée => pas de session
    if (!u2) {
      throw new Error(
        "Compte créé ✅ Mais la confirmation email est activée.\nConfirme l’email, puis reviens te connecter pour payer."
      );
    }
    return u2;
  }

  async function upsertProfile(sb, userId, email, first_name, last_name, phone) {
    const { error } = await sb.from("profiles").upsert(
      {
        id: userId,
        email: email || null,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  async function startMollieCheckout(sb, orderId, totalCents) {
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Token manquant (connecte-toi).");

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

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Edge Function (${res.status}) : ${text}`);
    }

    const out = await res.json();
    const url = out?.url || out?._links?.checkout?.href;
    if (!url) throw new Error("Mollie n’a pas renvoyé d’URL de paiement.");

    window.location.href = url;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.supabase?.createClient) {
      showMsg("err", "Supabase JS n’est pas chargé (script CDN manquant).");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb;

    // panier
    const cart = readCartSafe();
    if (!cart.length) {
      showMsg("err", "Panier vide. Retourne à la boutique.");
      $("place-order")?.setAttribute("disabled", "disabled");
      return;
    }

    renderSummary(cart);
    document.querySelectorAll('input[name="shipping"]').forEach((r) => {
      r.addEventListener("change", () => renderSummary(readCartSafe()));
    });

    // auth
    await refreshAuthUI(sb);
    sb.auth.onAuthStateChange(() => refreshAuthUI(sb));

    // logout
    $("logoutBtn")?.addEventListener("click", async () => {
      hideAuthMsg();
      await sb.auth.signOut();
      await refreshAuthUI(sb);
    });

    // login (déjà client)
    $("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAuthMsg();
      hideMsg();

      const email = ($("login-email")?.value || "").trim().toLowerCase();
      const password = $("login-password")?.value || "";
      if (!email || !password) return showAuthMsg("err", "Email + mot de passe requis.");

      const btn = $("login-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Connexion…";
      }

      try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showAuthMsg("ok", "Connecté ✅");
        await refreshAuthUI(sb);
      } catch (e2) {
        showAuthMsg("err", e2?.message || "Erreur connexion");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Se connecter";
        }
      }
    });

    // reset password
    $("forgot-btn")?.addEventListener("click", async () => {
      hideAuthMsg();
      const email = ($("login-email")?.value || "").trim().toLowerCase();
      if (!email) return showAuthMsg("err", "Entre ton email puis clique à nouveau.");

      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_ORIGIN}/reset-password.html`,
      });
      if (error) return showAuthMsg("err", error.message);
      showAuthMsg("ok", "Email de reset envoyé ✅ (check spams).");
    });

    // payer
    $("order-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("place-order");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Traitement…";
      }

      try {
        const cartNow = readCartSafe();
        if (!cartNow.length) throw new Error("Panier vide.");

        const totals = renderSummary(cartNow);

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

        // ✅ création compte obligatoire si pas connecté
        const user = await ensureUserOrCreate(sb);
        await refreshAuthUI(sb);

        // ✅ profiles rempli
        await upsertProfile(sb, user.id, user.email, first_name, last_name, phone);

        // order
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
            note: note || null,
          })
          .select()
          .single();
        if (oerr) throw oerr;

        // items
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

        const { error: ierr } = await sb.from("order_items").insert(items);
        if (ierr) throw ierr;

        // addresses
        const addrBase = {
          order_id: order.id,
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

        const { error: aerr } = await sb.from("addresses").insert([
          { type: "billing", ...addrBase },
          { type: "shipping", ...addrBase },
        ]);
        if (aerr) throw aerr;

        showMsg("ok", `Commande créée ✅ Redirection Mollie… (ID: <b>${order.id}</b>)`);

        await startMollieCheckout(sb, order.id, totals.totalCents);
      } catch (e2) {
        console.error(e2);
        showMsg("err", e2?.message || "Erreur paiement");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Payer avec Mollie";
        }
      }
    });
  });
})();
