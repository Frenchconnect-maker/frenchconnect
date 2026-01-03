// =====================
// CATALOGUE PRODUITS
// =====================

const STORE = [

  // ===== EXTRAITS =====
  {
    id: "cakeberry-rosin",
    name: "Cakeberry Rosin",
    price: 40.00,
    image: "assets/images/cakeberry-rosin.jpg",
    category: "extraits",
    badge: "Rosin",
    desc: "",
    options: buildGramOptions(40.00),
    payment_link: ""
  },
  {
    id: "cereal-cakes-live-rosin",
    name: "Cereal Cakes Live Rosin",
    price: 40.00,
    image: "assets/images/cereal-cakes-live-rosin.webp",
    category: "extraits",
    badge: "Live Rosin",
    desc: "",
    options: buildGramOptions(40.00),
    payment_link: ""
  },
  {
    id: "sherbet-cookie-live-rosin",
    name: "Sherbet Cookie Live Rosin",
    price: 40.00,
    image: "assets/images/sherbet-cookie-live-rosin.png",
    category: "extraits",
    badge: "Live Rosin",
    desc: "",
    options: buildGramOptions(40.00),
    payment_link: ""
  },

  // ===== RESINES =====
  {
    id: "sherbet-cookie-hash",
    name: "Sherbet Cookie Hash",
    price: 12.00,
    image: "assets/images/sherbet-cookie-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: buildGramOptions(12.00),
    payment_link: ""
  },
  {
    id: "banana-kush-hash",
    name: "Banana Kush Hash",
    price: 12.00,
    image: "assets/images/banana-kush-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: buildGramOptions(12.00),
    payment_link: ""
  },
  {
    id: "amnesia-hash",
    name: "Amnesia Hash",
    price: 11.00,
    image: "assets/images/amnesia-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: buildGramOptions(11.00),
    payment_link: ""
  },
  {
    id: "blueberry-hash",
    name: "Blueberry Hash",
    price: 12.00,
    image: "assets/images/blueberry-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: buildGramOptions(12.00),
    payment_link: ""
  },

  // ===== FLEURS =====
  {
    id: "diamond-og",
    name: "Diamond OG",
    price: 12.90,
    image: "assets/images/diamond-og.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "runtz",
    name: "Runtz",
    price: 12.90,
    image: "assets/images/runtz.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "sour-apple",
    name: "Sour Apple",
    price: 12.90,
    image: "assets/images/sour-apple.webp",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "strawberry-haze",
    name: "Strawberry Haze",
    price: 12.90,
    image: "assets/images/strawberry-haze.png",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: buildGramOptions(12.90),
    payment_link: ""
  },

  // ===== PRE ROLLS (SANS GRAMMAGE) =====
  {
    id: "strawberry-haze-pre-roll",
    name: "Strawberry Haze Pre Roll",
    price: 12.90,
    image: "assets/images/strawberry-haze-pre-roll.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  },
  {
    id: "banana-kush-cakeberry-rosin-pre-roll",
    name: "Banana Kush x Cakeberry Rosin Pre Roll",
    price: 12.90,
    image: "assets/images/banana-kush-cakeberry-rosin-pre-roll.jpeg",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  },
  {
    id: "runtz-cereal-cakes-pre-roll",
    name: "Runtz x Cereal Cakes Pre Roll",
    price: 12.90,
    image: "assets/images/prerolls3.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  }
];

// =====================
// GRAMMAGE + REMISES
// =====================
function buildGramOptions(price1g){
  const grams = [1,3,5,10,25,50,100];

  const DISCOUNT = {
    1:   1.00, // 0%
    3:   0.95, // -5%
    5:   0.92, // -8%
    10:  0.88, // -12%
    25:  0.82, // -18%
    50:  0.78, // -22%
    100: 0.72  // -28%
  };

  return grams.map(g => ({
    id: `${g}g`,
    label: `${g} g`,
    price: round2(price1g * g * (DISCOUNT[g] ?? 1)),
    payment_link: ""
  }));
}

function round2(n){ return Math.round(n * 100) / 100; }

// =====================
// HELPERS / PANIER
// =====================
const formatPrice = n => n.toFixed(2).replace(".", ",") + " €";
const getOption = (p, id) => (p.options || []).find(o => o.id === id);
const defaultOptionId = p => p.options?.[0]?.id ?? null;
const priceFor = (p, opt) => getOption(p, opt)?.price ?? p.price;

function getCart(){ return JSON.parse(localStorage.getItem("cart") || "[]"); }
function setCart(c){ localStorage.setItem("cart", JSON.stringify(c)); updateCartCount(); }
function updateCartCount(){
  const el = document.getElementById("cart-count");
  if(el) el.textContent = getCart().reduce((s,l)=>s+l.qty,0);
}
function findProduct(id){ return STORE.find(p => p.id === id); }

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", updateCartCount);
