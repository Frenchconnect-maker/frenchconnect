/* ============================================================
   account.js — FrenchConnect (Supabase)
   - Login / logout / reset password
   - Profile: load + edit + upsert (évite les NULL)
   - Orders: list + items + status + tracking link
   ============================================================ */

(() => {
  const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

  const SITE_ORIGIN = "https://frenchconnect31.com";

  const $ = (id) => document.getElementById(id);

  const euro = (cents) => `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} €`;

  function showBox(id, type, html) {
    const el = $(id);
    if (!el) return;
    el.style.display = "block";
    el.classList.remove("ok", "err");
    el.classList.add(type === "ok" ? "ok" : "err");
    el.innerHTML = html;
  }
  function hideBox(id) {
    const el = $(id);
    if (!el) return;
    el.style.display = "none";
    el.innerHTML = "";
  }

  function statusLabel(order) {
    const s = (order?.status || "").toLowerCase();
    if (!s) return "inconnu";
    if (s === "paid") return "payée";
    if (s === "pending_payment") return "en attente paiement";
    if (s === "canceled") return "annulée";
    if (s === "failed") return "échec paiement";
    if (s === "shipped") return "expédiée";
    if (s === "delivered") return "livrée";
    return s;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  async function refreshAuth(sb) {
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user || null;

    $("auth-status") && ($("auth-status").textContent = user ? `Connecté : ${user.email}` : "Non connecté");
    $("login-form") && ($("login-form").style.display = user ? "none" : "block");
    $("logoutBtn") && ($("logoutBtn").style.display = user ? "" : "none");
    $("profile-card") && ($("profile-card").style.display = user ? "" : "none");
    $("orders-card") && ($("orders-card").style.display = user ? "" : "none");

    return user;
  }

  async function loadProfile(sb, user) {
    // Charge profile
    const res = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (res.error) throw res.error;

    const p = res.data || {};

    // Si vide -> upsert minimal (évite "tout null" dans profiles)
    if (!res.data) {
      const up = await sb.from("profiles").upsert(
        { id: user.id, email: user.email },
        { onConflict: "id" }
      );
      if (up.error) throw up.error;
    }

    $("p_email") && ($("p_email").value = user.email || p.email || "");
    $("p_first_name") && ($("p_first_name").value = p.first_name || "");
    $("p_last_name") && ($("p_last_name").value = p.last_name || "");
    $("p_phone") && ($("p_phone").value = p.phone || "");
  }

  async function saveProfile(sb, user) {
    const first_name = ($("p_first_name")?.value || "").trim();
    const last_name = ($("p_last_name")?.value || "").trim();
    const phone = ($("p_phone")?.value || "").trim();

    const up = await sb.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
      },
      { onConflict: "id" }
    );
    if (up.error) throw up.error;
  }

  async function loadOrders(sb, user) {
    // On fait select("*") pour éviter de casser si une colonne n’existe pas
    const oRes = await sb
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (oRes.error) throw oRes.error;

    const orders = oRes.data || [];
    const wrap = $("orders");
    const empty = $("orders-empty");

    if (!wrap) return;

    if (orders.length === 0) {
      wrap.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";

    // Items (1 requête)
    const orderIds = orders.map((o) => o.id);
    const iRes = await sb
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    const itemsByOrder = {};
    (iRes.data || []).forEach((it) => {
      const k = it.order_id;
      if (!itemsByOrder[k]) itemsByOrder[k] = [];
      itemsByOrder[k].push(it);
    });

    wrap.innerHTML = orders
      .map((o) => {
        const items = itemsByOrder[o.id] || [];
        const trackingUrl = o.tracking_url || o.shipping_tracking_url || null;
        const trackingCode = o.tracking_code || o.tracking_number || o.shipping_tracking_code || null;

        const trackingHtml = trackingUrl
          ? `<div class="line"><span class="muted-sm">Suivi</span><a class="btn ghost" href="${trackingUrl}" target="_blank" rel="noopener">Voir le suivi</a></div>`
          : trackingCode
            ? `<div class="line"><span class="muted-sm">Suivi</span><span style="font-weight:900;">${trackingCode}</span></div>`
            : `<div class="muted-sm" style="margin-top:8px;">Suivi : pas encore disponible</div>`;

        const itemsHtml = items.length
          ? items
              .map(
                (it) => `
                <div class="item">
                  <span>${it.product_name || it.product_id || "Produit"} <span class="muted-sm">× ${it.qty || 1}</span></span>
                  <span style="font-weight:900;">${euro(it.line_total_cents || 0)}</span>
                </div>`
              )
              .join("")
          : `<div class="muted-sm">Détail articles indisponible</div>`;

        return `
          <div class="order">
            <div class="order-top">
              <div>
                <div style="font-weight:1000;">Commande #${o.id}</div>
                <div class="muted-sm">${fmtDate(o.created_at)}</div>
              </div>
              <div class="badge">${statusLabel(o)}</div>
            </div>

            <div class="line">
              <span class="muted-sm">Total</span>
              <span style="font-weight:1000;">${euro(o.total_cents || 0)}</span>
            </div>

            ${trackingHtml}

            <div class="items">
              <div style="font-weight:1000;margin-bottom:6px;">Articles</div>
              ${itemsHtml}
            </div>
          </div>
        `;
      })
      .join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.supabase?.createClient) {
      showBox("msg", "err", "Supabase JS pas chargé → vérifie le script supabase.js dans account.html");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb; // debug

    // Auth state
    let user = await refreshAuth(sb);

    sb.auth.onAuthStateChange(async () => {
      hideBox("msg");
      hideBox("auth-msg");
      user = await refreshAuth(sb);
      if (user) {
        try {
          await loadProfile(sb, user);
          await loadOrders(sb, user);
        } catch (e) {
          showBox("msg", "err", e?.message || "Erreur chargement compte");
        }
      }
    });

    // If already logged in -> load
    if (user) {
      try {
        await loadProfile(sb, user);
        await loadOrders(sb, user);
      } catch (e) {
        showBox("msg", "err", e?.message || "Erreur chargement compte");
      }
    }

    // Login
    $("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideBox("auth-msg");

      const email = ($("login-email")?.value || "").trim().toLowerCase();
      const password = $("login-password")?.value || "";
      if (!email || !password) {
        showBox("auth-msg", "err", "Email + mot de passe requis.");
        return;
      }

      const btn = $("login-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Connexion…"; }

      const { error } = await sb.auth.signInWithPassword({ email, password });

      if (btn) { btn.disabled = false; btn.textContent = "Se connecter"; }

      if (error) {
        showBox("auth-msg", "err", error.message);
        return;
      }

      showBox("auth-msg", "ok", "Connecté ✅");
    });

    // Reset password
    $("forgot-btn")?.addEventListener("click", async () => {
      hideBox("auth-msg");

      const email = ($("login-email")?.value || "").trim().toLowerCase();
      if (!email) {
        showBox("auth-msg", "err", "Entre ton email puis clique à nouveau.");
        return;
      }

      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_ORIGIN}/reset-password.html`,
      });

      if (error) {
        showBox("auth-msg", "err", error.message);
        return;
      }
      showBox("auth-msg", "ok", "Email envoyé ✅ (vérifie tes spams).");
    });

    // Logout
    $("logoutBtn")?.addEventListener("click", async () => {
      await sb.auth.signOut();
    });

    // Save profile
    $("profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideBox("msg");

      const { data } = await sb.auth.getSession();
      const u = data?.session?.user;
      if (!u) {
        showBox("msg", "err", "Tu dois être connecté.");
        return;
      }

      const btn = $("save-profile");
      if (btn) { btn.disabled = true; btn.textContent = "Enregistrement…"; }

      try {
        await saveProfile(sb, u);
        showBox("msg", "ok", "Infos enregistrées ✅");
      } catch (err) {
        showBox("msg", "err", err?.message || "Erreur enregistrement profil");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Enregistrer"; }
      }
    });
  });
})();

