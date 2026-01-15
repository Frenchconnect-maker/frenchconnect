/* =========================================
   CHECKOUT — MOLLIE (SANS STRIPE)
   - Crée commande Supabase
   - Appelle Edge Function mollie-create-checkout
   - Redirige vers Mollie
========================================= */

const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."; // ⚠️ TA VRAIE ANON KEY

window.addEventListener("DOMContentLoaded", initCheckout);


const $ = (id) => document.getElementById(id);

function cents(eur) {
  return Math.round(Number(eur) * 100);
}

/* =========================
   MOLLIE CHECKOUT
========================= */
async function startMollieCheckout(sb, orderId) {
  const { data, error } = await sb.functions.invoke(
    "mollie-create-checkout",
    {
      body: { order_id: orderId },
    }
  );

  if (error) throw new Error(error.message || "Erreur Mollie");

  if (!data?.url) throw new Error("URL Mollie manquante");

  window.location.href = data.url;
}

/* =========================
   INIT
========================= */
async function initCheckout() {
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (!cart.length) {
    alert("Panier vide");
    return;
  }

  $("place-order").addEventListener("click", async () => {
    try {
      // 1️⃣ utilisateur
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session?.user)
        throw new Error("Tu dois être connecté pour payer");

      const user = session.user;

      // 2️⃣ calcul total
      let subtotal = 0;
      cart.forEach((l) => {
        subtotal += Number(l.price) * Number(l.qty);
      });

      const totalCents = cents(subtotal);

      // 3️⃣ créer commande
      const { data: order, error: orderErr } = await sb
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending_payment",
          currency: "EUR",
          total_cents: totalCents,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 4️⃣ items
      const items = cart.map((l) => ({
        order_id: order.id,
        product_name: l.name,
        qty: l.qty,
        unit_price_cents: cents(l.price),
        line_total_cents: cents(l.price) * l.qty,
      }));

      await sb.from("order_items").insert(items);

      // 5️⃣ payer via Mollie
      await startMollieCheckout(sb, order.id);
    } catch (e) {
      alert(e.message);
      console.error(e);
    }
  });
}
