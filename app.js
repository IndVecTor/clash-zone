import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  increment,
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

let currentZone = "home";
let currentTH = "ALL";
let currentType = "ALL";
let currentSort = "latest";
let allFetchedBases = [];
let allFetchedClans = [];
let chatUnsubscribe = null;
let usersProfileCache = {}; 
let currentUserProfile = null;
let displayLimit = 12;
let swipeIndex = 0;

let userLikedBases = JSON.parse(localStorage.getItem("cz_liked_bases") || "[]");
let userBookmarkedBases = JSON.parse(localStorage.getItem("cz_bookmarked_bases") || "[]");
let userRatedBases = JSON.parse(localStorage.getItem("cz_rated_bases") || "{}");
let userFollowedCreators = JSON.parse(localStorage.getItem("cz_followed_creators") || "[]");
let userEmojiReactions = JSON.parse(localStorage.getItem("cz_emoji_reactions") || "{}");
let userPollVotes = JSON.parse(localStorage.getItem("cz_poll_votes") || "{}");
let viewedBases = JSON.parse(sessionStorage.getItem("cz_viewed_bases") || "[]");

const ZONE_LEVELS = {
  home: ["ALL", "TH 18", "TH 17", "TH 16", "TH 15", "TH 14", "TH 13", "TH 12", "TH 11", "TH 10", "TH 9", "TH 8", "TH 7", "TH 6", "TH 5", "TH 4"],
  builder: ["ALL", "BH 10", "BH 9", "BH 8", "BH 7", "BH 6", "BH 5", "BH 4"],
  capital: ["ALL", "Capital Peak", "Dragon Cliffs", "Balloon Lagoon", "Skeleton Park", "Golem Quarry", "Wizard Valley", "Barbarian Camp"]
};

function renderAllIcons() {
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

window.showToast = function(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const isSuccess = type === "success";
  toast.className = `glass-panel pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border ${isSuccess ? "border-amber-400 shadow-md" : "border-rose-500 shadow-md"} transition-all duration-300 transform translate-x-8 opacity-0 text-xs font-bold`;
  toast.innerHTML = `<i data-lucide="${isSuccess ? "check-circle" : "alert-triangle"}" class="w-4 h-4 ${isSuccess ? "text-amber-500" : "text-rose-500"}"></i><span>${message}</span>`;
  container.appendChild(toast);
  renderAllIcons();
  setTimeout(() => toast.classList.remove("translate-x-8", "opacity-0"), 10);
  setTimeout(() => { 
    toast.classList.add("translate-x-8", "opacity-0"); 
    setTimeout(() => toast.remove(), 300); 
  }, 3000);
};

function compressAndWatermarkImage(file, creatorName = "Chief", borderTheme = "gold", watermarkStyle = "classic", maxWidth = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { 
          height = Math.round((height * maxWidth) / width); 
          width = maxWidth; 
        }
        elem.width = width; 
        elem.height = height;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let borderColor = "#f59e0b";
        if (borderTheme === "purple") borderColor = "#a855f7";
        else if (borderTheme === "blue") borderColor = "#3b82f6";
        else if (borderTheme === "fire") borderColor = "#ef4444";

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, width, height);
        
        const padding = 16, badgeHeight = 32, badgeWidth = Math.min(width * 0.55, 240);
        const x = width - badgeWidth - padding, y = height - badgeHeight - padding;
        
        ctx.save();
        ctx.fillStyle = "rgba(3, 5, 11, 0.88)";
        ctx.fillRect(x, y, badgeWidth, badgeHeight);
        ctx.strokeStyle = borderColor; 
        ctx.lineWidth = 1.5; 
        ctx.strokeRect(x, y, badgeWidth, badgeHeight);
        ctx.font = "bold 11px Rajdhani, sans-serif"; 
        ctx.fillStyle = borderColor; 
        ctx.fillText(watermarkStyle === 'pro' ? "⭐ ESPORT PRO" : "CLASHZONE", x + 8, y + 20);
        ctx.fillStyle = "#ffffff"; 
        ctx.fillText(`| ${creatorName.substring(0, 10)}`, x + 95, y + 20);
        ctx.restore();
        
        resolve(elem.toDataURL("image/jpeg", quality));
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}

function calculateMetaDefenseScore(base) {
  let score = 75;
  const type = (base.type || "").toLowerCase();
  const copies = base.copyCount || 0;
  const likes = base.likesCount || 0;
  if (type.includes("war") || type.includes("anti")) score += 12;
  if (copies > 20) score += 8;
  if (likes > 10) score += 5;
  return Math.min(score, 99);
}

window.handleGoogleLogin = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || "Chief",
        townHallLevel: "TH 16",
        tag: "#CLASH",
        clanName: "Solo",
        trophies: 5000,
        bio: "ClashZone Chief",
        avatarUrl: user.photoURL || "",
        pushAlerts: true,
        createdAt: serverTimestamp()
      });
    }
    window.closeModal("authModal");
    window.showToast("Google Login successful!");
    setTimeout(() => location.reload(), 600);
  } catch (error) {
    window.showToast(error.message || "Google Login Failed", "error");
  }
};

window.handleEmailLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          name: email.split("@")[0],
          townHallLevel: "TH 16",
          tag: "#CLASH",
          clanName: "Solo",
          trophies: 5000,
          bio: "ClashZone Chief",
          pushAlerts: true,
          createdAt: serverTimestamp()
        });
      } else {
        throw err;
      }
    }
    window.closeModal("authModal");
    window.showToast("Login successful!");
    setTimeout(() => location.reload(), 600);
  } catch (error) { 
    window.showToast(error.message || "Authentication Failed", "error"); 
  }
};

window.handleLogout = function() {
  signOut(auth).then(() => { 
    window.showToast("Logged out!"); 
    setTimeout(() => location.reload(), 500); 
  });
};

onAuthStateChanged(auth, async (user) => {
  const profileLoggedOut = document.getElementById("profileLoggedOutView");
  const profileLoggedIn = document.getElementById("profileLoggedInView");
  if (user) {
    const defaultName = user.displayName || (user.email ? user.email.split("@")[0] : "Chief");
    if (profileLoggedOut) profileLoggedOut.classList.add("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.remove("hidden");
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      currentUserProfile = userDoc.exists() ? userDoc.data() : { 
        name: defaultName, 
        townHallLevel: "TH 16", 
        tag: "#CLASH", 
        clanName: "Solo", 
        trophies: 5000, 
        bio: "ClashZone Chief",
        avatarUrl: user.photoURL || "",
        pushAlerts: true
      };
      usersProfileCache[user.uid] = currentUserProfile;

      if (document.getElementById("profileIGN")) document.getElementById("profileIGN").innerText = currentUserProfile.name || defaultName;
      if (document.getElementById("profileTHBadge")) document.getElementById("profileTHBadge").innerText = currentUserProfile.townHallLevel || "TH 16";
      if (document.getElementById("profileTagClan")) document.getElementById("profileTagClan").innerText = `Clan: ${currentUserProfile.clanName || "Solo"} | ${currentUserProfile.tag || "#CLASH"}`;
      if (document.getElementById("profileBioText")) document.getElementById("profileBioText").innerText = currentUserProfile.bio || "No bio added.";
      
      const avatarContainer = document.getElementById("profileAvatarContainer");
      if (avatarContainer) {
        if (currentUserProfile.avatarUrl) {
          avatarContainer.innerHTML = `<img src="${currentUserProfile.avatarUrl}" class="w-full h-full object-cover" />`;
        } else {
          avatarContainer.innerHTML = `<span>${(currentUserProfile.name || defaultName).charAt(0).toUpperCase()}</span>`;
        }
      }
      updateUserDashboardStats(user.uid);
    } catch (e) {}
  } else {
    currentUserProfile = null;
    if (profileLoggedOut) profileLoggedOut.classList.remove("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.add("hidden");
  }
  renderAllIcons();
});

window.toggleFollowCreator = function(creatorUid, creatorName) {
  if (userFollowedCreators.includes(creatorUid)) {
    userFollowedCreators = userFollowedCreators.filter(id => id !== creatorUid);
    window.showToast(`Unfollowed ${creatorName}`);
  } else {
    userFollowedCreators.push(creatorUid);
    window.showToast(`Now following ${creatorName}!`);
  }
  localStorage.setItem("cz_followed_creators", JSON.stringify(userFollowedCreators));
  if (auth.currentUser) updateUserDashboardStats(auth.currentUser.uid);
  renderBasesUI();
};

function updateUserDashboardStats(uid) {
  const userPosts = allFetchedBases.filter(b => b.uploaderUid === uid);
  const totalCopies = userPosts.reduce((acc, b) => acc + (b.copyCount || 0), 0);
  const totalLikes = userPosts.reduce((acc, b) => acc + (b.likesCount || 0), 0);
  const postsCount = userPosts.length;

  if (document.getElementById("profileFollowingCount")) document.getElementById("profileFollowingCount").innerText = userFollowedCreators.length;
  if (document.getElementById("profileFollowersCount")) document.getElementById("profileFollowersCount").innerText = userPosts.length * 12;
  if (document.getElementById("statPostsCount")) document.getElementById("statPostsCount").innerText = postsCount;
  if (document.getElementById("tabPostNum")) document.getElementById("tabPostNum").innerText = postsCount;
  if (document.getElementById("statCopiesCount")) document.getElementById("statCopiesCount").innerText = totalCopies;
  if (document.getElementById("statLikesCount")) document.getElementById("statLikesCount").innerText = totalLikes;
}

window.switchZone = function(zone) {
  currentZone = zone; 
  currentTH = "ALL";
  displayLimit = 12;
  ['home', 'builder', 'capital'].forEach(z => {
    const tab = document.getElementById('zoneTab' + z.charAt(0).toUpperCase() + z.slice(1));
    if (tab) {
      const active = z === zone;
      tab.className = active 
        ? "px-3.5 py-2 rounded-lg text-xs font-bold transition bg-amber-500 text-black shrink-0"
        : "px-3.5 py-2 rounded-lg text-xs font-bold transition text-slate-600 dark:text-slate-300 hover:text-amber-500 shrink-0";
    }
  });
  renderLevelFilters(); 
  renderBasesUI();
};

window.setTypeFilter = function(type) {
  currentType = type;
  displayLimit = 12;
  renderBasesUI();
};

function renderLevelFilters() {
  const container = document.getElementById("levelFilterContainer");
  if (!container) return;
  const levels = ZONE_LEVELS[currentZone] || ZONE_LEVELS.home;
  container.innerHTML = levels.map(lvl => {
    const active = lvl === currentTH;
    return `
      <button onclick="window.setTHFilter('${lvl}')" class="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
        active ? 'bg-amber-500 text-black border border-amber-500' : 'bg-slate-100 dark:bg-czPanel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
      }">${lvl}</button>
    `;
  }).join("");
}

window.setTHFilter = function(th) { 
  currentTH = th; 
  displayLimit = 12;
  renderLevelFilters(); 
  renderBasesUI(); 
};

window.setSortOption = function(sortType) { 
  currentSort = sortType;
  displayLimit = 12;
  renderBasesUI(); 
};

window.filterBases = function() { 
  displayLimit = 12;
  renderBasesUI(); 
};

window.loadMoreBases = function() {
  displayLimit += 12;
  renderBasesUI();
};

function getFilteredBases() {
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  let filtered = allFetchedBases.filter(base => {
    const matchZone = (base.zone || "home") === currentZone;
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || (base.type && base.type.toLowerCase().includes(currentType.toLowerCase()));
    const tagsString = (base.tags || []).join(" ").toLowerCase();
    const creatorName = (usersProfileCache[base.uploaderUid]?.name || base.uploaderName || "").toLowerCase();
    const matchSearch = (base.title || "").toLowerCase().includes(search) || (base.th || "").toLowerCase().includes(search) || creatorName.includes(search) || tagsString.includes(search);
    return matchZone && matchTH && matchType && matchSearch;
  });
  return filtered;
}

function renderBasesUI() {
  const container = document.getElementById("basesContainer");
  const loadMoreBtnContainer = document.getElementById("loadMoreContainer");
  if (!container) return;

  const filtered = getFilteredBases();
  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">No base layouts found matching filters.</div>`;
    if (loadMoreBtnContainer) loadMoreBtnContainer.classList.add("hidden");
    renderAllIcons();
    return;
  }

  const paginatedList = filtered.slice(0, displayLimit);
  container.innerHTML = paginatedList.map(base => generateBaseCardHTML(base)).join("");

  if (loadMoreBtnContainer) {
    if (filtered.length > displayLimit) loadMoreBtnContainer.classList.remove("hidden");
    else loadMoreBtnContainer.classList.add("hidden");
  }
  renderAllIcons();
}

function generateBaseCardHTML(base) {
  const isLiked = userLikedBases.includes(base.id);
  const isBookmarked = userBookmarkedBases.includes(base.id);
  const copies = base.copyCount || 0;
  const views = base.viewsCount || 0;
  const likes = base.likesCount || 0;
  const commentsCount = (base.comments || []).length;
  const timeAgo = formatTimeAgo(base.createdAt);
  
  const uploaderProfile = usersProfileCache[base.uploaderUid] || {};
  const creatorName = uploaderProfile.name || base.uploaderName || "Chief";
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const creatorAvatar = uploaderProfile.avatarUrl || "";

  return `
    <div class="glass-panel card-pro rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-amber-500/20 shadow-md">
      <div class="p-3 bg-slate-50/60 dark:bg-black/30 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
        <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-amber-400 transition" onclick="window.openBaseDetailsModal('${base.id}')">${base.title}</h3>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1px] shrink-0 overflow-hidden">
              <div class="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-[9px] font-bold text-amber-400 overflow-hidden">
                ${creatorAvatar ? `<img src="${creatorAvatar}" class="w-full h-full object-cover" />` : `<span>${creatorInitial}</span>`}
              </div>
            </div>
            <div class="min-w-0">
              <h5 class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">${creatorName}</h5>
              <p class="text-[8px] text-amber-500 font-extrabold uppercase">${timeAgo}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer group" style="min-height: 180px; max-height: 240px;" onclick="window.openBaseDetailsModal('${base.id}')">
        <img src="${base.image}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy" />
        <div class="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded shadow">${base.th}</div>
        <button onclick="event.stopPropagation(); window.toggleBookmark('${base.id}')" class="absolute bottom-2 right-2 w-7 h-7 rounded-xl bg-black/70 hover:bg-black/90 flex items-center justify-center text-white transition shadow border border-white/10">
          <i data-lucide="bookmark" class="w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}"></i>
        </button>
      </div>

      <div class="p-3 flex flex-col gap-2.5">
        <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow">
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Copy Layout
        </button>
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-800/60">
          <span class="flex items-center gap-0.5"><i data-lucide="download" class="w-3 h-3 text-amber-400"></i> ${copies}</span>
          <button onclick="window.handleLikeBase('${base.id}')" class="flex items-center gap-1 text-rose-500">
            <i data-lucide="heart" class="w-3 h-3 ${isLiked ? "fill-rose-500" : ""}"></i> ${likes}
          </button>
        </div>
      </div>
    </div>
  `;
}

// 💬 CHIEF LIVE GLOBAL CHAIN / CLAN LOUNGE (REAL-TIME LISTENER)
window.openGlobalChatModal = function() {
  window.openModal('globalChatModal');
  startRealtimeChatListener();
};

function startRealtimeChatListener() {
  const container = document.getElementById("globalChatMessagesList");
  if (!container) return;

  if (chatUnsubscribe) chatUnsubscribe(); // Unsubscribe previous listener if any

  const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"));
  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(docSnap => messages.push({ id: docSnap.id, ...docSnap.data() }));

    if (messages.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 text-center py-10">No messages in the lounge yet. Be the first to say hello!</p>`;
      return;
    }

    container.innerHTML = messages.map(m => `
      <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1 text-xs shadow">
        <div class="flex items-center justify-between">
          <span class="font-bold text-amber-400">${m.authorName || 'Chief'}</span>
          <span class="text-[9px] text-slate-400">${formatTimeAgo(m.createdAt)}</span>
        </div>
        <p class="text-slate-200 leading-relaxed">${m.text}</p>
      </div>
    `).join("");
    container.scrollTop = container.scrollHeight;
  }, (error) => {
    container.innerHTML = `<p class="text-xs text-rose-400 text-center py-10">Chat error: Check Firebase Firestore Rules.</p>`;
  });
}

window.handleSendGlobalChatMessage = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to chat!", "error");
    window.openModal("authModal");
    return;
  }

  const input = document.getElementById("globalChatInput");
  const text = input?.value.trim();
  if (!text) return;

  const authorName = currentUserProfile?.name || user.displayName || "Chief";
  try {
    await addDoc(collection(db, "global_chat"), {
      uid: user.uid,
      authorName: authorName,
      text: text,
      createdAt: serverTimestamp()
    });
    input.value = "";
  } catch (err) {
    window.showToast("Failed to send message (Check Firestore rules)", "error");
  }
};

window.openSwipeModeModal = function() {
  swipeIndex = 0;
  window.openModal('swipeModeModal');
  renderCurrentSwipeCard();
};

function renderCurrentSwipeCard() {
  const container = document.getElementById("swipeCardContainer");
  if (!container) return;
  const filtered = getFilteredBases();
  if (filtered.length === 0 || swipeIndex >= filtered.length) {
    container.innerHTML = `<div class="glass-panel rounded-2xl p-8 text-center space-y-3"><span class="text-3xl">🎉</span><h4 class="text-sm font-bold text-white">All Bases Swiped!</h4><button onclick="window.closeModal('swipeModeModal')" class="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">Close</button></div>`;
    return;
  }
  container.innerHTML = generateBaseCardHTML(filtered[swipeIndex]);
}

window.swipeBaseAction = function(action) {
  const filtered = getFilteredBases();
  const base = filtered[swipeIndex];
  if (base) {
    if (action === 'save') window.toggleBookmark(base.id);
    else if (action === 'like') window.handleLikeBase(base.id);
  }
  swipeIndex++;
  renderCurrentSwipeCard();
};

window.copyAndLaunchBase = async function(baseId, link) {
  if (!link) return;
  try {
    updateDoc(doc(db, "bases", baseId), { copyCount: increment(1) });
  } catch (e) {}
  if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
  window.showToast("Opening Clash of Clans with Layout...");
  setTimeout(() => { window.location.href = link; }, 400);
};

window.toggleBookmark = function(baseId) {
  if (userBookmarkedBases.includes(baseId)) {
    userBookmarkedBases = userBookmarkedBases.filter(id => id !== baseId);
    window.showToast("Removed from Vault");
  } else {
    userBookmarkedBases.push(baseId);
    window.showToast("Saved to Vault!");
  }
  localStorage.setItem("cz_bookmarked_bases", JSON.stringify(userBookmarkedBases));
  renderBasesUI();
};

window.handleLikeBase = async function(baseId) {
  if (!userLikedBases.includes(baseId)) {
    userLikedBases.push(baseId);
    try { updateDoc(doc(db, "bases", baseId), { likesCount: increment(1) }); } catch(e){}
  } else {
    userLikedBases = userLikedBases.filter(id => id !== baseId);
    try { updateDoc(doc(db, "bases", baseId), { likesCount: increment(-1) }); } catch(e){}
  }
  localStorage.setItem("cz_liked_bases", JSON.stringify(userLikedBases));
  renderBasesUI();
};

window.openBaseDetailsModal = async function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;

  let modal = document.getElementById("baseDetailsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "baseDetailsModal";
    modal.className = "fixed inset-0 bg-black/85 backdrop-blur-sm hidden justify-center items-center p-4 z-50 overflow-y-auto";
    document.body.appendChild(modal);
  }

  const defenseScore = calculateMetaDefenseScore(base);
  modal.innerHTML = `
    <div class="glass-panel rounded-2xl w-full max-w-lg p-5 relative shadow-2xl my-auto space-y-4 max-h-[90vh] overflow-y-auto scrollbar-none">
      <button onclick="window.closeModal('baseDetailsModal')" class="absolute top-4 right-4 text-slate-400 font-bold">✕</button>
      <h3 class="text-base font-bold dark:text-white">${base.title}</h3>
      <div class="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center"><img src="${base.image}" class="w-full h-full object-contain" /></div>
      <div class="bg-amber-500/10 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between">
        <span class="text-xs text-amber-400 font-bold">🛡️ Meta Defense Score</span>
        <span class="font-black text-amber-400 text-base">${defenseScore}/100</span>
      </div>
      <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="w-full bg-amber-500 text-black py-2.5 rounded-xl font-bold text-xs uppercase">Copy In-Game Layout</button>
    </div>
  `;
  modal.classList.remove("hidden"); modal.classList.add("flex");
  renderAllIcons();
};

window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove("hidden"); el.classList.add("flex"); }
  renderAllIcons();
};

window.closeModal = function(id) { 
  const el = document.getElementById(id);
  if (el) { el.classList.add("hidden"); el.classList.remove("flex"); }
};

window.handleBaseUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { window.showToast("Please login first!", "error"); window.openModal("authModal"); return; }
  const rawLink = document.getElementById("uploadLink").value.trim();
  const file = document.getElementById("uploadImageFile")?.files[0];
  const borderTheme = document.getElementById("uploadBorderTheme").value;
  const watermarkStyle = document.getElementById("uploadWatermarkStyle").value;

  if (!file) { window.showToast("Base screenshot required!", "error"); return; }

  try {
    const creatorIGN = currentUserProfile?.name || user.displayName || "Chief";
    const base64Image = await compressAndWatermarkImage(file, creatorIGN, borderTheme, watermarkStyle);
    await addDoc(collection(db, "bases"), {
      zone: document.getElementById("uploadZone").value,
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      link: rawLink,
      image: base64Image,
      uploaderUid: user.uid,
      uploaderName: creatorIGN,
      likesCount: 0,
      copyCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp()
    });
    window.closeModal("uploadModal");
    e.target.reset();
    loadBasesFromFirestore();
    window.showToast("Base published successfully!");
  } catch (error) { window.showToast("Upload Error", "error"); }
};

async function loadBasesFromFirestore() {
  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allFetchedBases = [];
    querySnapshot.forEach(docSnap => allFetchedBases.push({ id: docSnap.id, ...docSnap.data() }));
    renderBasesUI();
  } catch (error) { renderBasesUI(); }
}

window.switchMainHubView = function(viewName) {
  ["Feed", "Vault", "Clans", "Profile"].forEach(tab => {
    document.getElementById(`bnav${tab}`)?.classList.remove("active");
  });
  document.getElementById(`bnav${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`)?.classList.add("active");
  
  ["viewFeedSection", "viewVaultSection", "viewClansSection", "viewProfileSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  
  if (viewName === "feed") document.getElementById("viewFeedSection")?.classList.remove("hidden");
  else if (viewName === "vault") { document.getElementById("viewVaultSection")?.classList.remove("hidden"); renderUserSavedVault(); }
  else if (viewName === "clans") { document.getElementById("viewClansSection")?.classList.remove("hidden"); }
  else if (viewName === "profile") { document.getElementById("viewProfileSection")?.classList.remove("hidden"); }
  renderAllIcons();
};

window.updateUploadLevelOptions = function() {
  const zoneSelect = document.getElementById("uploadZone");
  const thSelect = document.getElementById("uploadTH");
  if (!zoneSelect || !thSelect) return;
  const levels = ZONE_LEVELS[zoneSelect.value].filter(l => l !== "ALL");
  thSelect.innerHTML = levels.map(l => `<option value="${l}">${l}</option>`).join("");
};

document.addEventListener("DOMContentLoaded", () => {
  renderLevelFilters();
  window.updateUploadLevelOptions();
  loadBasesFromFirestore();
  renderAllIcons();
});