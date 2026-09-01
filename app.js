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

let currentTH = "ALL";
let currentType = "ALL";
let currentSort = "latest";
let allFetchedBases = [];
let allFetchedClans = [];
let currentUserProfile = null;
let currentReviewBaseId = null;

let userLikedBases = JSON.parse(localStorage.getItem("cz_liked_bases")) || [];
let userBookmarkedBases = JSON.parse(localStorage.getItem("cz_bookmarked_bases")) || [];

// League helper
function getLeagueRank(trophies = 0) {
  if (trophies >= 5000) return { name: "Legend League", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" };
  if (trophies >= 4100) return { name: "Titan League", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  if (trophies >= 3200) return { name: "Champions League", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  if (trophies >= 2600) return { name: "Masters League", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  return { name: "Challenger", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
}

// ==========================================
// 2. CYBER TOAST NOTIFICATION
// ==========================================
window.showToast = function(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const isSuccess = type === "success";
  toast.className = `glass-card pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${isSuccess ? 'border-amber-400/80 shadow-cyber-gold' : 'border-rose-500/80 shadow-rose-500/20'} shadow-2xl transition-all duration-300 transform translate-x-10 opacity-0 text-xs font-bold`;
  
  toast.innerHTML = `
    <i class="fa-solid ${isSuccess ? 'fa-circle-check text-amber-400 text-base' : 'fa-triangle-exclamation text-rose-400 text-base'}"></i>
    <span class="text-white">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-x-10", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("translate-x-10", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ==========================================
// 3. AUTH STATE LISTENER & USER DASHBOARD
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const headerAuth = document.getElementById("headerAuthArea");
  const userProfileStrip = document.getElementById("userProfileStrip");

  if (user) {
    const defaultName = user.displayName || user.email.split('@')[0];
    
    if (headerAuth) {
      headerAuth.innerHTML = `
        <button onclick="window.openModal('uploadModal')" class="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-cyber-gold">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Upload</span>
        </button>
        <button onclick="window.openEditProfileModal()" class="flex items-center gap-2 bg-czPanel border border-slate-700 hover:border-amber-400/50 px-3 py-1.5 rounded-xl text-xs transition">
          <i class="fa-solid fa-circle-user text-amber-400 text-sm"></i>
          <span class="font-bold text-white max-w-[90px] truncate" id="headerUserName">${defaultName}</span>
        </button>
      `;
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
          
          const leagueBadge = document.getElementById("dashLeagueBadge");
          if (leagueBadge) {
            leagueBadge.innerText = league.name;
            leagueBadge.className = `${league.color} text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border`;
          }

          // Check if user is Pro Builder (3+ uploads)
          const userBasesCount = allFetchedBases.filter(b => b.uploaderUid === user.uid).length;
          const builderBadge = document.getElementById("dashBuilderBadge");
          if (builderBadge) {
            if (userBasesCount >= 3) builderBadge.classList.remove("hidden");
            else builderBadge.classList.add("hidden");
          }

        } else {
          currentUserProfile = {
            name: defaultName,
            townHallLevel: "TH 16",
            clanName: "Solo",
            tag: "#CLASH",
            trophies: 5000
          };
          document.getElementById("dashPlayerName").innerText = defaultName;
        }
      } catch (e) {
        console.warn("Profile fetch error:", e);
      }
    }

  } else {
    currentUserProfile = null;
    if (headerAuth) {
      headerAuth.innerHTML = `
        <button onclick="window.openModal('authModal')" class="bg-czPanel hover:bg-slate-800 border border-slate-700 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md">
          <i class="fa-solid fa-user-lock"></i>
          <span>Login / Register</span>
        </button>
      `;
    }
    if (userProfileStrip) userProfileStrip.classList.add("hidden");
  }
});

// ==========================================
// 4. MAIN HUB VIEW SWITCHER
// ==========================================
window.switchMainHubView = function(viewName) {
  const vBases = document.getElementById("viewBasesSection");
  const vLeaderboard = document.getElementById("viewLeaderboardSection");
  const vClans = document.getElementById("viewClansSection");

  const tabs = ["Bases", "Leaderboard", "Clans"];
  tabs.forEach(t => {
    const desktopBtn = document.getElementById(`hubTab${t}`);
    const mobileBtn = document.getElementById(`mHubTab${t}`);
    if (desktopBtn) desktopBtn.className = "hub-tab-btn px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 transition hover:text-white";
    if (mobileBtn) mobileBtn.className = "hub-tab-btn px-3 py-1.5 rounded-xl font-bold text-slate-400 transition";
  });

  const activeDesktop = document.getElementById(`hubTab${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  const activeMobile = document.getElementById(`mHubTab${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (activeDesktop) activeDesktop.className = "hub-tab-btn active px-4 py-1.5 rounded-xl text-xs font-bold transition";
  if (activeMobile) activeMobile.className = "hub-tab-btn active px-3 py-1.5 rounded-xl font-bold transition";

  if (vBases) vBases.classList.add("hidden");
  if (vLeaderboard) vLeaderboard.classList.add("hidden");
  if (vClans) vClans.classList.add("hidden");

  if (viewName === 'bases') {
    vBases.classList.remove("hidden");
  } else if (viewName === 'leaderboard') {
    vLeaderboard.classList.remove("hidden");
    renderLeaderboardUI();
  } else if (viewName === 'clans') {
    vClans.classList.remove("hidden");
    loadClansFromFirestore();
  }
};

// ==========================================
// 5. BOOKMARKS & SAVED BASES LOGIC
// ==========================================
window.handleBookmarkBase = function(baseId) {
  if (userBookmarkedBases.includes(baseId)) {
    userBookmarkedBases = userBookmarkedBases.filter(id => id !== baseId);
    window.showToast("Removed from bookmarks.");
  } else {
    userBookmarkedBases.push(baseId);
    window.showToast("Base saved to your Vault! 🔖");
  }
  localStorage.setItem("cz_bookmarked_bases", JSON.stringify(userBookmarkedBases));
  renderBasesUI();
};

window.switchProfileSubTab = function(tabName) {
  const form = document.getElementById("profileDetailsForm");
  const saved = document.getElementById("profileSavedBasesWrapper");
  const uploads = document.getElementById("profileUploadsWrapper");

  const tabDetails = document.getElementById("pSubTabDetails");
  const tabSaved = document.getElementById("pSubTabSaved");
  const tabUploads = document.getElementById("pSubTabUploads");

  [tabDetails, tabSaved, tabUploads].forEach(b => {
    b.className = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-400 transition";
  });

  form.classList.add("hidden");
  saved.classList.add("hidden");
  uploads.classList.add("hidden");

  if (tabName === 'details') {
    form.classList.remove("hidden");
    tabDetails.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black transition";
  } else if (tabName === 'saved') {
    saved.classList.remove("hidden");
    tabSaved.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black transition";
    renderSavedBasesList();
  } else if (tabName === 'uploads') {
    uploads.classList.remove("hidden");
    tabUploads.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black transition";
    renderMyBasesList();
  }
};

function renderSavedBasesList() {
  const container = document.getElementById("savedBasesContainer");
  if (!container) return;

  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic">No bookmarked bases yet.</p>`;
    return;
  }

  container.innerHTML = savedList.map(b => `
    <div class="flex items-center justify-between bg-czDark p-2 rounded-xl border border-slate-800 text-xs">
      <div class="flex items-center gap-2 min-w-0 cursor-pointer" onclick="window.copyBaseLink('${b.id}', '${b.link}')">
        <span class="bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">${b.th}</span>
        <span class="text-white truncate font-medium max-w-[170px]">${b.title}</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.copyBaseLink('${b.id}', '${b.link}')" class="text-amber-400 hover:text-white px-2 py-1 bg-amber-500/10 rounded-lg shrink-0">
          <i class="fa-solid fa-copy"></i>
        </button>
        <button onclick="window.handleBookmarkBase('${b.id}'); renderSavedBasesList();" class="text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg shrink-0" title="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 6. PRO BUILDERS LEADERBOARD LOGIC
// ==========================================
function renderLeaderboardUI() {
  const container = document.getElementById("leaderboardListContainer");
  if (!container) return;

  // Aggregate stats per uploader
  const creatorsMap = {};
  allFetchedBases.forEach(base => {
    const key = base.uploaderUid || base.uploaderName;
    if (!creatorsMap[key]) {
      creatorsMap[key] = {
        name: base.uploaderName || 'Chief',
        uploads: 0,
        totalLikes: 0,
        totalDownloads: 0
      };
    }
    creatorsMap[key].uploads += 1;
    creatorsMap[key].totalLikes += (base.likesCount || 0);
    creatorsMap[key].totalDownloads += (base.downloadsCount || 0);
  });

  const rankedCreators = Object.values(creatorsMap).sort((a, b) => (b.totalLikes * 2 + b.totalDownloads) - (a.totalLikes * 2 + a.totalDownloads));

  if (rankedCreators.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">No creators active yet.</p>`;
    return;
  }

  container.innerHTML = rankedCreators.map((c, idx) => {
    let rankBadge = `<span class="font-bold text-slate-400 text-xs w-6">#${idx + 1}</span>`;
    if (idx === 0) rankBadge = `<span class="text-amber-400 text-base w-6"><i class="fa-solid fa-trophy"></i></span>`;
    if (idx === 1) rankBadge = `<span class="text-slate-300 text-base w-6"><i class="fa-solid fa-medal"></i></span>`;
    if (idx === 2) rankBadge = `<span class="text-amber-600 text-base w-6"><i class="fa-solid fa-award"></i></span>`;

    const isPro = c.uploads >= 3;

    return `
      <div class="flex items-center justify-between bg-czDark/80 p-3 rounded-2xl border border-slate-800 text-xs shadow-md">
        <div class="flex items-center gap-3 min-w-0">
          ${rankBadge}
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-white font-bold truncate">${c.name}</span>
              ${isPro ? '<span class="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[9px] font-black px-1.5 py-0.2 rounded uppercase"><i class="fa-solid fa-certificate"></i> Pro</span>' : ''}
            </div>
            <span class="text-[10px] text-slate-400">${c.uploads} Bases Published</span>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="text-rose-400 font-bold"><i class="fa-solid fa-heart mr-1"></i>${c.totalLikes}</span>
          <span class="text-emerald-400 font-bold"><i class="fa-solid fa-download mr-1"></i>${c.totalDownloads}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 7. RATINGS, REVIEWS & DEFENSE PROOF
// ==========================================
window.openReviewsModal = function(baseId) {
  currentReviewBaseId = baseId;
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;

  document.getElementById("reviewModalBaseTitle").innerText = `${base.th} | ${base.title}`;
  
  const proofWrapper = document.getElementById("defenseProofWrapper");
  const proofImg = document.getElementById("defenseProofImg");
  if (base.defenseProof) {
    proofImg.src = base.defenseProof;
    proofWrapper.classList.remove("hidden");
  } else {
    proofWrapper.classList.add("hidden");
  }

  renderReviewsList(base.reviews || []);
  window.openModal('reviewModal');
};

function renderReviewsList(reviews) {
  const container = document.getElementById("reviewsListContainer");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic">No reviews yet. Be the first to leave one!</p>`;
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
  const starsContainer = document.getElementById("starRatingSelect");
  const starIcons = starsContainer.querySelectorAll("i");
  starIcons.forEach((icon, idx) => {
    if (idx < stars) icon.className = "fa-solid fa-star";
    else icon.className = "fa-regular fa-star text-slate-600";
  });
};

window.handleAddReview = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to post reviews!", "error");
    window.openModal('authModal');
    return;
  }

  const stars = parseInt(document.getElementById("reviewStarValue").value) || 5;
  const text = document.getElementById("reviewTextInput").value.trim();

  const newReview = {
    author: currentUserProfile?.name || user.displayName || 'Chief',
    stars: stars,
    text: text,
    createdAt: Date.now()
  };

  try {
    const baseRef = doc(db, "bases", currentReviewBaseId);
    await updateDoc(baseRef, {
      reviews: arrayUnion(newReview)
    });

    const targetBase = allFetchedBases.find(b => b.id === currentReviewBaseId);
    if (targetBase) {
      if (!targetBase.reviews) targetBase.reviews = [];
      targetBase.reviews.push(newReview);
      renderReviewsList(targetBase.reviews);
    }

    document.getElementById("reviewTextInput").value = "";
    window.showToast("Review submitted successfully! ⭐");
  } catch (err) {
    console.error("Review error:", err);
    window.showToast("Failed to save review.", "error");
  }
};

// ==========================================
// 8. CLAN RECRUITMENT HUB LOGIC
// ==========================================
async function loadClansFromFirestore() {
  const container = document.getElementById("clansContainer");
  if (!container) return;

  try {
    const q = query(collection(db, "clans"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allFetchedClans = [];
    querySnapshot.forEach((docSnap) => {
      allFetchedClans.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderClansUI();
  } catch (error) {
    console.warn("Clans fetch fallback:", error);
    allFetchedClans = JSON.parse(localStorage.getItem("cz_clans_data")) || [];
    renderClansUI();
  }
}

function renderClansUI() {
  const container = document.getElementById("clansContainer");
  if (!container) return;

  if (allFetchedClans.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i class="fa-solid fa-flag-checkered text-4xl mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-slate-300">No clans listed yet</h3>
        <p class="text-xs text-slate-500 mt-1">Be the first clan leader to register your clan!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allFetchedClans.map(clan => `
    <div class="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-cyber-card border-slate-800 hover:border-amber-400/50 transition">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              <i class="fa-solid fa-shield"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-base tracking-wide leading-tight">${clan.name}</h3>
              <span class="text-[10px] text-amber-400 font-mono">${clan.tag}</span>
            </div>
          </div>
          <span class="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">Req: ${clan.minTH}</span>
        </div>

        <p class="text-xs text-slate-300 my-3 line-clamp-2">${clan.desc}</p>
        
        <div class="flex items-center gap-2 text-[11px] text-slate-400 mb-3 bg-czDark p-2 rounded-xl border border-slate-800/80">
          <span><i class="fa-solid fa-trophy text-amber-400 mr-1"></i>${clan.minTrophies || 0}+</span>
          <span>•</span>
          <span class="truncate">Leader: ${clan.leaderName}</span>
        </div>
      </div>

      <a href="${clan.link}" target="_blank" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider transition shadow-cyber-gold">
        <i class="fa-solid fa-door-open"></i> Join In-Game
      </a>
    </div>
  `).join('');
}

window.handleRegisterClan = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to register your clan!", "error");
    window.openModal('authModal');
    return;
  }

  const rawLink = document.getElementById("clanLinkInput").value.trim();
  if (!rawLink.includes("link.clashofclans.com")) {
    window.showToast("Invalid in-game clan link!", "error");
    return;
  }

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
    window.showToast("Clan successfully registered on Hub! 🛡️");
    await loadClansFromFirestore();
  } catch (err) {
    console.error("Clan registration error:", err);
    window.showToast("Error: " + err.message, "error");
  }
};

// ==========================================
// 9. FETCH, SORT & DISPLAY BASES
// ==========================================
async function loadBasesFromFirestore() {
  const container = document.getElementById("basesContainer");
  if (!container) return;

  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allFetchedBases = [];
    querySnapshot.forEach((docSnap) => {
      allFetchedBases.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderBasesUI();
  } catch (error) {
    console.warn("Firestore error, local load:", error);
    allFetchedBases = JSON.parse(localStorage.getItem("cz_user_uploaded_bases")) || [];
    renderBasesUI();
  }
}

window.setSortOption = function(sortType) {
  currentSort = sortType;
  document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.remove("active", "text-black"));
  document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.add("text-slate-300"));

  const activeBtn = document.getElementById(`sort${sortType.charAt(0).toUpperCase() + sortType.slice(1)}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.classList.remove("text-slate-300");
  }

  renderBasesUI();
};

function renderBasesUI() {
  const container = document.getElementById("basesContainer");
  if (!container) return;

  const countText = document.getElementById("baseCountText");
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  let filtered = allFetchedBases.filter(base => {
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || (base.type && base.type.toLowerCase().includes(currentType.toLowerCase()));
    const matchSearch = (base.title || "").toLowerCase().includes(search) || 
                        (base.th || "").toLowerCase().includes(search) || 
                        (base.uploaderName || "").toLowerCase().includes(search);
    return matchTH && matchType && matchSearch;
  });

  if (currentSort === "likes") {
    filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else if (currentSort === "downloads") {
    filtered.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
  }

  if (countText) countText.innerText = `${filtered.length} Layouts`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i class="fa-solid fa-shield-cat text-4xl mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-slate-300">No layouts found</h3>
        <p class="text-xs text-slate-500 mt-1">Upload the first defense layout!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(base => {
    const isLiked = userLikedBases.includes(base.id);
    const isBookmarked = userBookmarkedBases.includes(base.id);
    const hasProof = !!base.defenseProof;

    return `
      <div class="glass-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group shadow-cyber-card hover:border-amber-400/60 hover:-translate-y-1">
        <div class="h-48 relative overflow-hidden bg-czDark cursor-pointer" onclick="window.openLightbox('${base.image}')">
          <img src="${base.image}" alt="${base.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'" />
          
          <span class="absolute top-2.5 left-2.5 bg-czDark/95 text-amber-400 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg backdrop-blur-md shadow-cyber-gold">
            ${base.th}
          </span>
          <span class="absolute top-2.5 right-2.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700">
            ${base.type}
          </span>

          ${hasProof ? '<span class="absolute bottom-2.5 left-2.5 bg-emerald-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-md backdrop-blur-md shadow-md"><i class="fa-solid fa-shield-halved mr-1"></i>Proof Attached</span>' : ''}

          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <span class="bg-black/90 text-amber-400 text-xs px-3 py-1.5 rounded-xl border border-amber-400/50 flex items-center gap-1.5 font-bold shadow-cyber-gold">
              <i class="fa-solid fa-expand"></i> Inspect HD
            </span>
          </div>
        </div>

        <div class="p-4 flex flex-col flex-grow justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span class="text-amber-400 font-bold truncate max-w-[130px]"><i class="fa-solid fa-circle-user mr-1"></i> ${base.uploaderName || 'Chief'}</span>
              
              <div class="flex items-center gap-2">
                <button onclick="window.openReviewsModal('${base.id}')" class="text-yellow-400 hover:text-yellow-300 font-semibold text-xs transition">
                  <i class="fa-solid fa-star"></i> Reviews (${(base.reviews || []).length})
                </button>
                <button onclick="window.handleBookmarkBase('${base.id}')" class="${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} text-sm transition" title="Save Base">
                  <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
                </button>
              </div>
            </div>
            <h3 class="font-bold text-sm text-white line-clamp-2 mb-3 leading-snug">${base.title}</h3>
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-3 bg-czDark/80 p-2 rounded-xl border border-slate-800">
              <button onclick="window.handleLikeBase('${base.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-rose-400'} transition">
                <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart text-sm"></i>
                <span id="likeCount-${base.id}">${base.likesCount || 0}</span>
              </button>
              
              <div class="flex items-center gap-1.5 text-slate-400">
                <i class="fa-solid fa-download text-emerald-400"></i>
                <span id="dlCount-${base.id}">${base.downloadsCount || 0}</span>
              </div>

              <button onclick="window.shareOnWhatsApp('${base.title}', '${base.link}')" class="text-emerald-400 hover:text-emerald-300 transition" title="Share on WhatsApp">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </button>
            </div>

            <button onclick="window.copyBaseLink('${base.id}', '${base.link}')" class="w-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500 hover:to-yellow-500 hover:text-black text-amber-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-amber-500/30 hover:border-transparent transition shadow-md">
              <i class="fa-solid fa-copy"></i>
              <span>Copy In-Game Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 10. LIKES, DOWNLOADS & WHATSAPP
// ==========================================
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
  } catch (e) {
    console.warn("Like update fallback:", e);
  }
};

window.copyBaseLink = async function(baseId, link) {
  if (!link) return;

  try {
    await updateDoc(doc(db, "bases", baseId), { downloadsCount: increment(1) });
    const dlSpan = document.getElementById(`dlCount-${baseId}`);
    if (dlSpan) dlSpan.innerText = `${parseInt(dlSpan.innerText) + 1}`;
  } catch (e) {
    console.warn("Counter update error:", e);
  }

  navigator.clipboard.writeText(link).then(() => {
    window.showToast("🎉 Base link copied! Opening Clash of Clans...");
    setTimeout(() => {
      window.open(link, "_blank");
    }, 600);
  }).catch(() => {
    window.open(link, "_blank");
  });
};

window.shareOnWhatsApp = function(title, link) {
  const text = encodeURIComponent(`🔥 Check out this verified Clash of Clans layout on ClashZone:\n\n*${title}*\n\nDirect In-Game Link: ${link}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
};

// ==========================================
// 11. IMAGE LIGHTBOX
// ==========================================
window.openLightbox = function(imageSrc) {
  const lb = document.getElementById("imageLightbox");
  const lbImg = document.getElementById("lightboxImage");
  if (lb && lbImg) {
    lbImg.src = imageSrc;
    lb.classList.remove("hidden");
    lb.classList.add("flex");
  }
};

window.closeLightbox = function() {
  const lb = document.getElementById("imageLightbox");
  if (lb) {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
  }
};

// ==========================================
// 12. IMAGE COMPRESSION & BASE UPLOAD
// ==========================================
function compressImage(file, maxWidth = 900, quality = 0.7) {
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
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

window.handleBaseUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to upload layouts!", "error");
    window.openModal('authModal');
    return;
  }

  const rawLink = document.getElementById("uploadLink").value.trim();
  if (!rawLink.includes("link.clashofclans.com")) {
    window.showToast("Only official 'link.clashofclans.com' links allowed!", "error");
    return;
  }

  const fileInput = document.getElementById("uploadImageFile");
  const file = fileInput?.files[0];
  if (!file) {
    window.showToast("Base screenshot is required!", "error");
    return;
  }

  const proofInput = document.getElementById("uploadProofFile");
  const proofFile = proofInput?.files[0];

  const submitBtn = document.getElementById("submitBaseBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

  try {
    const base64Image = await compressImage(file);
    let base64Proof = null;
    if (proofFile) {
      base64Proof = await compressImage(proofFile, 800, 0.6);
    }

    const baseData = {
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      link: rawLink,
      image: base64Image,
      defenseProof: base64Proof,
      uploaderUid: user.uid,
      uploaderName: currentUserProfile?.name || user.displayName || user.email.split('@')[0],
      likesCount: 0,
      downloadsCount: 0,
      reviews: [],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "bases"), baseData);

    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base Layout`;
    window.closeModal('uploadModal');
    e.target.reset();
    await loadBasesFromFirestore();
    window.showToast("✅ Base layout successfully published!");
  } catch (error) {
    console.error("Upload error:", error);
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base Layout`;
    window.showToast("Error: " + error.message, "error");
  }
};

// ==========================================
// 13. AUTH HANDLERS & PROFILE SAVING
// ==========================================
window.openEditProfileModal = function() {
  const user = auth.currentUser;
  if (!user) {
    window.openModal('authModal');
    return;
  }

  document.getElementById("editName").value = currentUserProfile?.name || user.displayName || "";
  document.getElementById("editTH").value = currentUserProfile?.townHallLevel || "TH 16";
  document.getElementById("editTag").value = currentUserProfile?.tag || "";
  document.getElementById("editClan").value = currentUserProfile?.clanName || "";
  document.getElementById("editTrophies").value = currentUserProfile?.trophies || 5000;

  window.switchProfileSubTab('details');
  window.openModal('editProfileModal');
};

function renderMyBasesList() {
  const container = document.getElementById("myBasesContainer");
  const user = auth.currentUser;
  if (!container || !user) return;

  const myBases = allFetchedBases.filter(b => b.uploaderUid === user.uid);
  if (myBases.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic">You haven't uploaded any layouts yet.</p>`;
    return;
  }

  container.innerHTML = myBases.map(b => `
    <div class="flex items-center justify-between bg-czDark p-2 rounded-xl border border-slate-800 text-xs">
      <div class="flex items-center gap-2 min-w-0">
        <span class="bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">${b.th}</span>
        <span class="text-white truncate font-medium max-w-[170px]">${b.title}</span>
      </div>
      <button onclick="window.handleDeleteBase('${b.id}')" class="text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg shrink-0" title="Delete Base">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

window.handleDeleteBase = async function(baseId) {
  if (!confirm("Are you sure you want to delete this base layout?")) return;

  try {
    await deleteDoc(doc(db, "bases", baseId));
    window.showToast("Base deleted successfully!");
    await loadBasesFromFirestore();
    renderMyBasesList();
  } catch (err) {
    console.error("Delete error:", err);
    window.showToast("Delete Error: " + err.message, "error");
  }
};

window.handleSaveProfile = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const saveBtn = document.getElementById("btnSaveProfile");
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  let tag = document.getElementById("editTag").value.trim().toUpperCase();
  if (tag && !tag.startsWith("#")) tag = "#" + tag;

  const profileData = {
    name: document.getElementById("editName").value.trim(),
    townHallLevel: document.getElementById("editTH").value,
    tag: tag || "#CLASH",
    clanName: document.getElementById("editClan").value.trim() || "Solo",
    trophies: parseInt(document.getElementById("editTrophies").value) || 0,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
    await updateProfile(user, { displayName: profileData.name });

    currentUserProfile = profileData;
    window.closeModal('editProfileModal');
    window.showToast("Profile updated successfully!");
    setTimeout(() => location.reload(), 1000);
  } catch (err) {
    console.error("Save profile error:", err);
    window.showToast("Error: " + err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `Save Changes`;
  }
};

window.handleEmailSignup = async function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass = document.getElementById("signupPass").value.trim();
  const th = document.getElementById("signupTH").value;
  let tag = document.getElementById("signupTag").value.trim().toUpperCase();
  if (tag && !tag.startsWith("#")) tag = "#" + tag;

  if (pass.length < 6) {
    window.showToast("Password must be at least 6 characters!", "error");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: name,
      townHallLevel: th,
      tag: tag || "#CLASH",
      clanName: "Solo",
      trophies: 5000,
      createdAt: serverTimestamp()
    });

    window.closeModal('authModal');
    window.showToast(`🎉 Welcome Chief ${name}!`);
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === 'auth/email-already-in-use') {
      window.showToast("Email already registered! Please login.", "error");
      window.switchAuthTab('login');
    } else {
      window.showToast("Signup Error: " + error.message, "error");
    }
  }
};

window.handleEmailLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.closeModal('authModal');
    window.showToast("✅ Login successful!");
    setTimeout(() => location.reload(), 800);
  } catch (error) {
    console.error("Login error:", error);
    window.showToast("Login Error: " + error.message, "error");
  }
};

window.handleLogout = function() {
  signOut(auth).then(() => {
    window.showToast("Logged out successfully!");
    setTimeout(() => location.reload(), 800);
  });
};

// ==========================================
// 14. FILTERS & MODAL HELPERS
// ==========================================
window.setTHFilter = function(th) {
  currentTH = th;
  document.querySelectorAll(".base-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.innerText.trim() === th || (th === 'ALL' && btn.innerText.trim() === 'ALL'));
  });
  renderBasesUI();
};

window.setTypeFilter = function(type) {
  currentType = type;
  renderBasesUI();
};

window.filterBases = function() {
  renderBasesUI();
};

window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
};

window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }
};

window.switchAuthTab = function(type) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabSignupBtn = document.getElementById("tabSignupBtn");

  if (!loginForm || !signupForm) return;

  if (type === 'login') {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    tabLoginBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black";
    tabSignupBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold text-slate-400";
  } else {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    tabSignupBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black";
    tabLoginBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-400";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadBasesFromFirestore();
  loadClansFromFirestore();
});