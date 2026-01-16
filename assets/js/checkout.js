/* =========================================================
   checkout.js — FrenchConnect (Supabase + Mollie)
   - Utilise window.SUPABASE_URL + window.SUPABASE_KEY venant de store.js
   - Appelle Edge Function: mollie-create-checkout
   ========================================================= */

(() => {
  // ---- 1) CONFIG depuis store.js ----
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_KEY; // ⚠️ doit être l'ANON KEY (eyJ...), pas sb_publishable

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ SUPABASE_URL / SUPABASE_KEY manquants. Vérifie store.js.");
    return;
  }

  // Supabase CDN (umd) expose window.supabase
  if (!window.supabase?.createClient) {
    console.error("❌ Supabase JS non chargé. Vérifie l'ordre des <script> dans checkout.html.");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ---- 2) Helpers ----
  const $ = (sel) => document.querySelector(sel);

  function readCart() {
    try {
      const raw = localStorage.getItem("cart") || "[]";
      const cart = JSON.parse(raw);
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function cartTotal(cart) {
    // attend des items { price, qty } ou { price, quantity }
    return cart.reduce((sum, it) => {
      const price = Number(it.price || 0);
      const qty = Number(it.qty ?? it.quantity ?? 1);
      return sum + price * qty;
    }, 0);
  }

  function euros(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  // ---- 3) Bouton "Payer" ----
  // ⚠️ Adapte l'ID au bouton de ton checkout.html
  const payBtn = $("#payBtn") || $("#pay-button") || $("button[type='submit']");

  if (!payBtn) {
    console.warn("⚠️ Bouton payer introuvable. Mets un id='payBtn' sur ton bouton de paiement.");
    return;
  }

  payBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      payBtn.disabled = true;

      // A) Récup panier
      const cart = readCart();
      if (!cart.length) {
        alert("Ton panier est vide.");
        return;
      }

      const total = cartTotal(cart);
      if (total <= 0) {
        alert("Total invalide.");
        return;
      }

      // B) Session user
      const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
      if (sessionErr) throw sessionErr;

      const session = sessionData?.session;
      if (!session?.user) {
        alert("Tu dois être connecté pour payer (compte).");
        return;
      }

      // C) Créer la commande en DB (adapte si tes tables ont d'autres colonnes)
      // orders: id (uuid), user_id, total, status, created_at...
      const { data: order, error: orderErr } = await sb
        .from("orders")
        .insert({
          user_id: session.user.id,
          total: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // order_items: order_id, name, price, qty...
      const itemsPayload = cart.map((it) => ({
        order_id: order.id,
        name: it.name || it.title || "Produit",
        price: Number(it.price || 0),
        qty: Number(it.qty ?? it.quantity ?? 1),
      }));

      const { error: itemsErr } = await sb.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // D) Appel Edge Function Mollie
      const { data, error } = await sb.functions.invoke("mollie-create-checkout", {
        body: {
          amount: euros(total),
          description: `Commande ${order.id}`,
          orderId: order.id,
        },
      });

      if (error) throw error;

      // E) Redirection Mollie
      // Selon ton edge function, ça peut être: data.checkoutUrl ou data._links.checkout.href
      const checkoutUrl =
        data?.checkoutUrl ||
        data?._links?.checkout?.href ||
        data?.paymentUrl;

      if (!checkoutUrl) {
        console.error("Réponse edge function:", data);
        throw new Error("checkoutUrl manquant dans la réponse Mollie.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Erreur paiement. Regarde la console (F12) + logs Supabase Function.");
    } finally {
      payBtn.disabled = false;
    }
  });
})();
