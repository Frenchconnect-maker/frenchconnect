/* ============================================================
   success.js — FrenchConnect (Supabase + Mollie)
   - Lit order_id depuis l’URL
   - Vérifie que l’utilisateur est connecté
   - Va lire la commande dans Supabase et affiche le statut
   - Nettoie le panier si payé
   ============================================================ */

(function () {
  // ⚠️ Mets les mêmes valeurs que checkout.js
  window.SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
  window.SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  const $ = (id) => document.getElementById(id);

  function setUI(title, text, ok = true) {
    const msg = $("msg");
    const details = $("details");
    if (!msg || !details) return;

    msg.style.border = "1px solid rgba(255,255,255,.12)";
    msg.style.background = ok ? "rgba(0,180,80,.10)" : "rgba(220,50,50,.10)";

    msg.querySelector("div")?.remove?.(); // safe no-op
    // On garde simple : on change juste le texte
    msg.firstElementChild.textContent = title;
    details.textContent = text;
  }

  function getOrderId() {
    const u = new URL(location.href);
    return (
      u.searchParams.get("order_id") ||
      u.searchParams.get("orderId") ||
      u.searchParams.get("id") ||
      ""
    ).trim();
  }

  async function init() {
    if (!window.supabase?.createClient) {
      setUI("Erreur", "Supabase JS n’est pas chargé.", false);
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setUI("Erreur", "SUPABASE_URL / SUPABASE_ANON_KEY manquants.", false);
      return;
    }

    const orderId = getOrderId();
    if (!orderId) {
      setUI("Paiement", "order_id manquant dans l’URL. Retour au checkout.", false);
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Si l’utilisateur n’est pas connecté, on ne pourra souvent pas lire la commande (RLS)
    const { data: sess } = await sb.auth.getSession();
    const user = sess?.session?.user;

    if (!user) {
      setUI(
        "Connexion requise",
        "Reconnecte-toi (même email que l’achat) pour afficher le statut de ta commande.",
        false
      );
      return;
    }

    // On lit la commande (RLS doit autoriser user_id = auth.uid())
    const { data: order, error } = await sb
      .from("orders")
      .select("id,status,total_cents,currency,created_at")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      setUI(
        "Commande introuvable",
        "Impossible de retrouver la commande. Vérifie que tu es connecté avec le bon compte.",
        false
      );
      return;
    }

    // Affichage selon status
    const status = String(order.status || "");
    const total = (Number(order.total_cents || 0) / 100).toFixed(2);

    if (status === "paid" || status === "paid_ok" || status === "succeeded") {
      // Nettoyage panier
      try {
        localStorage.removeItem("cart");
      } catch {}

      setUI(
        "Paiement confirmé ✅",
        `Commande ${order.id} — ${total} ${order.currency || "EUR"}`
      );
      return;
    }

    if (status === "pending_payment") {
      setUI(
        "Paiement en attente…",
        `Commande ${order.id} — Mollie n’a pas encore confirmé. Actualise dans 10 secondes.`,
        false
      );
      return;
    }

    if (status === "canceled" || status === "failed") {
      setUI(
        "Paiement annulé / refusé",
        `Commande ${order.id} — Tu peux recommencer depuis le checkout.`,
        false
      );
      return;
    }

    setUI(
      "Statut commande",
      `Commande ${order.id} — Statut: ${status}`,
      status === "paid"
    );
  }

  window.addEventListener("DOMContentLoaded", init);
})();
