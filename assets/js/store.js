{
  id: "frenchconnect-smellz-bananacake-cakeberry-rosin",
  name: "FrenchConnect x Smellz – Bananacake / Cakeberry Rosin CBD",
  price: 40.00,
  image: "assets/images/cakeberry-rosin.jpg",
  category: "extraits",
  badge: "Rosin Ultra Premium",
  desc: "Issu de la collaboration exclusive FrenchConnect x Smellz, ce Rosin CBD Bananacake / Cakeberry est un coup de cœur 2025. Fruit de près de trois mois de travail, il offre une texture pure et un profil aromatique d’exception. Notes gourmandes et fruitées, terpènes 100 % naturels, extraction sans solvants. Série limitée réservée aux amateurs de qualité. THC < 0,3 %.",
  payment_link: ""
},

// Product catalog (edit this with your real products)
// Add your Stripe Payment Link for each product in 'payment_link'
const STORE = [
  {
    id: "flr-french31",
    name: "French Connect 31 - Fleurs CBD",
    price: 12.90,
    image: "assets/images/hero.jpg",
    category: "fleurs",
    badge: "Indoor",
    desc: "Fleurs CBD au profil aromatique marqué. Lot limité. THC < 0,3%.",
    payment_link: "https://buy.stripe.com/test_XXXXX" // TODO: remplace par ton lien Stripe
  },
  {
    id: "rosin-gold",
    name: "Rosin CBD – Gold Press",
    price: 29.90,
    image: "assets/images/hero.jpg",
    category: "extraits",
    badge: "Rosin",
    desc: "Extraction sans solvants (pression à chaud). Texture pure et aromatique.",
    payment_link: "https://buy.stripe.com/test_YYYYY"
  },
  {
    id: "huile-10",
    name: "Huile CBD 10%",
    price: 24.90,
    image: "assets/images/hero.jpg",
    category: "huiles",
    badge: "Full-spectrum",
    desc: "Huile CBD 10% avec spectre complet. Usage cosmétique. THC < 0,3%.",
    payment_link: "https://buy.stripe.com/test_ZZZZZ"
  }
];

const formatPrice = (n) => (n).toFixed(2).replace('.', ',') + ' €';

function getCart(){
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch(e){ return []; }
}
function setCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = count;
}
function findProduct(id){ return STORE.find(p => p.id === id); }
function searchProducts(q, cat){
  q = (q||'').toLowerCase();
  return STORE.filter(p => {
    const okQ = !q || (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    const okC = !cat || p.category === cat;
    return okQ && okC;
  });
}

// Pre-render for home
function renderHome(){
  const box = document.getElementById('home-collection');
  if(!box) return;
  box.innerHTML = STORE.slice(0, 3).map(card).join('');
}

// Product cards
function card(p){
  return \`
  <article class="card">
    <a href="product.html?id=\${p.id}">
      <img class="thumb" src="\${p.image}" alt="\${p.name}">
    </a>
    <div class="pad">
      <div class="pill">\${p.category}</div>
      <h3><a href="product.html?id=\${p.id}">\${p.name}</a></h3>
      <div class="price-tag">\${formatPrice(p.price)}</div>
      <div class="btn-row">
        <button class="btn" onclick="addToCart('\${p.id}',1)">Ajouter</button>
        <a class="btn ghost" href="product.html?id=\${p.id}">Voir</a>
      </div>
    </div>
  </article>\`;
}

// Cart logic
function addToCart(id, qty){
  const p = findProduct(id);
  if(!p) return;
  const cart = getCart();
  const line = cart.find(l => l.id === id);
  if(line) line.qty += qty;
  else cart.push({id, qty});
  setCart(cart);
  alert('Ajouté au panier ✔');
}

function removeFromCart(id){
  const cart = getCart().filter(l => l.id !== id);
  setCart(cart);
  renderCart();
}

function setQty(id, qty){
  const cart = getCart();
  const line = cart.find(l => l.id === id);
  if(!line) return;
  line.qty = Math.max(1, qty|0);
  setCart(cart);
  renderCart();
}

function renderCart(){
  const box = document.getElementById('cart-items');
  if(!box) return;
  const cart = getCart();
  if(cart.length === 0){
    box.innerHTML = '<p>Votre panier est vide.</p>';
    document.getElementById('cart-total').textContent = formatPrice(0);
    return;
  }
  let total = 0;
  box.innerHTML = cart.map(l => {
    const p = findProduct(l.id);
    const lineTotal = p.price * l.qty;
    total += lineTotal;
    return \`
      <div class="cart-line">
        <img src="\${p.image}" alt="\${p.name}">
        <div>
          <div><strong>\${p.name}</strong></div>
          <div class="muted">\${p.category} • \${p.badge}</div>
        </div>
        <div>\${formatPrice(p.price)}</div>
        <div>
          <input type="number" min="1" value="\${l.qty}" onchange="setQty('\${l.id}', this.value)">
        </div>
        <div><button class="btn ghost" onclick="removeFromCart('\${l.id}')">Retirer</button></div>
      </div>\`;
  }).join('');
  document.getElementById('cart-total').textContent = formatPrice(total);
  const btn = document.getElementById('checkout-btn');
  if(btn){
    btn.onclick = function(e){
      e.preventDefault();
      startCheckout();
    };
  }
}

// Checkout: redirect to Stripe Payment Links if only one product, else show simple summary page
function startCheckout(){
  const cart = getCart();
  if(cart.length === 1){
    const {id, qty} = cart[0];
    const p = findProduct(id);
    if(p && p.payment_link && p.payment_link.startsWith('http')){
      // For multiple quantities, Stripe Payment Links can use quantity in query (?quantity=2) if enabled.
      const url = p.payment_link + (qty>1 ? ('?quantity=' + qty) : '');
      window.location.href = url;
      return;
    }
  }
  // Fallback: simple summary
  alert('Pour un vrai checkout multi-produit, raccorde Stripe (Server) ou utilise Shopify. En attendant, chaque produit utilise un Payment Link Stripe à configurer dans store.js.');
}

// Product page boot
function bootProductPage(){
  const url = new URL(location.href);
  const id = url.searchParams.get('id');
  const p = findProduct(id) || STORE[0];
  document.getElementById('p-image').src = p.image;
  document.getElementById('p-name').textContent = p.name;
  document.getElementById('p-desc').textContent = p.desc;
  document.getElementById('p-cat').textContent = p.category;
  document.getElementById('p-badge').textContent = p.badge;
  document.getElementById('p-price').textContent = formatPrice(p.price);
  document.getElementById('add-to-cart').onclick = () => {
    const qty = parseInt(document.getElementById('qty').value || '1', 10);
    addToCart(p.id, qty);
  };
  document.getElementById('buy-now').onclick = () => {
    if(p.payment_link && p.payment_link.startsWith('http')){
      const qty = parseInt(document.getElementById('qty').value || '1', 10);
      const url = p.payment_link + (qty>1 ? ('?quantity=' + qty) : '');
      location.href = url;
    } else {
      alert('Ajoute un lien de paiement Stripe dans store.js pour activer "Acheter maintenant".');
    }
  };
}

// Shop page boot
function bootShopPage(){
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  const input = document.getElementById('search');
  const select = document.getElementById('category-filter');
  function rerender(){
    const results = searchProducts(input.value, select.value);
    grid.innerHTML = results.map(card).join('');
  }
  input.oninput = rerender;
  select.onchange = rerender;
  rerender();
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderHome();
  bootShopPage();
  renderCart();
  if(document.getElementById('product-page')) bootProductPage();
});
