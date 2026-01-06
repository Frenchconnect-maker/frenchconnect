const SUPABASE_URL = "https://mnsqfagfdahvhlfopfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authBox = document.getElementById("auth-box");
const accountBox = document.getElementById("account-box");
const authMsg = document.getElementById("auth-msg");
const ordersBox = document.getElementById("orders");
const welcome = document.getElementById("welcome");
const ordersTitle = document.getElementById("orders-title");

/* =========================
   AUTH
========================= */
document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  authMsg.textContent = "Connexion…";

  const email = email.value;
  const password = document.getElementById("password").value;

  let { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    const signup = await sb.auth.signUp({ email, password });
    if (signup.error) {
      authMsg.textContent = signup.error.message;
      return;
    }
  }

  location.reload();
});

document.getElementById("logout").onclick = async () => {
  await sb.auth.signOut();
  location.reload();
};

/* =========================
   INIT
========================= */
init();

async function init() {
  const { data } = await sb.auth.getUser();

  if (!data.user) return;

  authBox.style.display = "none";
  accountBox.style.display = "block";

  const userId = data.user.id;

  // récupérer le profil
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.is_admin === true;

  welcome.textContent = `Bienvenue ${profile?.first_name || profile?.email}`;
  ordersTitle.textContent = isAdmin ? "Toutes les commandes" : "Mes commandes";

  loadOrders(isAdmin, userId);
}

/* =========================
   ORDERS
========================= */
async function loadOrders(isAdmin, userId) {
  ordersBox.innerHTML = "Chargement…";

  let query = sb
    .from("orders")
    .select(`
      id,
      created_at,
      total_cents,
      status,
      profiles(email)
    `)
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    ordersBox.textContent = error.message;
    return;
  }

  if (!data.length) {
    ordersBox.textContent = "Aucune commande.";
    return;
  }

  ordersBox.innerHTML = data.map(o => `
    <div class="card" style="margin-bottom:14px">
      <div class="pad">
        <strong>Commande ${o.id}</strong><br>
        ${new Date(o.created_at).toLocaleString()}<br>
        <strong>${(o.total_cents / 100).toFixed(2)} €</strong><br>
        Statut : ${o.status}
        ${o.profiles ? `<br>Client : ${o.profiles.email}` : ""}
      </div>
    </div>
  `).join("");
}
