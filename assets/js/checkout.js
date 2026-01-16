/* ============================================================
   checkout.js — FrenchConnect (Supabase + Mollie) ✅ SANS STRIPE
   - Lit le panier depuis store.js (localStorage)
   - UI login + statut + logout + mot de passe oublié
   - Crée commande: orders + order_items + addresses
   - Appelle Edge Function: mollie-create-checkout
   - Redirige vers Mollie
   ============================================================ */

(function () {
  // ============================================================
  // 0) CONFIG
  // ============================================================
  // ✅ Si tu as déjà ces 2 valeurs dans store.js, tu peux supprimer ces 2 lignes
  window.SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  window.SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

  // ⚠️ Mets ICI ton domaine canonique (celui avec SSL OK). Évite www si ton SSL est sans www.
  const SITE_ORIGIN = "https://frenchconnect31.com";

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  const $ = (id) => document.getElementById(id);

  // ============================================================
  // 1) HELPERS
  // ============================================================
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

  function setBtn(btn, loading, textWhenIdle, textWhenLoading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.textContent = loading ? textWhenLoading : textWhenIdle;
  }

  // ============================================================
  // 2) UI (si les éléments n’existent pas, on crée un bloc propre)
  // ============================================================
  function ensureAuthUI() {
    // Si ton checkout.html a déjà login-card/auth-mini/logoutBtn, on ne recrée pas.
    if ($("auth-mini") && $("login-card") && $("logoutBtn")) return;

    const host =
      document.querySelector(".checkout-wrap") ||
      document.querySelector("main") ||
      document.body;

    const wrap = document.createElement("section");
    wrap.id = "auth-card";
    wrap.style.margin = "14px 0";
    wrap.style.padding = "14px";
    wrap.style.borderRadius = "14px";
    wrap.style.border = "1px solid rgba(255,255,255,.10)";
    wrap.style.background = "rgba(0,0,0,.18)";
    wrap.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
        <div>
          <div style="font-weight:900;">Compte</div>
          <div id="auth-mini" style="opacity:.9;font-weight:700;">—</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button id="logoutBtn" type="button" style="display:none;" class="btn btn-ghost">Se déconnecter</button>
        </div>
      </div>

      <div id="login-card" style="margin-top:12px;">
        <form id="login-form" style="display:grid;gap:10px;">
          <div style="display:grid;gap:8px;grid-template-columns:1fr 1fr;flex-wrap:wrap;">
            <input id="login-email" type="email" placeholder="Email" autocomplete="email" required />
            <input id="login-password" type="password" placeholder="Mot de passe" autocomplete="current-password" required />
          </div>

          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button id="login-btn" type="submit" class="btn">Se connecter</button>
            <button id="forgot-btn" type="button" class="btn btn-ghost">Mot de passe oublié</button>
          </div>

          <div id="forgot-box" style="display:none; margin-top:8px; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.10); background:rgba(0,0,0,.14);">
            <div style="font-weight:900; margin-bottom:8px;">Réinitialiser le mot de passe</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <input id="forgot-email" type="email" placeholder="Ton email" autocomplete="email" style="flex:1;min-width:220px;" />
              <button id="forgot-send" type="button" class="btn">Envoyer le lien</button>
            </div>
            <div style="opacity:.85;margin-top:6px;font-size:13px;">
              Tu recevras un email pour changer ton mot de passe.
            </div>
          </div>
        </form>
      </div>
    `;

    // Petit style inputs si ton CSS n’en a pas
    const style = document.createElement("style");
    style.textContent = `
      #auth-card input{
        padding:12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(0,0,0,.18);
        color:inherit;
        outline:none;
      }
      #auth-card input:focus{ border-color: rgba(255,255,255,.28); }
      #auth-card .btn{
        padding:10px 14px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.12);
        color:inherit;
        font-weight:900;
        cursor:pointer;
      }
      #auth-card .btn.btn-ghost{
        background:transparent;
      }
      #auth-card .btn:disabled{ opacity:.6; cursor:not-allowed; }
    `;
    document.head.appendChild(style);

    // On place le bloc au début du checkout (avant le formulaire commande si possible)
    const orderForm = $("order-form");
    if (orderForm && orderForm.parentNode) {
      orderForm.parentNode.insertBefore(wrap, orderForm);
    } else {
      host.insertBefore(wrap, host.firstChild);
    }
  }

  // ============================================================
  // 3) CART
  // ============================================================
  function getSelectedShipping() {
    const el = document.querySelector('input[name="shipping"]:checked');
    return {
      method: el?.value || "relay",
      cents: Number(el?.dataset?.cents || 0),
    };
  }

  function readCartSafe() {
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

    return {
      subtotalCents,
      shippingCents: ship.cents,
      totalCents,
      shippingMethod: ship.method,
    };
  }

  // ============================================================
  // 4) AUTH
  // ============================================================
  async function hydrateAuthUI(sb) {
  const authMini = $("auth-mini");
  const loginCard = $("login-card");
  const logoutBtn = $("logoutBtn");

  // Sécurité visuelle immédiate
  if (authMini) authMini.textContent = "Non connecté";

  const { data, error } = await sb.auth.getSession();
  if (error) {
    console.error("Auth error:", error);
    return null;
  }

  const user = data?.session?.user || null;

  if (user) {
    if (authMini) authMini.textContent = `Connecté : ${user.email}`;
    if (loginCard) loginCard.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (authMini) authMini.textContent = "Non connecté";
    if (loginCard) loginCard.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  return user;
}


  async function doPasswordReset(sb, email) {
    // Tu peux créer une page reset si tu veux (facultatif)
    // Exemple: https://frenchconnect31.com/reset-password.html
    const redirectTo = `${SITE_ORIGIN}/reset-password.html`;

    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  // ============================================================
  // 5) MOLLIE CHECKOUT (Edge Function)
  // ============================================================
  async function startMollieCheckout(sb, orderId, totalCents) {
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error("Tu dois être connecté pour payer (session/token manquant).");
    }

    const payload = {
      amount: (totalCents / 100).toFixed(2),
      description: `Commande ${orderId}`,
      order_id: orderId,
    };

    // ✅ Appel direct + headers (fonctionne même si Verify JWT = ON)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/mollie-create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      // Si JWT invalide -> solution: se déconnecter/reconnecter
      if (res.status === 401) {
        throw new Error(
          `Accès refusé (401). Déconnecte-toi puis reconnecte-toi, puis réessaie.\n\nDétail: ${text}`
        );
      }
      throw new Error(`Edge Function error ${res.status}: ${text}`);
    }

    const data = await res.json();

    const url =
      data?.url ||
      data?._links?.checkout?.href ||
      data?._links?.checkout?.url;

    if (!url) throw new Error("URL Mollie introuvable (réponse Edge Function).");

    window.location.href = url;
  }

  // ============================================================
  // 6) INIT
  // ============================================================
  async function init() {
    window.__CHECKOUT_LOADED__ = true;

    ensureAuthUI();

    if (!window.supabase?.createClient) {
      showMsg("err", "Supabase JS n’est pas chargé. Vérifie le script CDN supabase.js dans checkout.html.");
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 20) {
      showMsg("err", "SUPABASE_URL / SUPABASE_ANON_KEY manquants. Mets la vraie ANON KEY (eyJ...).");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb; // debug console

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
      hideMsg();
      await sb.auth.signOut();
      showMsg("ok", "Déconnecté ✅");
      await hydrateAuthUI(sb);
    });

    // Login
    $("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("login-btn");
      setBtn(btn, true, "Se connecter", "Connexion…");

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
        setBtn(btn, false, "Se connecter", "Connexion…");
      }
    });

    // Mot de passe oublié (toggle + envoi)
    $("forgot-btn")?.addEventListener("click", () => {
      const box = $("forgot-box");
      if (!box) return;
      box.style.display = box.style.display === "none" ? "block" : "none";

      // pré-remplir avec email login si dispo
      const loginEmail = ($("login-email")?.value || "").trim().toLowerCase();
      if (loginEmail && $("forgot-email")) $("forgot-email").value = loginEmail;
    });

    $("forgot-send")?.addEventListener("click", async () => {
      hideMsg();
      const email = ($("forgot-email")?.value || "").trim().toLowerCase();
      if (!email) {
        showMsg("err", "Entre ton email pour recevoir le lien.");
        return;
      }

      const btn = $("forgot-send");
      setBtn(btn, true, "Envoyer le lien", "Envoi…");

      try {
        await doPasswordReset(sb, email);
        showMsg("ok", "Email envoyé ✅ Regarde ta boîte mail (et spam).");
      } catch (err) {
        showMsg("err", err?.message || "Impossible d’envoyer l’email");
      } finally {
        setBtn(btn, false, "Envoyer le lien", "Envoi…");
      }
    });

    // Place order (Mollie)
    $("order-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg();

      const btn = $("place-order");
      setBtn(btn, true, "Payer avec Mollie", "Traitement…");

      try {
        // 1) user connecté obligatoire
        const { data } = await sb.auth.getSession();
        const user = data?.session?.user;
        if (!user) throw new Error("Tu dois être connecté pour payer (section Compte).");

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

        if (!first_name || !last_name || !phone) {
          throw new Error("Prénom / Nom / Téléphone obligatoires.");
        }
        if (!country || !address1 || !city || !postal_code) {
          throw new Error("Adresse incomplète.");
        }

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
        setBtn(btn, false, "Payer avec Mollie", "Traitement…");
      }
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
