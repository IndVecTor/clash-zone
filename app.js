import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAV0YgGeolSq8FQ3P7jRJEwF5VNjSDWsmA",
  authDomain: "clash-zone-d82d8.firebaseapp.com",
  projectId: "clash-zone-d82d8",
  storageBucket: "clash-zone-d82d8.firebasestorage.app",
  messagingSenderId: "464415959326",
  appId: "1:464415959326:web:acde9ea5ed1e0d20a5410f",
  measurementId: "G-XWNWGQS251"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentZone = "home";
let currentTH = "ALL";
let currentType = "ALL";
let currentSort = "latest";
let allFetchedBases = [];
let allFetchedClans = [];
let currentUserProfile = null;

let userLikedBases = JSON.parse(localStorage.getItem("cz_liked_bases")) || [];
let userBookmarkedBases = JSON.parse(localStorage.getItem("cz_bookmarked_bases")) || [];

const ZONE_LEVELS = {
  home: ["ALL", "TH 18", "TH 17", "TH 16", "TH 15", "TH 14", "TH 13", "TH 12", "TH 11", "TH 10", "TH 9", "TH 8", "TH 7", "TH 6", "TH 5"],
  builder: ["ALL", "BH 10", "BH 9", "BH 8", "BH 7", "BH 6", "BH 5", "BH 4"],
  capital: ["ALL", "Capital Peak", "Dragon Cliffs", "Balloon Lagoon", "Skeleton Park", "Golem Quarry", "Wizard Valley", "Barbarian Camp"]
};

function renderAllIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.showToast = function(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const isSuccess = type === "success";
  toast.className = `glass-panel pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${isSuccess ? 'border-amber-400/80 shadow-neon-gold' : 'border-rose-500/80 shadow-rose-500/20'} shadow-2xl transition-all duration-300 transform translate-x-10 opacity-0 text-xs font-bold`;
  toast.innerHTML = `<i data-lucide="${isSuccess ? 'check-circle' : 'alert-triangle'}" class="w-4 h-4 ${isSuccess ? 'text-amber-400' : 'text-rose-400'}"></i><span class="text-white">${message}</span>`;
  container.appendChild(toast);
  renderAllIcons();
  setTimeout(() => toast.classList.remove("translate-x-10", "opacity-0"), 10);
  setTimeout(() => { toast.classList.add("translate-x-10", "opacity-0"); setTimeout(() => toast.remove(), 300); }, 3000);
};

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function compressAndWatermarkImage(file, creatorName = "Chief", maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        elem.width = width; elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const padding = 16, badgeHeight = 32, badgeWidth = Math.min(width * 0.55, 270);
        const x = width - badgeWidth - padding, y = height - badgeHeight - padding;
        ctx.save();
        ctx.fillStyle = "rgba(3, 5, 11, 0.9)";
        ctx.beginPath(); ctx.roundRect(x, y, badgeWidth, badgeHeight, 8); ctx.fill();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = "bold 11px Rajdhani, sans-serif"; ctx.fillStyle = "#fbbf24"; ctx.fillText("⚡ CLASHZONE", x + 10, y + 20);
        ctx.fillStyle = "#ffffff"; ctx.fillText(`| by ${creatorName.substring(0, 14)}`, x + 95, y + 20);
        ctx.restore();
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

// ==========================================
// 2. LIVE SUPERCELL API SYNC
// ==========================================
async function fetchLiveSupercellPlayer(rawTag) {
  let tag = rawTag.trim().toUpperCase().replace(/O/g, '0');
  if (!tag.startsWith('#')) tag = '#' + tag;

  const cleanTag = encodeURIComponent(tag);
  const targetUrl = `https://cocproxy.royaleapi.dev/v1/players/${cleanTag}`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
  ];

  let data = null;
  for (let proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        data = await response.json();
        break;
      }
    } catch (e) { continue; }
  }

  if (!data) throw new Error("Supercell servers busy or invalid tag format.");

  return {
    name: data.name,
    tag: data.tag,
    townHallLevel: data.townHallLevel,
    trophies: data.trophies,
    warStars: data.warStars || 0,
    clan: data.clan || { name: "Solo" }
  };
}

window.handleLiveSupercellSync = async function() {
  const tagInput = document.getElementById("editTag");
  const syncBtn = document.getElementById("btnSyncPlayerTag");
  const rawTag = tagInput.value.trim();

  if (!rawTag || rawTag.length < 3) {
    window.showToast("Please enter a valid Player Tag", "error");
    return;
  }

  syncBtn.disabled = true;
  syncBtn.innerText = "Syncing...";

  try {
    const liveData = await fetchLiveSupercellPlayer(rawTag);
    document.getElementById("editName").value = liveData.name;
    document.getElementById("editTH").value = "TH " + liveData.townHallLevel;
    document.getElementById("editTrophies").value = liveData.trophies;
    document.getElementById("editClan").value = liveData.clan.name;
    window.showToast(`⚡ Synced: ${liveData.name} (TH ${liveData.townHallLevel})!`);
  } catch (err) {
    window.showToast("Sync Error: Check tag or try again.", "error");
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerText = "Sync Live";
    renderAllIcons();
  }
};

// ==========================================
// 3. AUTH STATE & PROFILE RENDER
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const profileLoggedOut = document.getElementById("profileLoggedOutView");
  const profileLoggedIn = document.getElementById("profileLoggedInView");

  if (user) {
    const defaultName = user.displayName || user.email.split('@')[0];
    if (profileLoggedOut) profileLoggedOut.classList.add("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.remove("hidden");

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUserProfile = userDoc.data();
      } else {
        currentUserProfile = {
          name: defaultName,
          townHallLevel: "TH 16",
          tag: "#CLASH",
          clanName: "Solo",
          trophies: 5000,
          bio: "ClashZone Pro Builder",
          avatarUrl: "",
          followersCount: 0
        };
      }

      document.getElementById("profileIGN").innerText = currentUserProfile.name || defaultName;
      document.getElementById("profileTHBadge").innerText = currentUserProfile.townHallLevel || "TH 16";
      document.getElementById("profileTagClan").innerText = `Clan: ${currentUserProfile.clanName || 'Solo'} | ${currentUserProfile.tag || '#CLASH'}`;
      document.getElementById("statTrophiesCount").innerText = `🏆 ${currentUserProfile.trophies || 5000}`;
      document.getElementById("statFollowersCount").innerText = currentUserProfile.followersCount || 0;
      
      const bioEl = document.getElementById("profileBioText");
      if (bioEl) bioEl.innerText = currentUserProfile.bio || "No description added yet.";

      const avatarContainer = document.getElementById("profileAvatarContainer");
      if (currentUserProfile.avatarUrl && currentUserProfile.avatarUrl.trim() !== '') {
        avatarContainer.innerHTML = `<img src="${currentUserProfile.avatarUrl}" class="w-full h-full object-cover" />`;
      } else {
        avatarContainer.innerHTML = `<span id="profileAvatarInitial">${(currentUserProfile.name || defaultName).charAt(0).toUpperCase()}</span>`;
      }

      const userPosts = allFetchedBases.filter(b => b.uploaderUid === user.uid);
      document.getElementById("statPostsCount").innerText = userPosts.length;
      document.getElementById("tabPostNum").innerText = userPosts.length;

      renderUserProfilePosts(userPosts);
      renderUserSavedVault();
    } catch (e) {}
  } else {
    currentUserProfile = null;
    if (profileLoggedOut) profileLoggedOut.classList.remove("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.add("hidden");
  }
  renderAllIcons();
});

function renderUserProfilePosts(posts) {
  const container = document.getElementById("profileTabContentPosts");
  if (!container) return;
  if (posts.length === 0) {
    container.innerHTML = `<div class="col-span-full py-10 text-center text-slate-500 text-xs">No layouts published yet.</div>`;
    return;
  }
  container.innerHTML = posts.map(b => `
    <div class="glass-panel rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-3">
      <img src="${b.image}" class="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
      <div class="min-w-0 flex-1 cursor-pointer" onclick="window.openBaseDetailsModal('${b.id}')">
        <span class="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">${b.th}</span>
        <h4 class="text-xs font-bold text-white truncate mt-1">${b.title}</h4>
      </div>
      <button onclick="window.copyBaseLink('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-3 py-2 rounded-xl text-xs font-bold shrink-0">Copy</button>
    </div>
  `).join('');
}

function renderUserSavedVault() {
  const container = document.getElementById("profileTabContentSaved");
  if (!container) return;
  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) {
    container.innerHTML = `<div class="py-10 text-center text-slate-500 text-xs">No bookmarked layouts in your vault.</div>`;
    return;
  }
  container.innerHTML = savedList.map(b => `
    <div class="glass-panel rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-3">
      <img src="${b.image}" class="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
      <div class="min-w-0 flex-1 cursor-pointer" onclick="window.openBaseDetailsModal('${b.id}')">
        <span class="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">${b.th}</span>
        <h4 class="text-xs font-bold text-white truncate mt-1">${b.title}</h4>
      </div>
      <button onclick="window.copyBaseLink('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-3 py-2 rounded-xl text-xs font-bold shrink-0">Copy</button>
    </div>
  `).join('');
}

// ==========================================
// 4. ZONE & LEVEL SELECTORS
// ==========================================
window.switchZone = function(zone) {
  currentZone = zone;
  currentTH = "ALL";
  renderLevelFilters();
  renderBasesUI();
};

function renderLevelFilters() {
  const container = document.getElementById("levelFilterContainer");
  if (!container) return;
  const levels = ZONE_LEVELS[currentZone] || ZONE_LEVELS.home;
  container.innerHTML = levels.map(lvl => `
    <button onclick="window.setTHFilter('${lvl}')" class="base-filter-btn ${lvl === currentTH ? 'active' : ''} px-3.5 py-1.5 bg-czPanel border border-slate-700/85 hover:border-amber-400 rounded-xl text-xs font-bold shrink-0 transition">${lvl}</button>
  `).join('');
}

window.updateUploadLevelOptions = function() {
  const zoneSelect = document.getElementById("uploadZone");
  const thSelect = document.getElementById("uploadTH");
  if (!zoneSelect || !thSelect) return;
  const levels = ZONE_LEVELS[zoneSelect.value].filter(l => l !== "ALL");
  thSelect.innerHTML = levels.map(l => `<option value="${l}">${l}</option>`).join('');
};

// ==========================================
// 5. NAVIGATION SWITCHER
// ==========================================
window.switchMainHubView = function(viewName) {
  ['Feed', 'Vault', 'Clans', 'Profile'].forEach(tab => {
    document.getElementById(`bnav${tab}`)?.classList.remove('active');
  });
  document.getElementById(`bnav${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`)?.classList.add('active');

  ['viewFeedSection', 'viewVaultSection', 'viewClansSection', 'viewProfileSection'].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  if (viewName === 'feed') document.getElementById("viewFeedSection")?.classList.remove("hidden");
  else if (viewName === 'vault') { document.getElementById("viewVaultSection")?.classList.remove("hidden"); renderDirectVaultUI(); }
  else if (viewName === 'clans') document.getElementById("viewClansSection")?.classList.remove("hidden");
  else if (viewName === 'profile') { document.getElementById("viewProfileSection")?.classList.remove("hidden"); populateProfileFormModal(); }
  renderAllIcons();
};

function renderDirectVaultUI() {
  const container = document.getElementById("directVaultContainer");
  if (!container) return;
  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) {
    container.innerHTML = `<div class="glass-panel rounded-3xl p-10 text-center text-slate-500 text-xs">Your Saved Vault is Empty.</div>`;
    return;
  }
  container.innerHTML = savedList.map(b => `
    <div class="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 border-slate-800">
      <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="window.openBaseDetailsModal('${b.id}')">
        <img src="${b.image}" class="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0" />
        <div class="min-w-0">
          <span class="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">${b.th}</span>
          <h4 class="text-xs sm:text-sm font-bold text-white truncate mt-1">${b.title}</h4>
        </div>
      </div>
      <button onclick="window.copyBaseLink('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold">Copy</button>
    </div>
  `).join('');
  renderAllIcons();
}

function populateProfileFormModal() {
  const user = auth.currentUser;
  if (!user) return;
  document.getElementById("editName").value = currentUserProfile?.name || user.displayName || "";
  document.getElementById("editTH").value = currentUserProfile?.townHallLevel || "TH 16";
  document.getElementById("editTag").value = currentUserProfile?.tag || "";
  document.getElementById("editTrophies").value = currentUserProfile?.trophies || 5000;
  document.getElementById("editClan").value = currentUserProfile?.clanName || "Solo";
  document.getElementById("editBio").value = currentUserProfile?.bio || "";
}

// ==========================================
// 6. BASE DETAILS POPUP MODAL (FIXED)
// ==========================================
window.openBaseDetailsModal = function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;

  let modal = document.getElementById("baseDetailsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "baseDetailsModal";
    modal.className = "fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-xl p-6 relative shadow-cyber-card my-auto space-y-4">
      <button onclick="window.closeModal('baseDetailsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold">✕</button>
      
      <div class="flex items-center justify-between">
        <span class="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-lg text-xs border border-amber-500/30">${base.th} • ${(base.zone || 'home').toUpperCase()}</span>
        <span class="text-xs text-slate-400">By <b class="text-white">${base.uploaderName || 'Chief'}</b></span>
      </div>

      <h3 class="text-lg font-black text-white">${base.title}</h3>

      <div class="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-czDark border border-slate-800">
        <img src="${base.image}" class="w-full h-full object-cover" />
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button onclick="window.copyBaseLink('${base.id}', '${base.link}')" class="flex-1 bg-amber-500 text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-gold">
          <i data-lucide="copy" class="w-4 h-4"></i> Copy In-Game Link
        </button>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  renderAllIcons();
};

function renderRankingsUI() {
  const container = document.getElementById("rankingsListContainer");
  if (!container) return;
  const creatorsMap = {};
  allFetchedBases.forEach(base => {
    const key = base.uploaderUid || base.uploaderName;
    if (!creatorsMap[key]) creatorsMap[key] = { name: base.uploaderName || 'Chief', uploads: 0, thLevel: base.th || "TH 16" };
    creatorsMap[key].uploads += 1;
  });
  const ranked = Object.values(creatorsMap).sort((a, b) => b.uploads - a.uploads);
  if (ranked.length === 0) { container.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">No creators ranked yet.</p>`; return; }
  container.innerHTML = ranked.map((c, idx) => `
    <div class="flex items-center justify-between bg-czDark p-3 rounded-2xl border border-slate-800 text-xs">
      <div class="flex items-center gap-3">
        <span class="font-bold text-amber-400 text-xs w-6">#${idx + 1}</span>
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">${c.name.charAt(0).toUpperCase()}</div>
        <div><span class="text-white font-bold block">${c.name}</span><span class="text-[10px] text-slate-400">${c.uploads} Layouts • ${c.thLevel}</span></div>
      </div>
    </div>
  `).join('');
  renderAllIcons();
}

window.openModal = function(id) {
  if (id === 'rankingsModal') renderRankingsUI();
  document.getElementById(id)?.classList.remove("hidden");
  document.getElementById(id)?.classList.add("flex");
  renderAllIcons();
};

window.closeModal = function(id) { 
  document.getElementById(id)?.classList.add("hidden"); 
  document.getElementById(id)?.classList.remove("flex"); 
};

// ==========================================
// 7. BASES LOADERS
// ==========================================
async function loadBasesFromFirestore() {
  const container = document.getElementById("basesContainer");
  if (!container) return;
  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allFetchedBases = [];
    querySnapshot.forEach(docSnap => allFetchedBases.push({ id: docSnap.id, ...docSnap.data() }));
    renderBasesUI();
    if (auth.currentUser) {
      const userPosts = allFetchedBases.filter(b => b.uploaderUid === auth.currentUser.uid);
      document.getElementById("statPostsCount").innerText = userPosts.length;
      document.getElementById("tabPostNum").innerText = userPosts.length;
      renderUserProfilePosts(userPosts);
      renderUserSavedVault();
    }
  } catch (error) { allFetchedBases = []; renderBasesUI(); }
}

window.setSortOption = function(sortType) { currentSort = sortType; renderBasesUI(); };

function renderBasesUI() {
  const container = document.getElementById("basesContainer");
  if (!container) return;
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  let filtered = allFetchedBases.filter(base => {
    const matchZone = (base.zone || "home") === currentZone;
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || (base.type && base.type.toLowerCase().includes(currentType.toLowerCase()));
    const matchSearch = (base.title || "").toLowerCase().includes(search) || (base.th || "").toLowerCase().includes(search) || (base.uploaderName || "").toLowerCase().includes(search);
    return matchZone && matchTH && matchType && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500 text-xs">No layouts found</div>`;
    renderAllIcons();
    return;
  }

  container.innerHTML = filtered.map(base => {
    const isLiked = userLikedBases.includes(base.id);
    return `
      <div class="glass-panel rounded-3xl overflow-hidden flex flex-col group border-slate-800">
        <div class="h-48 relative overflow-hidden bg-czDark cursor-pointer" onclick="window.openBaseDetailsModal('${base.id}')">
          <img src="${base.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          <span class="absolute top-2.5 left-2.5 bg-czDark/95 text-amber-400 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg">${base.th}</span>
          <span class="absolute top-2.5 right-2.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">${base.type}</span>
        </div>
        <div class="p-4 flex flex-col flex-grow justify-between">
          <div class="cursor-pointer" onclick="window.openBaseDetailsModal('${base.id}')">
            <span class="text-amber-400 font-bold text-xs">${base.uploaderName || 'Chief'}</span>
            <h3 class="font-bold text-sm text-white line-clamp-2 my-1">${base.title}</h3>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button onclick="window.handleLikeBase('${base.id}')" class="text-xs text-slate-400 flex items-center gap-1"><i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}"></i><span>${base.likesCount || 0}</span></button>
            <button onclick="window.copyBaseLink('${base.id}', '${base.link}')" class="bg-amber-500 text-black px-3 py-1.5 rounded-xl text-xs font-bold">Copy Link</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  renderAllIcons();
}

window.handleLikeBase = async function(baseId) {
  if (!userLikedBases.includes(baseId)) userLikedBases.push(baseId);
  else userLikedBases = userLikedBases.filter(id => id !== baseId);
  localStorage.setItem("cz_liked_bases", JSON.stringify(userLikedBases));
  renderBasesUI();
};

window.copyBaseLink = async function(baseId, link) {
  if (!link) return;
  navigator.clipboard.writeText(link).then(() => {
    window.showToast("🎉 Base link copied! Opening Clash of Clans...");
    setTimeout(() => window.open(link, "_blank"), 600);
  }).catch(() => window.open(link, "_blank"));
};

window.handleBaseUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { window.showToast("Please login!", "error"); window.openModal('authModal'); return; }

  const rawLink = document.getElementById("uploadLink").value.trim();
  const file = document.getElementById("uploadImageFile")?.files[0];
  if (!file) { window.showToast("Base screenshot is required!", "error"); return; }

  try {
    const creatorIGN = currentUserProfile?.name || user.displayName || 'Chief';
    const base64Image = await compressAndWatermarkImage(file, creatorIGN);
    const baseData = {
      zone: document.getElementById("uploadZone").value,
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      link: rawLink,
      image: base64Image,
      uploaderUid: user.uid,
      uploaderName: creatorIGN,
      likesCount: 0,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "bases"), baseData);
    window.closeModal('uploadModal');
    e.target.reset();
    await loadBasesFromFirestore();
    window.showToast("✅ Layout published successfully!");
  } catch (error) { window.showToast("Error: " + error.message, "error"); }
};

window.handleSaveProfile = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const avatarFile = document.getElementById("editAvatarFile")?.files[0];
  let avatarBase64 = currentUserProfile?.avatarUrl || "";

  if (avatarFile) {
    avatarBase64 = await convertFileToBase64(avatarFile);
  }

  const profileData = {
    name: document.getElementById("editName").value.trim(),
    townHallLevel: document.getElementById("editTH").value,
    tag: document.getElementById("editTag").value.trim() || "#CLASH",
    trophies: parseInt(document.getElementById("editTrophies").value) || 5000,
    clanName: document.getElementById("editClan").value.trim() || "Solo",
    avatarUrl: avatarBase64,
    bio: document.getElementById("editBio").value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
    await updateProfile(user, { displayName: profileData.name });
    currentUserProfile = { ...currentUserProfile, ...profileData };
    window.closeModal('editProfileModal');
    window.showToast("Profile updated successfully!");
    setTimeout(() => location.reload(), 600);
  } catch (err) { window.showToast("Error: " + err.message, "error"); }
};

window.handleEmailLogin = async function(e) {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("loginEmail").value.trim(), document.getElementById("loginPass").value.trim());
    window.closeModal('authModal');
    window.showToast("✅ Login successful!");
    setTimeout(() => location.reload(), 600);
  } catch (error) { window.showToast("Login Error: " + error.message, "error"); }
};

window.handleLogout = function() {
  signOut(auth).then(() => { window.showToast("Logged out!"); setTimeout(() => location.reload(), 600); });
};

window.setTHFilter = function(th) { currentTH = th; renderBasesUI(); };
window.setTypeFilter = function(type) { currentType = type; renderBasesUI(); };

document.addEventListener("DOMContentLoaded", () => {
  renderLevelFilters();
  window.updateUploadLevelOptions();
  loadBasesFromFirestore();
  renderAllIcons();
});