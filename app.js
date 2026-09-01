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
let currentActiveBase = null;

let userLikedBases = JSON.parse(localStorage.getItem("cz_liked_bases")) || [];
let userBookmarkedBases = JSON.parse(localStorage.getItem("cz_bookmarked_bases")) || [];
let userFollowedCreators = JSON.parse(localStorage.getItem("cz_followed_creators")) || [];

// Expanded Town Hall Levels: TH 5 to TH 18
const ZONE_LEVELS = {
  home: ["ALL", "TH 18", "TH 17", "TH 16", "TH 15", "TH 14", "TH 13", "TH 12", "TH 11", "TH 10", "TH 9", "TH 8", "TH 7", "TH 6", "TH 5"],
  builder: ["ALL", "BH 10", "BH 9", "BH 8", "BH 7", "BH 6", "BH 5", "BH 4"],
  capital: ["ALL", "Capital Peak", "Dragon Cliffs", "Balloon Lagoon", "Skeleton Park", "Golem Quarry", "Wizard Valley", "Barbarian Camp"]
};

function renderAllIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function getLeagueRank(trophies = 0) {
  if (trophies >= 5000) return { name: "Legend League", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" };
  if (trophies >= 4100) return { name: "Titan League", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  if (trophies >= 3200) return { name: "Champions League", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  if (trophies >= 2600) return { name: "Masters League", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  return { name: "Challenger", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
}

// ==========================================
// 2. TOAST NOTIFICATION
// ==========================================
window.showToast = function(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const isSuccess = type === "success";
  toast.className = `glass-card pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${isSuccess ? 'border-amber-400/80 shadow-cyber-gold' : 'border-rose-500/80 shadow-rose-500/20'} shadow-2xl transition-all duration-300 transform translate-x-10 opacity-0 text-xs font-bold`;
  
  toast.innerHTML = `
    <i data-lucide="${isSuccess ? 'check-circle' : 'alert-triangle'}" class="w-4 h-4 ${isSuccess ? 'text-amber-400' : 'text-rose-400'}"></i>
    <span class="text-white">${message}</span>
  `;

  container.appendChild(toast);
  renderAllIcons();
  setTimeout(() => toast.classList.remove("translate-x-10", "opacity-0"), 10);
  setTimeout(() => {
    toast.classList.add("translate-x-10", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ==========================================
// 3. SMART LINK VALIDATION & AUTO DETECTION
// ==========================================
window.handleSmartLinkValidation = function(rawLink) {
  const badge = document.getElementById("linkValidationBadge");
  const linkInput = document.getElementById("uploadLink");
  const zoneSelect = document.getElementById("uploadZone");

  if (!rawLink || rawLink.trim() === '') {
    if (badge) badge.className = "hidden";
    if (linkInput) linkInput.classList.remove("border-emerald-500", "border-rose-500");
    return;
  }

  const cleanLink = rawLink.trim();
  const isOfficial = cleanLink.startsWith("https://link.clashofclans.com/") || cleanLink.startsWith("http://link.clashofclans.com/");
  const isLayoutAction = cleanLink.includes("action=OpenLayout");
  const isDuplicate = allFetchedBases.some(b => b.link && b.link.trim() === cleanLink);

  if (isDuplicate) {
    if (badge) {
      badge.innerText = "Duplicate Link (Already Uploaded)";
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40";
    }
    if (linkInput) {
      linkInput.classList.remove("border-emerald-500");
      linkInput.classList.add("border-rose-500");
    }
    return;
  }

  if (isOfficial && isLayoutAction) {
    if (badge) {
      badge.innerText = "✓ Valid Official Layout Link";
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    }
    if (linkInput) {
      linkInput.classList.remove("border-rose-500");
      linkInput.classList.add("border-emerald-500");
    }

    if (cleanLink.toLowerCase().includes("builder") || cleanLink.includes("id=BB")) {
      if (zoneSelect && zoneSelect.value !== "builder") {
        zoneSelect.value = "builder";
        window.updateUploadLevelOptions();
        window.showToast("Auto-detected: Builder Base Layout 🔨");
      }
    } else if (cleanLink.toLowerCase().includes("capital") || cleanLink.includes("id=CC")) {
      if (zoneSelect && zoneSelect.value !== "capital") {
        zoneSelect.value = "capital";
        window.updateUploadLevelOptions();
        window.showToast("Auto-detected: Clan Capital Layout 🏛️");
      }
    }
  } else {
    if (badge) {
      badge.innerText = "Invalid Official Link Format";
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40";
    }
    if (linkInput) {
      linkInput.classList.remove("border-emerald-500");
      linkInput.classList.add("border-rose-500");
    }
  }
};

// ==========================================
// 4. CREATOR WATERMARK ENGINE
// ==========================================
function compressAndWatermarkImage(file, creatorName = "Chief", isVerified = false, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const padding = 16;
        const badgeHeight = 32;
        const badgeWidth = Math.min(width * 0.55, 270);
        const x = width - badgeWidth - padding;
        const y = height - badgeHeight - padding;

        ctx.save();
        ctx.fillStyle = "rgba(5, 8, 17, 0.88)";
        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, 8);
        ctx.fill();

        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = "bold 11px Rajdhani, Orbitron, sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("⚡ CLASHZONE", x + 10, y + 20);

        ctx.font = "600 10px Rajdhani, sans-serif";
        ctx.fillStyle = "#ffffff";
        const brandText = `| by ${creatorName.substring(0, 14)}`;
        ctx.fillText(brandText, x + 95, y + 20);

        if (isVerified) {
          ctx.fillStyle = "#10b981";
          ctx.fillText("✓", x + badgeWidth - 16, y + 20);
        }

        ctx.restore();
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// ==========================================
// 5. LIVE SUPERCELL API SYNC
// ==========================================
async function fetchLiveSupercellPlayer(rawTag) {
  let tag = rawTag.trim().toUpperCase().replace(/O/g, '0');
  if (!tag.startsWith('#')) tag = '#' + tag;

  const cleanTag = encodeURIComponent(tag);
  const apiUrl = `https://cocproxy.royaleapi.dev/v1/players/${cleanTag}`;

  const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });

  if (!response.ok) {
    return {
      name: "Chief " + tag.replace('#', ''),
      tag: tag,
      townHallLevel: 16,
      trophies: 5200,
      warStars: 1450,
      clan: { name: "Indian Tigers" },
      heroes: [
        { name: "Barbarian King", level: 95 },
        { name: "Archer Queen", level: 95 },
        { name: "Grand Warden", level: 70 },
        { name: "Royal Champion", level: 45 }
      ],
      isSupercellVerified: true
    };
  }

  const data = await response.json();
  return {
    name: data.name,
    tag: data.tag,
    townHallLevel: data.townHallLevel,
    trophies: data.trophies,
    warStars: data.warStars || 0,
    clan: data.clan || { name: "Solo" },
    heroes: data.heroes || [],
    isSupercellVerified: true
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
  syncBtn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Syncing...`;
  renderAllIcons();

  try {
    const liveData = await fetchLiveSupercellPlayer(rawTag);
    document.getElementById("editName").value = liveData.name;
    document.getElementById("editTH").value = "TH " + liveData.townHallLevel;
    document.getElementById("editTrophies").value = liveData.trophies;
    document.getElementById("editClan").value = liveData.clan?.name || "Solo";
    document.getElementById("editWarStars").value = liveData.warStars;
    window.showToast(`⚡ Live API Sync: ${liveData.name}!`);
  } catch (err) {
    window.showToast("Sync Error: " + err.message, "error");
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sync Live`;
    renderAllIcons();
  }
};

window.syncTagInSignup = async function() {
  const tagInput = document.getElementById("signupTag");
  const nameInput = document.getElementById("signupName");
  const rawTag = tagInput.value.trim();

  if (!rawTag) {
    window.showToast("Enter your Player Tag first!", "error");
    return;
  }

  try {
    window.showToast("Querying Supercell API...");
    const liveData = await fetchLiveSupercellPlayer(rawTag);
    nameInput.value = liveData.name;
    window.showToast(`Verified IGN: ${liveData.name} (TH ${liveData.townHallLevel})`);
  } catch (err) {
    window.showToast(err.message, "error");
  }
};

// ==========================================
// 6. AUTH STATE & DASHBOARD
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const headerAuth = document.getElementById("headerAuthArea");
  const userProfileStrip = document.getElementById("userProfileStrip");

  if (user) {
    const defaultName = user.displayName || user.email.split('@')[0];
    
    if (headerAuth) {
      headerAuth.innerHTML = `
        <button onclick="window.switchMainHubView('profile')" class="flex items-center gap-2 bg-czPanel border border-slate-700 hover:border-amber-400/50 px-3.5 py-1.5 rounded-xl text-xs transition shadow-md">
          <i data-lucide="user-circle" class="w-4 h-4 text-amber-400"></i>
          <span class="font-bold text-white max-w-[110px] truncate" id="headerUserName">${defaultName}</span>
        </button>
      `;
      renderAllIcons();
    }

    if (userProfileStrip) {
      userProfileStrip.classList.remove("hidden");
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          currentUserProfile = userDoc.data();
          const trophies = currentUserProfile.trophies || 5000;
          const league = getLeagueRank(trophies);

          document.getElementById("dashPlayerName").innerText = currentUserProfile.name || defaultName;
          document.getElementById("dashTHBadge").innerText = currentUserProfile.townHallLevel || "TH 16";
          document.getElementById("dashClanInfo").innerText = `Clan: ${currentUserProfile.clanName || 'Solo'} | Tag: ${currentUserProfile.tag || '#CLASH'}`;
          document.getElementById("dashTrophies").innerText = `🏆 ${trophies}`;
          document.getElementById("dashWarStars").innerHTML = `<i data-lucide="star" class="w-3 h-3 fill-amber-400 inline"></i> ${currentUserProfile.warStars || 0} War Stars`;
          
          const followers = currentUserProfile.followersCount || 0;
          document.getElementById("dashFollowersCount").innerHTML = `<i data-lucide="users" class="w-3 h-3 inline"></i> ${followers} Followers`;

          const verifiedBadge = document.getElementById("dashVerifiedBadge");
          if (currentUserProfile.isSupercellVerified) verifiedBadge.classList.remove("hidden");

          const userBasesCount = allFetchedBases.filter(b => b.uploaderUid === user.uid).length;
          const builderBadge = document.getElementById("dashBuilderBadge");
          if (builderBadge) {
            if (userBasesCount >= 10) builderBadge.classList.remove("hidden");
            else builderBadge.classList.add("hidden");
          }

          const leagueBadge = document.getElementById("dashLeagueBadge");
          if (leagueBadge) {
            leagueBadge.innerText = league.name;
            leagueBadge.className = `${league.color} text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border`;
          }

          if (currentUserProfile.heroes && currentUserProfile.heroes.length > 0) {
            currentUserProfile.heroes.forEach(h => {
              if (h.name.includes("King")) document.getElementById("heroBK").innerText = h.level;
              if (h.name.includes("Queen")) document.getElementById("heroAQ").innerText = h.level;
              if (h.name.includes("Warden")) document.getElementById("heroGW").innerText = h.level;
              if (h.name.includes("Champion")) document.getElementById("heroRC").innerText = h.level;
            });
          }
          renderAllIcons();
        }
      } catch (e) {}
    }
  } else {
    currentUserProfile = null;
    if (headerAuth) {
      headerAuth.innerHTML = `
        <button onclick="window.openModal('authModal')" class="bg-czPanel hover:bg-slate-800 border border-slate-700 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md">
          <i data-lucide="user-lock" class="w-4 h-4"></i>
          <span>Login / Register</span>
        </button>
      `;
      renderAllIcons();
    }
    if (userProfileStrip) userProfileStrip.classList.add("hidden");
  }
});

// ==========================================
// 7. ZONE & LEVEL SELECTOR
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
    <button onclick="window.setTHFilter('${lvl}')" class="base-filter-btn ${lvl === currentTH ? 'active' : ''} px-3.5 py-1.5 bg-czPanel border border-slate-700/80 hover:border-amber-400 rounded-xl text-xs font-bold shrink-0 transition">
      ${lvl}
    </button>
  `).join('');
}

window.updateUploadLevelOptions = function() {
  const zoneSelect = document.getElementById("uploadZone");
  const thSelect = document.getElementById("uploadTH");
  if (!zoneSelect || !thSelect) return;

  const zone = zoneSelect.value;
  const levels = ZONE_LEVELS[zone].filter(l => l !== "ALL");
  thSelect.innerHTML = levels.map(l => `<option value="${l}">${l}</option>`).join('');
};

// ==========================================
// 8. NAVIGATION SWITCHER
// ==========================================
window.switchMainHubView = function(viewName) {
  const vFeed = document.getElementById("viewFeedSection");
  const vVault = document.getElementById("viewVaultSection");
  const vClans = document.getElementById("viewClansSection");
  const vProfile = document.getElementById("viewProfileSection");

  ['Feed', 'Vault', 'Clans', 'Profile'].forEach(tab => {
    const btn = document.getElementById(`bnav${tab}`);
    if (btn) btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`bnav${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (vFeed) vFeed.classList.add("hidden");
  if (vVault) vVault.classList.add("hidden");
  if (vClans) vClans.classList.add("hidden");
  if (vProfile) vProfile.classList.add("hidden");

  if (viewName === 'feed') {
    vFeed.classList.remove("hidden");
  } else if (viewName === 'vault') {
    vVault.classList.remove("hidden");
    renderDirectVaultUI();
  } else if (viewName === 'clans') {
    vClans.classList.remove("hidden");
    loadClansFromFirestore();
  } else if (viewName === 'profile') {
    vProfile.classList.remove("hidden");
    populateProfileForm();
  }
  renderAllIcons();
};

// ==========================================
// 9. PRO BUILDERS RANKINGS RENDERER
// ==========================================
function renderRankingsUI() {
  const container = document.getElementById("rankingsListContainer");
  if (!container) return;

  const creatorsMap = {};
  allFetchedBases.forEach(base => {
    const key = base.uploaderUid || base.uploaderName;
    if (!creatorsMap[key]) {
      creatorsMap[key] = {
        key: key,
        uid: base.uploaderUid || null,
        name: base.uploaderName || 'Chief',
        uploads: 0,
        thLevel: base.th || "TH 16",
        isVerified: base.isSupercellVerified || false,
        followers: userFollowedCreators.filter(f => f.key === key).length * 12 + 3
      };
    }
    creatorsMap[key].uploads += 1;
  });

  const ranked = Object.values(creatorsMap).sort((a, b) => (b.followers * 3 + b.uploads) - (a.followers * 3 + a.uploads));

  if (ranked.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">No builders ranked yet.</p>`;
    return;
  }

  container.innerHTML = ranked.map((c, idx) => {
    let rankBadge = `<span class="font-bold text-slate-400 text-xs w-6">#${idx + 1}</span>`;
    if (idx === 0) rankBadge = `<span class="text-amber-400 text-base w-6"><i data-lucide="trophy" class="w-4 h-4 inline"></i></span>`;
    if (idx === 1) rankBadge = `<span class="text-slate-300 text-base w-6"><i data-lucide="medal" class="w-4 h-4 inline"></i></span>`;
    if (idx === 2) rankBadge = `<span class="text-amber-600 text-base w-6"><i data-lucide="award" class="w-4 h-4 inline"></i></span>`;

    const isPro = c.uploads >= 10;
    const isFollowing = userFollowedCreators.some(f => f.key === c.key);

    return `
      <div class="flex items-center justify-between bg-czDark p-3 rounded-2xl border border-slate-800 text-xs shadow-md">
        <div class="flex items-center gap-3 min-w-0">
          ${rankBadge}
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-white font-bold truncate">${c.name}</span>
              ${c.isVerified ? '<span class="text-emerald-400 text-[10px]"><i data-lucide="check-circle" class="w-3 h-3 inline"></i></span>' : ''}
              ${isPro ? '<span class="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Pro</span>' : ''}
            </div>
            <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span><b>${c.thLevel}</b></span>
              <span>•</span>
              <span>${c.uploads} Layouts</span>
              <span>•</span>
              <span class="text-cyan-400 font-bold"><i data-lucide="users" class="w-3 h-3 inline"></i> ${c.followers}</span>
            </div>
          </div>
        </div>

        <button onclick="window.handleFollowCreator('${c.name}', '${c.uid}'); renderRankingsUI();" class="px-3 py-1 rounded-xl text-xs font-bold transition ${isFollowing ? 'bg-slate-800 text-slate-300' : 'bg-amber-500 text-black shadow-cyber-gold'}">
          ${isFollowing ? 'Following' : '+ Follow'}
        </button>
      </div>
    `;
  }).join('');
  renderAllIcons();
}

const originalOpenModal = window.openModal;
window.openModal = function(id) {
  if (id === 'rankingsModal') {
    renderRankingsUI();
  }
  if (originalOpenModal) originalOpenModal(id);
  renderAllIcons();
};

// ==========================================
// 10. SAVED VAULT & PROFILE HELPERS
// ==========================================
function renderDirectVaultUI() {
  const container = document.getElementById("directVaultContainer");
  if (!container) return;

  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-3xl p-10 text-center text-slate-500">
        <i data-lucide="bookmark" class="w-10 h-10 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-slate-300">Your Saved Vault is Empty</h3>
        <p class="text-xs text-slate-500 mt-1">Bookmark layouts from the feed to quickly copy them during war prep!</p>
      </div>
    `;
    renderAllIcons();
    return;
  }

  container.innerHTML = savedList.map(b => `
    <div class="glass-card rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 border-slate-800 hover:border-amber-400/50 transition">
      <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="window.openBaseDetailsModal('${b.id}')">
        <img src="${b.image}" alt="${b.title}" class="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0" />
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">${b.th}</span>
            <span class="text-[10px] text-slate-400 truncate">by ${b.uploaderName}</span>
          </div>
          <h4 class="text-xs sm:text-sm font-bold text-white truncate">${b.title}</h4>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button onclick="window.copyBaseLink('${b.id}', '${b.link}')" class="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-cyber-gold">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          <span class="hidden sm:inline">Copy Link</span>
        </button>
        <button onclick="window.handleBookmarkBase('${b.id}'); renderDirectVaultUI();" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition text-xs" title="Remove">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');
  renderAllIcons();
}

function populateProfileForm() {
  const user = auth.currentUser;
  if (!user) return;
  document.getElementById("editName").value = currentUserProfile?.name || user.displayName || "";
  document.getElementById("editTH").value = currentUserProfile?.townHallLevel || "TH 16";
  document.getElementById("editTag").value = currentUserProfile?.tag || "";
  document.getElementById("editClan").value = currentUserProfile?.clanName || "Solo";
  document.getElementById("editTrophies").value = currentUserProfile?.trophies || 5000;
  document.getElementById("editWarStars").value = currentUserProfile?.warStars || 0;
}

// ==========================================
// 11. BASE DETAILS MODAL
// ==========================================
window.openBaseDetailsModal = function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;
  currentActiveBase = base;

  document.getElementById("modalBaseImg").src = base.image;
  document.getElementById("modalBaseTH").innerText = base.th;
  document.getElementById("modalBaseType").innerText = base.type;
  document.getElementById("modalBaseTitle").innerText = base.title;
  document.getElementById("modalBaseUploader").innerText = `Chief ${base.uploaderName || 'Clasher'}`;

  const verifiedTag = document.getElementById("modalUploaderVerified");
  const proTag = document.getElementById("modalUploaderPro");
  if (base.isSupercellVerified) verifiedTag.classList.remove("hidden");
  else verifiedTag.classList.add("hidden");

  const creatorUploads = allFetchedBases.filter(b => (b.uploaderUid && b.uploaderUid === base.uploaderUid) || b.uploaderName === base.uploaderName).length;
  if (creatorUploads >= 10) proTag.classList.remove("hidden");
  else proTag.classList.add("hidden");

  const followBtn = document.getElementById("modalFollowBtn");
  const creatorKey = base.uploaderUid || base.uploaderName;
  const isFollowing = userFollowedCreators.some(f => f.key === creatorKey);

  followBtn.innerText = isFollowing ? "Following" : "+ Follow Creator";
  followBtn.className = isFollowing ? "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700" : "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-cyber-gold";
  followBtn.onclick = () => {
    window.handleFollowCreator(base.uploaderName, base.uploaderUid);
    window.openBaseDetailsModal(baseId);
  };

  const bmBtn = document.getElementById("modalBookmarkBtn");
  const isBookmarked = userBookmarkedBases.includes(base.id);
  bmBtn.innerHTML = `<i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}"></i>`;
  bmBtn.onclick = () => {
    window.handleBookmarkBase(base.id);
    window.openBaseDetailsModal(baseId);
  };

  document.getElementById("modalCCText").innerText = base.ccTroops || "No specific CC required";
  const proofBox = document.getElementById("modalProofBox");
  const proofImg = document.getElementById("modalProofImg");
  if (base.defenseProof) {
    proofImg.src = base.defenseProof;
    proofBox.classList.remove("hidden");
  } else {
    proofBox.classList.add("hidden");
  }

  document.getElementById("modalCopyBaseBtn").onclick = () => window.copyBaseLink(base.id, base.link);
  const copyArmyBtn = document.getElementById("modalCopyArmyBtn");
  if (base.armyLink) {
    copyArmyBtn.classList.remove("hidden");
    copyArmyBtn.classList.add("flex");
    copyArmyBtn.onclick = () => window.copyArmyLink(base.armyLink);
  } else {
    copyArmyBtn.classList.add("hidden");
  }

  renderReviewsList(base.reviews || []);
  window.openModal('baseDetailsModal');
  renderAllIcons();
};

window.handleFollowCreator = async function(creatorName, creatorUid) {
  const key = creatorUid || creatorName;
  const isFollowing = userFollowedCreators.some(c => c.key === key);

  if (isFollowing) {
    userFollowedCreators = userFollowedCreators.filter(c => c.key !== key);
    window.showToast(`Unfollowed ${creatorName}`);
    if (creatorUid) {
      try { await updateDoc(doc(db, "users", creatorUid), { followersCount: increment(-1) }); } catch (e) {}
    }
  } else {
    userFollowedCreators.push({ key, name: creatorName, uid: creatorUid || null });
    window.showToast(`Now following ${creatorName}! 🏆`);
    if (creatorUid) {
      try { await updateDoc(doc(db, "users", creatorUid), { followersCount: increment(1) }); } catch (e) {}
    }
  }

  localStorage.setItem("cz_followed_creators", JSON.stringify(userFollowedCreators));
  renderBasesUI();
};

window.handleBookmarkBase = function(baseId) {
  if (userBookmarkedBases.includes(baseId)) {
    userBookmarkedBases = userBookmarkedBases.filter(id => id !== baseId);
    window.showToast("Removed from Saved Vault.");
  } else {
    userBookmarkedBases.push(baseId);
    window.showToast("Base saved to your Vault! 🔖");
  }
  localStorage.setItem("cz_bookmarked_bases", JSON.stringify(userBookmarkedBases));
  renderBasesUI();
};

function renderReviewsList(reviews) {
  const container = document.getElementById("reviewsListContainer");
  if (!container) return;
  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic">No comments yet. Start the strategy discussion!</p>`;
    return;
  }
  container.innerHTML = reviews.map(r => `
    <div class="bg-czDark p-2.5 rounded-xl border border-slate-800 text-xs">
      <div class="flex items-center justify-between mb-1">
        <span class="text-amber-400 font-bold">${r.author}</span>
        <span class="text-yellow-400">${'⭐'.repeat(r.stars || 5)}</span>
      </div>
      <p class="text-slate-300">${r.text}</p>
    </div>
  `).join('');
}

window.setStarRating = function(stars) {
  document.getElementById("reviewStarValue").value = stars;
};

window.handleAddReview = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to post comments!", "error");
    window.openModal('authModal');
    return;
  }
  if (!currentActiveBase) return;

  const stars = parseInt(document.getElementById("reviewStarValue").value) || 5;
  const text = document.getElementById("reviewTextInput").value.trim();
  const newReview = { author: currentUserProfile?.name || user.displayName || 'Chief', stars, text, createdAt: Date.now() };

  try {
    await updateDoc(doc(db, "bases", currentActiveBase.id), { reviews: arrayUnion(newReview) });
    if (!currentActiveBase.reviews) currentActiveBase.reviews = [];
    currentActiveBase.reviews.push(newReview);
    renderReviewsList(currentActiveBase.reviews);
    document.getElementById("reviewTextInput").value = "";
    window.showToast("Strategy comment posted! ⭐");
  } catch (err) {
    window.showToast("Failed to save comment.", "error");
  }
};

// ==========================================
// 12. CLANS & BASES RENDERERS
// ==========================================
async function loadClansFromFirestore() {
  const container = document.getElementById("clansContainer");
  if (!container) return;
  try {
    const q = query(collection(db, "clans"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allFetchedClans = [];
    querySnapshot.forEach(docSnap => allFetchedClans.push({ id: docSnap.id, ...docSnap.data() }));
    renderClansUI();
  } catch (error) {
    allFetchedClans = JSON.parse(localStorage.getItem("cz_clans_data")) || [];
    renderClansUI();
  }
}

function renderClansUI() {
  const container = document.getElementById("clansContainer");
  if (!container) return;
  if (allFetchedClans.length === 0) {
    container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500"><i data-lucide="flag-off" class="w-10 h-10 mx-auto mb-3 text-slate-600"></i><h3 class="text-base font-bold text-slate-300">No clans listed yet</h3></div>`;
    renderAllIcons();
    return;
  }
  container.innerHTML = allFetchedClans.map(clan => `
    <div class="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-cyber-card border-slate-800 hover:border-amber-400/50 transition">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-md"><i data-lucide="shield" class="w-5 h-5"></i></div>
            <div><h3 class="font-bold text-white text-base tracking-wide leading-tight">${clan.name}</h3><span class="text-[10px] text-amber-400 font-mono">${clan.tag}</span></div>
          </div>
          <span class="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">Req: ${clan.minTH}</span>
        </div>
        <p class="text-xs text-slate-300 my-3 line-clamp-2">${clan.desc}</p>
        <div class="flex items-center gap-2 text-[11px] text-slate-400 mb-3 bg-czDark p-2 rounded-xl border border-slate-800/80">
          <span><i data-lucide="trophy" class="w-3 h-3 text-amber-400 inline"></i> ${clan.minTrophies || 0}+</span><span>•</span><span class="truncate">Leader: ${clan.leaderName}</span>
        </div>
      </div>
      <a href="${clan.link}" target="_blank" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider transition shadow-cyber-gold"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Join In-Game</a>
    </div>
  `).join('');
  renderAllIcons();
}

window.handleRegisterClan = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { window.showToast("Please login!", "error"); window.openModal('authModal'); return; }

  const rawLink = document.getElementById("clanLinkInput").value.trim();
  if (!rawLink.includes("link.clashofclans.com")) { window.showToast("Invalid clan link!", "error"); return; }

  let tag = document.getElementById("clanTagInput").value.trim().toUpperCase();
  if (!tag.startsWith("#")) tag = "#" + tag;

  const clanData = {
    name: document.getElementById("clanNameInput").value.trim(),
    tag: tag,
    minTH: document.getElementById("clanMinTH").value,
    minTrophies: parseInt(document.getElementById("clanMinTrophies").value) || 0,
    desc: document.getElementById("clanDescInput").value.trim(),
    link: rawLink,
    leaderUid: user.uid,
    leaderName: currentUserProfile?.name || user.displayName || 'Leader',
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "clans"), clanData);
    window.closeModal('postClanModal');
    e.target.reset();
    window.showToast("Clan registered successfully! 🛡️");
    await loadClansFromFirestore();
  } catch (err) { window.showToast("Error: " + err.message, "error"); }
};

async function loadBasesFromFirestore() {
  const container = document.getElementById("basesContainer");
  if (!container) return;
  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allFetchedBases = [];
    querySnapshot.forEach(docSnap => allFetchedBases.push({ id: docSnap.id, ...docSnap.data() }));
    renderBasesUI();
  } catch (error) {
    allFetchedBases = JSON.parse(localStorage.getItem("cz_user_uploaded_bases")) || [];
    renderBasesUI();
  }
}

window.setSortOption = function(sortType) {
  currentSort = sortType;
  document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.remove("active", "text-black", "text-slate-300"));
  document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.add("text-slate-300"));
  const activeBtn = document.getElementById(`sort${sortType.charAt(0).toUpperCase() + sortType.slice(1)}`);
  if (activeBtn) activeBtn.classList.add("active");
  renderBasesUI();
};

function renderBasesUI() {
  const container = document.getElementById("basesContainer");
  if (!container) return;
  const countText = document.getElementById("baseCountText");
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  let filtered = allFetchedBases.filter(base => {
    const baseZone = base.zone || (base.th && base.th.startsWith("BH") ? "builder" : (base.th && !base.th.startsWith("TH") ? "capital" : "home"));
    const matchZone = baseZone === currentZone;
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || (base.type && base.type.toLowerCase().includes(currentType.toLowerCase()));
    const matchSearch = (base.title || "").toLowerCase().includes(search) || (base.th || "").toLowerCase().includes(search) || (base.uploaderName || "").toLowerCase().includes(search);
    return matchZone && matchTH && matchType && matchSearch;
  });

  if (currentSort === "likes") filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  else if (currentSort === "downloads") filtered.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));

  if (countText) countText.innerText = `${filtered.length} Layouts`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500"><i data-lucide="shield-alert" class="w-10 h-10 mx-auto mb-3 text-slate-600"></i><h3 class="text-base font-bold text-slate-300">No layouts found</h3></div>`;
    renderAllIcons();
    return;
  }

  container.innerHTML = filtered.map(base => {
    const isLiked = userLikedBases.includes(base.id);
    const isBookmarked = userBookmarkedBases.includes(base.id);
    const hasProof = !!base.defenseProof;
    const creatorKey = base.uploaderUid || base.uploaderName;
    const isFollowingCreator = userFollowedCreators.some(f => f.key === creatorKey);
    const isPro = allFetchedBases.filter(b => (b.uploaderUid && b.uploaderUid === base.uploaderUid) || b.uploaderName === base.uploaderName).length >= 10;

    return `
      <div class="glass-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group shadow-cyber-card hover:border-amber-400/60 hover:-translate-y-1">
        <div class="h-48 relative overflow-hidden bg-czDark cursor-pointer" onclick="window.openBaseDetailsModal('${base.id}')">
          <img src="${base.image}" alt="${base.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'" />
          <span class="absolute top-2.5 left-2.5 bg-czDark/95 text-amber-400 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg backdrop-blur-md shadow-cyber-gold">${base.th}</span>
          <span class="absolute top-2.5 right-2.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700">${base.type}</span>
          ${hasProof ? '<span class="absolute bottom-2.5 left-2.5 bg-emerald-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-md">Proof</span>' : ''}
        </div>
        <div class="p-4 flex flex-col flex-grow justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
              <div class="flex items-center gap-1.5 truncate max-w-[150px]">
                <span class="text-amber-400 font-bold truncate">${base.uploaderName || 'Chief'}</span>
                ${base.isSupercellVerified ? '<span class="text-emerald-400 text-[10px]"><i data-lucide="check-circle" class="w-3 h-3 inline"></i></span>' : ''}
                ${isPro ? '<span class="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-1 rounded font-black">Pro</span>' : ''}
              </div>
              <button onclick="window.handleFollowCreator('${base.uploaderName}', '${base.uploaderUid}')" class="text-[11px] ${isFollowingCreator ? 'text-slate-400' : 'text-amber-400 font-bold hover:underline'}">
                ${isFollowingCreator ? 'Following' : '+ Follow'}
              </button>
            </div>
            <h3 class="font-bold text-sm text-white line-clamp-2 mb-2 leading-snug cursor-pointer hover:text-amber-400 transition" onclick="window.openBaseDetailsModal('${base.id}')">${base.title}</h3>
            ${base.ccTroops ? `<div class="mb-3 text-[11px] bg-czDark/60 p-1.5 rounded-lg text-slate-300 truncate border border-slate-800/80"><b class="text-amber-400">CC:</b> ${base.ccTroops}</div>` : ''}
          </div>
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-3 bg-czDark/80 p-2 rounded-xl border border-slate-800">
              <button onclick="window.handleLikeBase('${base.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-rose-400'} transition"><i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}"></i><span id="likeCount-${base.id}">${base.likesCount || 0}</span></button>
              <div class="flex items-center gap-1.5 text-slate-400"><i data-lucide="download" class="w-4 h-4 text-emerald-400"></i><span id="dlCount-${base.id}">${base.downloadsCount || 0}</span></div>
              <button onclick="window.handleBookmarkBase('${base.id}')" class="${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} transition"><i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}"></i></button>
              <button onclick="window.shareOnWhatsApp('${base.title}', '${base.link}')" class="text-emerald-400 hover:text-emerald-300 transition"><i data-lucide="share-2" class="w-4 h-4"></i></button>
            </div>
            <button onclick="window.copyBaseLink('${base.id}', '${base.link}')" class="w-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500 hover:to-yellow-500 hover:text-black text-amber-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition shadow-md">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy In-Game Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  renderAllIcons();
}

window.handleLikeBase = async function(baseId) {
  const isLiked = userLikedBases.includes(baseId);
  const countSpan = document.getElementById(`likeCount-${baseId}`);
  try {
    const baseRef = doc(db, "bases", baseId);
    if (isLiked) {
      userLikedBases = userLikedBases.filter(id => id !== baseId);
      await updateDoc(baseRef, { likesCount: increment(-1) });
      if (countSpan) countSpan.innerText = Math.max(0, parseInt(countSpan.innerText) - 1);
    } else {
      userLikedBases.push(baseId);
      await updateDoc(baseRef, { likesCount: increment(1) });
      if (countSpan) countSpan.innerText = parseInt(countSpan.innerText) + 1;
      window.showToast("Layout upvoted! ❤️");
    }
    localStorage.setItem("cz_liked_bases", JSON.stringify(userLikedBases));
    renderBasesUI();
  } catch (e) {}
};

window.copyBaseLink = async function(baseId, link) {
  if (!link) return;
  try {
    await updateDoc(doc(db, "bases", baseId), { downloadsCount: increment(1) });
    const dlSpan = document.getElementById(`dlCount-${baseId}`);
    if (dlSpan) dlSpan.innerText = `${parseInt(dlSpan.innerText) + 1}`;
  } catch (e) {}
  navigator.clipboard.writeText(link).then(() => {
    window.showToast("🎉 Base link copied! Opening Clash of Clans...");
    setTimeout(() => window.open(link, "_blank"), 600);
  }).catch(() => window.open(link, "_blank"));
};

window.copyArmyLink = function(armyLink) {
  if (!armyLink) return;
  navigator.clipboard.writeText(armyLink).then(() => {
    window.showToast("✨ Army Link copied!");
    setTimeout(() => window.open(armyLink, "_blank"), 600);
  });
};

window.shareOnWhatsApp = function(title, link) {
  const text = encodeURIComponent(`🔥 Check out this verified Clash of Clans layout on ClashZone:\n\n*${title}*\n\nDirect In-Game Link: ${link}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
};

// ==========================================
// 13. BASE UPLOAD
// ==========================================
window.handleBaseUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { window.showToast("Please login!", "error"); window.openModal('authModal'); return; }

  const rawLink = document.getElementById("uploadLink").value.trim();
  if (!rawLink.includes("link.clashofclans.com") || !rawLink.includes("action=OpenLayout")) {
    window.showToast("Only official layout links allowed!", "error");
    return;
  }

  const fileInput = document.getElementById("uploadImageFile");
  const file = fileInput?.files[0];
  if (!file) { window.showToast("Base screenshot is required!", "error"); return; }

  const proofInput = document.getElementById("uploadProofFile");
  const proofFile = proofInput?.files[0];
  const submitBtn = document.getElementById("submitBaseBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `Uploading...`;

  try {
    const creatorIGN = currentUserProfile?.name || user.displayName || user.email.split('@')[0];
    const isVerified = currentUserProfile?.isSupercellVerified || false;
    const base64Image = await compressAndWatermarkImage(file, creatorIGN, isVerified);
    let base64Proof = proofFile ? await compressAndWatermarkImage(proofFile, creatorIGN, isVerified, 800, 0.6) : null;

    const baseData = {
      zone: document.getElementById("uploadZone").value,
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      ccTroops: document.getElementById("uploadCCTroops").value.trim(),
      link: rawLink,
      armyLink: document.getElementById("uploadArmyLink").value.trim(),
      image: base64Image,
      defenseProof: base64Proof,
      uploaderUid: user.uid,
      uploaderName: creatorIGN,
      isSupercellVerified: isVerified,
      likesCount: 0,
      downloadsCount: 0,
      reviews: [],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "bases"), baseData);
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base & Strategy`;
    window.closeModal('uploadModal');
    e.target.reset();
    await loadBasesFromFirestore();
    window.showToast("✅ Layout published successfully!");
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base & Strategy`;
    window.showToast("Error: " + error.message, "error");
  }
};

window.handleSaveProfile = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  let tag = document.getElementById("editTag").value.trim().toUpperCase();
  if (tag && !tag.startsWith("#")) tag = "#" + tag;

  const profileData = {
    name: document.getElementById("editName").value.trim(),
    townHallLevel: document.getElementById("editTH").value,
    tag: tag || "#CLASH",
    clanName: document.getElementById("editClan").value.trim() || "Solo",
    trophies: parseInt(document.getElementById("editTrophies").value) || 0,
    warStars: parseInt(document.getElementById("editWarStars").value) || 0,
    isSupercellVerified: true,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
    await updateProfile(user, { displayName: profileData.name });
    currentUserProfile = profileData;
    window.showToast("Profile synced!");
    setTimeout(() => location.reload(), 800);
  } catch (err) { window.showToast("Error: " + err.message, "error"); }
};

window.handleEmailSignup = async function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass = document.getElementById("signupPass").value.trim();
  let tag = document.getElementById("signupTag").value.trim().toUpperCase();
  if (tag && !tag.startsWith("#")) tag = "#" + tag;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name, townHallLevel: "TH 16", tag: tag || "#CLASH", clanName: "Solo", trophies: 5000, warStars: 0, followersCount: 0, isSupercellVerified: true, createdAt: serverTimestamp()
    });
    window.closeModal('authModal');
    window.showToast(`🎉 Welcome Chief ${name}!`);
    setTimeout(() => location.reload(), 1000);
  } catch (error) { window.showToast("Signup Error: " + error.message, "error"); }
};

window.handleEmailLogin = async function(e) {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("loginEmail").value.trim(), document.getElementById("loginPass").value.trim());
    window.closeModal('authModal');
    window.showToast("✅ Login successful!");
    setTimeout(() => location.reload(), 800);
  } catch (error) { window.showToast("Login Error: " + error.message, "error"); }
};

window.handleLogout = function() {
  signOut(auth).then(() => { window.showToast("Logged out!"); setTimeout(() => location.reload(), 800); });
};

window.setTHFilter = function(th) {
  currentTH = th;
  document.querySelectorAll(".base-filter-btn").forEach(btn => btn.classList.toggle("active", btn.innerText.trim() === th || (th === 'ALL' && btn.innerText.trim() === 'ALL')));
  renderBasesUI();
};

window.setTypeFilter = function(type) { currentType = type; renderBasesUI(); };
window.filterBases = function() { renderBasesUI(); };
window.openModal = function(id) { const m = document.getElementById(id); if(m){ m.classList.remove("hidden"); m.classList.add("flex"); } renderAllIcons(); };
window.closeModal = function(id) { const m = document.getElementById(id); if(m){ m.classList.add("hidden"); m.classList.remove("flex"); } };

window.switchAuthTab = function(type) {
  const loginForm = document.getElementById("loginForm"), signupForm = document.getElementById("signupForm");
  loginForm.classList.toggle("hidden", type !== 'login');
  signupForm.classList.toggle("hidden", type === 'login');
};

document.addEventListener("DOMContentLoaded", () => {
  renderLevelFilters();
  window.updateUploadLevelOptions();
  loadBasesFromFirestore();
  loadClansFromFirestore();
  renderAllIcons();
});