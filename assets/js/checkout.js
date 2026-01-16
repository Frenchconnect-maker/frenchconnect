/* =========================================================
   checkout.js — FrenchConnect (Supabase + Mollie)
   - Login / Signup
   - Crée une commande (orders + order_items)
   - Appelle Edge Function: mollie-create-checkout (Mollie)
   - Compatible panier localStorage (cart)
   ========================================================= */

/* ================================
   1) CONFIG — A REMPLIR
================================ */
const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ"; // commence par "eyJ..."
const FUNCTION_MOLLIE_CREATE_CHECKOUT =
  "https://mnsqfagfdahvhlfopfah.supabase.co/functions/v1/mollie-create-checkout";

const SITE_URL = "https://www.frenchconnect31.com"; // important pour redirect_url

/* ================================
   2) SUPABASE CLIENT
================================ */
if (!window.supabase?.createClient) {
  console.error(
    "Supabase JS non chargé. Ajoute le script CDN supabase-js v2 avant checkout.js."
  );
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================================
   3) HELPERS
================================ */
const $ = (sel) => document.querySelector(sel);

function euros(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

function readCart() {
  // Compatible store.js / panier localStorage
  // Essaye plusieurs clés fréquentes
  const keys = ["cart", "panier", "fc_cart", "store_cart"];
  for (const k of keys) {
    try {
      const v = localStorage.getItem(k);
      if (!v) continue;
      const parsed = JSON.parse(v);
      // Accepte soit {items:[...]} soit [...]
      const items = Array.isArray(parsed) ? parsed : parsed?.items;
      if (Array.isArray(items) && items.length) return { key: k, items };
    } catch (_) {}
  }
  return { key: "cart", items: [] };
}

function normalizeCartItem(it) {
  // On tente de normaliser sans casser ce que tu as
  const quantity =
    Number(it.quantity ?? it.qty ?? it.qte ?? it.count ?? 1) || 1;

  // Prix: accepte price, unit_price, prix, amount
  const price =
    Number(it.price ?? it.unit_price ?? it.prix ?? it.amount ?? 0) || 0;

  // id produit
  const product_id = it.product_id ?? it.id ?? it.sku ?? null;

  // Nom
  const name = it.name ?? it.title ?? it.product_name ?? "Article";

  return {
    product_id,
    name,
    price,
    quantity,
    raw: it,
  };
}

function calcCartTotal(items) {
  return items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
}

async function getSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

function requireEl(sel) {
  const el = $(sel);
  if (!el) console.warn(`Element introuvable: ${sel}`);
  return el;
}

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function setHtml(sel, html) {
  const el = $(sel);
  if (el) el.innerHTML = html;
}

function showError(msg) {
  console.error(msg);
  const box = $("#checkoutError");
  if (box) {
    box.style.display = "block";
    box.textContent = msg;
  } else {
    alert(msg);
  }
}

function showInfo(msg) {
  console.log(msg);
  const box = $("#checkoutInfo");
  if (box) {
    box.style.display = "block";
    box.textContent = msg;
  }
}

/* ================================
   4) UI — (optionnel)
   IDs recommandés dans checkout.html:
   - #loginEmail #loginPassword #btnLogin
   - #signupEmail #signupPassword #btnSignup
   - #btnLogout
   - #btnPay
   - Champs livraison: #firstName #lastName #phone #company #country #address1 #address2 #zip #city #note
   - Résumé: #cartLines #cartTotal
   - Messages: #checkoutError #checkoutInfo
================================ */
async function renderCartSummary() {
  const { items } = readCart();
  const normalized = items.map(normalizeCartItem);
  const total = calcCartTotal(normalized);

  setText("#cartTotal", `${euros(total)} €`);

  const lines = normalized
    .map(
      (it) => `
      <div class="cart-line">
        <div class="name">${it.name}</div>
        <div class="qty">x${it.quantity}</div>
        <div class="price">${euros(it.price)} €</div>
      </div>
    `
    )
    .join("");

  setHtml("#cartLines", lines || `<div class="muted">Panier vide</div>`);

  return { items: normalized, total };
}

async function refreshAuthUI() {
  const session = await getSession();
  const emailBox = $("#connectedEmail");
  const loginZone = $("#loginZone");
  const connectedZone = $("#connectedZone");

  if (session?.user) {
    if (emailBox) emailBox.textContent = session.user.email;
    if (loginZone) loginZone.style.display = "none";
    if (connectedZone) connectedZone.style.display = "block";
  } else {
    if (emailBox) emailBox.textContent = "";
    if (loginZone) loginZone.style.display = "block";
    if (connectedZone) connectedZone.style.display = "none";
  }
}

/* ================================
   5) AUTH ACTIONS
================================ */
async function doLogin() {
  const email = requireEl("#loginEmail")?.value?.trim();
  const password = requireEl("#loginPassword")?.value;

  if (!email || !password) return showError("Email et mot de passe requis.");

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return showError(`Login impossible: ${error.message}`);

  showInfo("Connecté ✅");
  await refreshAuthUI();
}

async function doSignup() {
  const email = requireEl("#signupEmail")?.value?.trim();
  const password = requireEl("#signupPassword")?.value;

  if (!email || !password) return showError("Email et mot de passe requis.");

  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/checkout.html` },
  });

  if (error) return showError(`Création compte impossible: ${error.message}`);

  showInfo("Compte créé ✅ (si confirmation email activée, vérifie tes emails)");
  await refreshAuthUI();
}

async function doLogout() {
  const { error } = await sb.auth.signOut();
  if (error) return showError(error.message);
  await refreshAuthUI();
}

/* ================================
   6) DATA (orders / order_items)
   IMPORTANT: ton schéma peut varier.
   - orders: id, user_id, status, total, currency, email, shipping_...
   - order_items: id, order_id, product_id, name, unit_price, quantity
================================ */
function readShippingForm() {
  const pick = (id) => ($(id)?.value ?? "").trim();

  return {
    first_name: pick("#firstName"),
    last_name: pick("#lastName"),
    phone: pick("#phone"),
    company: pick("#company"),
    country: pick("#country") || "France",
    address1: pick("#address1"),
    address2: pick("#address2"),
    zip: pick("#zip"),
    city: pick("#city"),
    note: pick("#note"),
  };
}

function validateShipping(s) {
  // Ajuste si tu veux plus/moins strict
  if (!s.first_name || !s.last_name) return "Nom / prénom manquants.";
  if (!s.phone) return "Téléphone manquant.";
  if (!s.address1 || !s.zip || !s.city || !s.country)
    return "Adresse incomplète.";
  return null;
}

async function createOrderAndItems({ cartItems, total, session }) {
  const shipping = readShippingForm();
  const err = validateShipping(shipping);
  if (err) throw new Error(err);

  // 1) INSERT order
  const orderPayload = {
    user_id: session.user.id,
    email: session.user.email,
    status: "pending_payment",
    currency: "EUR",
    total: Number(euros(total)),
    shipping_first_name: shipping.first_name,
    shipping_last_name: shipping.last_name,
    shipping_phone: shipping.phone,
    shipping_company: shipping.company || null,
    shipping_country: shipping.country,
    shipping_address1: shipping.address1,
    shipping_address2: shipping.address2 || null,
    shipping_zip: shipping.zip,
    shipping_city: shipping.city,
    note: shipping.note || null,
    payment_provider: "mollie",
  };

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert(orderPayload)
    .select("*")
    .single();

  if (orderErr) {
    throw new Error(
      `Insert orders refusé: ${orderErr.message}\n(RLS? colonnes?)`
    );
  }

  // 2) INSERT order_items
  const itemsPayload = cartItems.map((it) => ({
    order_id: order.id,
    product_id: it.product_id,
    name: it.name,
    unit_price: Number(euros(it.price)),
    quantity: Number(it.quantity),
  }));

  const { error: itemsErr } = await sb.from("order_items").insert(itemsPayload);

  if (itemsErr) {
    throw new Error(
      `Insert order_items refusé: ${itemsErr.message}\n(RLS? colonnes?)`
    );
  }

  return { order, shipping };
}

/* ================================
   7) CALL EDGE FUNCTION (MOLLIE)
   On envoie:
   - order_id
   - amount (string "12.34")
   - description
   - redirect_url (retour après paiement)
================================ */
async function callMollieCheckout({ session, order, total }) {
  const amount = euros(total);
  const description = `Commande FrenchConnect #${order.id}`;
  const redirect_url = `${SITE_URL}/success.html?order_id=${encodeURIComponent(
    order.id
  )}`;
  const webhook_url = `${SITE_URL}/webhook-mollie.html?order_id=${encodeURIComponent(
    order.id
  )}`; // si tu as une page/route webhook (sinon laisse mais ignore côté function)

  const res = await fetch(FUNCTION_MOLLIE_CREATE_CHECKOUT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Supabase Edge Functions aiment bien:
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      order_id: order.id,
      amount,
      description,
      redirect_url,
      webhook_url,
      // optionnel
      customer_email: session.user.email,
    }),
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const msg =
      json?.error ||
      json?.message ||
      `Edge Function erreur ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  // On s’attend à recevoir un lien Mollie
  const checkoutUrl =
    json?.checkoutUrl || json?.checkout_url || json?.url || json?._links?.checkout?.href;

  if (!checkoutUrl) {
    throw new Error("Réponse Mollie invalide: URL de paiement manquante.");
  }

  window.location.href = checkoutUrl;
}

/* ================================
   8) PAY FLOW
================================ */
let PAYING = false;

async function onPay() {
  if (PAYING) return;
  PAYING = true;

  try {
    $("#btnPay") && ($("#btnPay").disabled = true);
    showInfo("");

    const session = await getSession();
    if (!session?.user) {
      throw new Error("Tu dois être connecté pour payer.");
    }

    const { items: cartItems, total } = await renderCartSummary();
    if (!cartItems.length) throw new Error("Ton panier est vide.");

    showInfo("Création de la commande…");

    const { order } = await createOrderAndItems({ cartItems, total, session });

    showInfo("Ouverture du paiement Mollie…");
    await callMollieCheckout({ session, order, total });
  } catch (e) {
    showError(e?.message || String(e));
  } finally {
    PAYING = false;
    $("#btnPay") && ($("#btnPay").disabled = false);
  }
}

/* ================================
   9) INIT
================================ */
async function initCheckout() {
  await renderCartSummary();
  await refreshAuthUI();

  // events
  $("#btnLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    doLogin();
  });
  $("#btnSignup")?.addEventListener("click", (e) => {
    e.preventDefault();
    doSignup();
  });
  $("#btnLogout")?.addEventListener("click", (e) => {
    e.preventDefault();
    doLogout();
  });
  $("#btnPay")?.addEventListener("click", (e) => {
    e.preventDefault();
    onPay();
  });

  // refresh UI on auth changes
  sb.auth.onAuthStateChange(async () => {
    await refreshAuthUI();
  });
}

document.addEventListener("DOMContentLoaded", initCheckout);
