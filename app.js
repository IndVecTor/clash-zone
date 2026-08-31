document.addEventListener("DOMContentLoaded", () => {
  syncAppState();
  if (document.getElementById("leaderboardRows")) {
    renderLeaderboard();
  }
});

function syncAppState() {
  const user = JSON.parse(localStorage.getItem("cz_user"));
  const topNav = document.getElementById("topNavActions");
  const userStrip = document.getElementById("userProfileStrip");
  const centerUpload = document.getElementById("centerUploadContainer");
  const bottomProfileBtn = document.getElementById("bottomProfileBtn");
  const bottomProfileText = document.getElementById("bottomProfileText");

  if (user) {
    if (topNav) {
      topNav.innerHTML = `
        <button class="btn btn-outline" onclick="window.location.href='wallet.html'"><i class="fa-solid fa-coins"></i> ₹${user.wallet || 0}</button>
        <button class="btn btn-outline" style="border-color:#ef4444; color:#ef4444;" onclick="logout()"><i class="fa-solid fa-power-off"></i></button>
      `;
    }
    if (userStrip) userStrip.style.display = "flex";
    if (centerUpload) centerUpload.style.display = "block";

    const dashName = document.getElementById("dashName");
    const dashDetails = document.getElementById("dashDetails");
    const dashXP = document.getElementById("dashXP");

    if (dashName) dashName.innerText = user.name;
    if (dashDetails) dashDetails.innerText = `${user.th || 'TH 16'} | Clan: ${user.clan || 'Solo'}`;
    if (dashXP) dashXP.innerText = `${user.xp || 100} XP`;

    if (bottomProfileBtn) {
      bottomProfileBtn.onclick = () => openModal('profileModal');
      bottomProfileText.innerText = "Profile";
    }
  } else {
    if (topNav) {
      topNav.innerHTML = `
        <button class="btn btn-gold" onclick="openAuthModal('login')"><i class="fa-solid fa-user"></i> Login</button>
      `;
    }
    if (userStrip) userStrip.style.display = "none";
    if (centerUpload) centerUpload.style.display = "none";

    if (bottomProfileBtn) {
      bottomProfileBtn.onclick = () => openAuthModal('login');
      bottomProfileText.innerText = "Login";
    }
  }
}

function switchAuth(type) {
  if (type === 'login') {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("btnTabLogin").classList.add("active");
    document.getElementById("btnTabSignup").classList.remove("active");
  } else {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("btnTabSignup").classList.add("active");
    document.getElementById("btnTabLogin").classList.remove("active");
  }
}

function doSignup() {
  const name = document.getElementById("regName").value.trim();
  const mobile = document.getElementById("regMobile").value.trim();
  const tag = document.getElementById("regTag").value.trim();
  const pass = document.getElementById("regPass").value.trim();

  if (!name || mobile.length !== 10 || !tag || pass.length < 4) {
    alert("Saari jankari sahi bharein! (Mobile 10-digit, Password min 4 chars)");
    return;
  }

  let users = JSON.parse(localStorage.getItem("cz_all_users")) || [];
  if (users.find(u => u.mobile === mobile)) {
    alert("Mobile number pehle se registered hai! Kripya Login karein.");
    switchAuth('login');
    return;
  }

  const newUser = {
    name, mobile, tag, pass,
    wallet: 0,
    xp: 100,
    th: "TH 16",
    clan: "New Challenger"
  };

  users.push(newUser);
  localStorage.setItem("cz_all_users", JSON.stringify(users));
  localStorage.setItem("cz_user", JSON.stringify(newUser));

  closeModal("authModal");
  syncAppState();
  if (document.getElementById("leaderboardRows")) renderLeaderboard();
  alert("🎉 Account create ho gaya! +100 XP points jud gaye!");
}

function doLogin() {
  const mobile = document.getElementById("logMobile").value.trim();
  const pass = document.getElementById("logPass").value.trim();

  let users = JSON.parse(localStorage.getItem("cz_all_users")) || [];
  const user = users.find(u => u.mobile === mobile && u.pass === pass);

  if (user) {
    localStorage.setItem("cz_user", JSON.stringify(user));
    closeModal("authModal");
    syncAppState();
    if (document.getElementById("leaderboardRows")) renderLeaderboard();
    alert(`Welcome back, Chief ${user.name}!`);
  } else {
    alert("Mobile ya Password galat hai!");
  }
}

function logout() {
  localStorage.removeItem("cz_user");
  syncAppState();
}

function saveProfile() {
  let user = JSON.parse(localStorage.getItem("cz_user"));
  if (!user) return;

  user.th = document.getElementById("profTH").value;
  user.clan = document.getElementById("profClan").value || "Solo";
  user.xp = (user.xp || 100) + 150;

  localStorage.setItem("cz_user", JSON.stringify(user));

  let users = JSON.parse(localStorage.getItem("cz_all_users")) || [];
  users = users.map(u => u.mobile === user.mobile ? user : u);
  localStorage.setItem("cz_all_users", JSON.stringify(users));

  closeModal("profileModal");
  syncAppState();
  if (document.getElementById("leaderboardRows")) renderLeaderboard();
  alert(`✅ Profile update ho gayi! +150 XP bonus points jud gaye! Total: ${user.xp} XP`);
}

function renderLeaderboard() {
  const rows = document.getElementById("leaderboardRows");
  if (!rows) return;
  let users = JSON.parse(localStorage.getItem("cz_all_users")) || [];

  let list = [
    { name: "Apex Predator", th: "TH 16", clan: "Team Liquid", xp: 950 },
    { name: "ShadowKing", th: "TH 16", clan: "Dark Nebula", xp: 820 },
    { name: "DevilHunter", th: "TH 15", clan: "Indian Legends", xp: 640 },
    ...users
  ];

  list.sort((a,b) => (b.xp || 0) - (a.xp || 0));

  rows.innerHTML = list.map((p, idx) => `
    <tr>
      <td>${idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : '#' + (idx + 1)}</td>
      <td><b>${p.name}</b></td>
      <td>${p.th || 'TH 16'}</td>
      <td>${p.clan || 'Solo'}</td>
      <td style="color:var(--gold); font-weight:700;">${p.xp || 100} XP</td>
    </tr>
  `).join('');
}

function checkAccess(type) {
  const user = localStorage.getItem("cz_user");
  if (!user) {
    alert("Pehle Login ya Sign Up karein!");
    openAuthModal('login');
  } else {
    if (type === 'tournament' || type === 'wallet') {
      window.location.href = "wallet.html";
    }
  }
}

function publishBase() {
  const th = document.getElementById("newBaseTH").value;
  const type = document.getElementById("newBaseType").value;
  const link = document.getElementById("newBaseLink").value.trim();

  if (!link) {
    alert("Base ka link dalein!");
    return;
  }

  const grid = document.getElementById("baseGrid");
  if (grid) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80" alt="Base">
        <span class="card-badge">${th}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${type}</div>
        <button class="btn btn-outline" style="width: 100%; justify-content: center;" onclick="window.open('${link}','_blank')"><i class="fa-solid fa-copy"></i> Copy Link</button>
      </div>
    `;
    grid.prepend(card);
  }

  let user = JSON.parse(localStorage.getItem("cz_user"));
  if (user) {
    user.xp = (user.xp || 100) + 50;
    localStorage.setItem("cz_user", JSON.stringify(user));
    syncAppState();
    if (document.getElementById("leaderboardRows")) renderLeaderboard();
  }

  closeModal("uploadModal");
  alert("Base publish ho gaya aur +50 XP bonus points jud gaye!");
}

function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function openAuthModal(t) { openModal('authModal'); switchAuth(t); }