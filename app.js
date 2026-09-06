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
let globalChatMessages = [];
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
  if (!timestamp) return "Recently";
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

window.togglePushAlerts = async function(el) {
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login first!", "error");
    el.checked = false;
    return;
  }
  const status = el.checked;
  try {
    await updateDoc(doc(db, "users", user.uid), { pushAlerts: status });
    window.showToast(status ? "Push alerts enabled!" : "Push alerts disabled!");
  } catch (e) {}
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
      if (document.getElementById("pushNotificationToggle")) document.getElementById("pushNotificationToggle").checked = currentUserProfile.pushAlerts !== false;
      
      if (document.getElementById("editName")) document.getElementById("editName").value = currentUserProfile.name || defaultName;
      if (document.getElementById("editTH")) document.getElementById("editTH").value = currentUserProfile.townHallLevel || "TH 16";
      if (document.getElementById("editPlayerTag")) document.getElementById("editPlayerTag").value = currentUserProfile.tag || "";
      if (document.getElementById("editClan")) document.getElementById("editClan").value = currentUserProfile.clanName || "";
      if (document.getElementById("editDiscord")) document.getElementById("editDiscord").value = currentUserProfile.discord || "";
      if (document.getElementById("editBio")) document.getElementById("editBio").value = currentUserProfile.bio || "";

      const avatarContainer = document.getElementById("profileAvatarContainer");
      if (avatarContainer) {
        if (currentUserProfile.avatarUrl) {
          avatarContainer.innerHTML = `<img src="${currentUserProfile.avatarUrl}" class="w-full h-full object-cover" />`;
        } else {
          avatarContainer.innerHTML = `<span>${(currentUserProfile.name || defaultName).charAt(0).toUpperCase()}</span>`;
        }
      }

      renderProfileSocialLinks(currentUserProfile);
      updateUserDashboardStats(user.uid);
    } catch (e) {}
  } else {
    currentUserProfile = null;
    if (profileLoggedOut) profileLoggedOut.classList.remove("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.add("hidden");
  }
  renderAllIcons();
});

window.selectPresetAvatar = function(url) {
  document.getElementById("editPresetAvatarUrl").value = url;
  window.showToast("Preset avatar selected!");
};

function renderProfileSocialLinks(profile) {
  const container = document.getElementById("profileSocialLinksContainer");
  if (!container) return;
  let html = "";
  if (profile.discord) html += `<span class="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">Discord: ${profile.discord}</span>`;
  container.innerHTML = html;
}

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
  
  const followBtn = document.getElementById("modalFollowBtn");
  if (followBtn) {
    const isFollowing = userFollowedCreators.includes(creatorUid);
    followBtn.className = isFollowing ? "bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs uppercase" : "bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase";
    followBtn.innerText = isFollowing ? "Following ✓" : "Follow Creator";
  }
  renderBasesUI();
};

function calculateCreatorOfTheMonth() {
  const bannerEl = document.getElementById("creatorOfTheMonthBanner");
  const nameEl = document.getElementById("comWinnerName");
  const avatarEl = document.getElementById("comWinnerAvatar");
  const statsEl = document.getElementById("comWinnerStats");
  if (!bannerEl || !nameEl || allFetchedBases.length === 0) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const creatorScores = {};
  allFetchedBases.forEach(b => {
    if (!b.createdAt) return;
    const postDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    if (postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear) {
      const uUid = b.uploaderUid;
      if (!uUid) return;
      if (!creatorScores[uUid]) creatorScores[uUid] = { copies: 0, likes: 0, posts: 0 };
      creatorScores[uUid].copies += (b.copyCount || 0);
      creatorScores[uUid].likes += (b.likesCount || 0);
      creatorScores[uUid].posts += 1;
    }
  });

  let topUid = null;
  let maxScore = -1;
  Object.keys(creatorScores).forEach(uid => {
    const score = (creatorScores[uid].copies * 2) + (creatorScores[uid].likes * 3);
    if (score > maxScore) {
      maxScore = score;
      topUid = uid;
    }
  });

  if (topUid && maxScore > 0) {
    const uProfile = usersProfileCache[topUid] || {};
    const topName = uProfile.name || "Legendary Chief";
    const topAvatar = uProfile.avatarUrl || "";

    nameEl.innerText = topName;
    statsEl.innerText = `${creatorScores[topUid].copies} Copies • ${creatorScores[topUid].posts} Posts`;

    if (avatarEl) {
      if (topAvatar) {
        avatarEl.innerHTML = `<img src="${topAvatar}" class="w-full h-full object-cover" />`;
      } else {
        avatarEl.innerHTML = `<span>👑</span>`;
      }
    }
    bannerEl.classList.remove("hidden");
  } else {
    bannerEl.classList.add("hidden");
  }
}

function updateUserDashboardStats(uid) {
  const userPosts = allFetchedBases.filter(b => b.uploaderUid === uid);
  const totalCopies = userPosts.reduce((acc, b) => acc + (b.copyCount || 0), 0);
  const totalLikes = userPosts.reduce((acc, b) => acc + (b.likesCount || 0), 0);
  const postsCount = userPosts.length;

  let tierName = "Bronze Builder";
  let tierColor = "from-amber-700 to-yellow-600";
  if (postsCount >= 50) {
    tierName = "Legendary Architect 👑";
    tierColor = "from-purple-600 via-pink-500 to-amber-400";
  } else if (postsCount >= 31) {
    tierName = "Platinum Master ⭐";
    tierColor = "from-cyan-500 to-blue-600";
  } else if (postsCount >= 16) {
    tierName = "Gold General ⚡";
    tierColor = "from-yellow-400 to-amber-500";
  } else if (postsCount >= 6) {
    tierName = "Silver Tactician 🛡️";
    tierColor = "from-slate-400 to-slate-600";
  }

  const rankBadgeEl = document.getElementById("profileRankTierBadge");
  if (rankBadgeEl) {
    rankBadgeEl.innerText = tierName;
    rankBadgeEl.className = `bg-gradient-to-r ${tierColor} text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow`;
  }

  if (document.getElementById("profileFollowingCount")) document.getElementById("profileFollowingCount").innerText = userFollowedCreators.length;
  if (document.getElementById("profileFollowersCount")) document.getElementById("profileFollowersCount").innerText = userPosts.length * 12;

  if (document.getElementById("statPostsCount")) document.getElementById("statPostsCount").innerText = postsCount;
  if (document.getElementById("tabPostNum")) document.getElementById("tabPostNum").innerText = postsCount;
  if (document.getElementById("statCopiesCount")) document.getElementById("statCopiesCount").innerText = totalCopies;
  if (document.getElementById("statLikesCount")) document.getElementById("statLikesCount").innerText = totalLikes;

  if (document.getElementById("analyticsTotalPosts")) document.getElementById("analyticsTotalPosts").innerText = postsCount;
  if (document.getElementById("analyticsTotalCopies")) document.getElementById("analyticsTotalCopies").innerText = totalCopies;
  if (document.getElementById("analyticsTotalLikes")) document.getElementById("analyticsTotalLikes").innerText = totalLikes;
  
  const repScore = (totalCopies * 2) + (totalLikes * 3) + (postsCount * 10);
  if (document.getElementById("analyticsRepScore")) document.getElementById("analyticsRepScore").innerText = repScore;

  renderMilestones(postsCount, totalCopies, totalLikes);
  renderInstagramProfileGrid(userPosts);
  renderUserSavedVault();
  renderProfileSavedVaultCards();
}

function renderMilestones(postsCount, totalCopies, totalLikes) {
  const container = document.getElementById("milestonesContainer");
  if (!container) return;

  const milestones = [
    { title: "First Blood", desc: "Upload your first base layout", icon: "🎯", unlocked: postsCount >= 1 },
    { title: "Viral Tactician", desc: "Reach 50+ total copies across your posts", icon: "🔥", unlocked: totalCopies >= 50 },
    { title: "Master Architect", desc: "Publish 10 base layouts", icon: "🏛️", unlocked: postsCount >= 10 },
    { title: "Heartthrob", desc: "Receive 50 total likes", icon: "❤️", unlocked: totalLikes >= 50 },
    { title: "Legendary General", desc: "Cross 500+ total copies", icon: "👑", unlocked: totalCopies >= 500 }
  ];

  container.innerHTML = milestones.map(m => `
    <div class="flex items-center justify-between p-3 rounded-xl border ${m.unlocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-100 dark:bg-czDark border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'}">
      <div class="flex items-center gap-3">
        <span class="text-xl">${m.icon}</span>
        <div>
          <h5 class="text-xs font-bold ${m.unlocked ? 'text-amber-400 font-black' : 'dark:text-slate-300'}">${m.title}</h5>
          <p class="text-[10px] text-slate-400">${m.desc}</p>
        </div>
      </div>
      <span class="text-[10px] font-extrabold px-2 py-1 rounded-lg ${m.unlocked ? 'bg-amber-500 text-black shadow' : 'bg-slate-800 text-slate-500'}">
        ${m.unlocked ? 'UNLOCKED' : 'LOCKED'}
      </span>
    </div>
  `).join("");
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
  const chipKeys = ['ALL', 'War', 'Anti3Star', 'Trophy', 'Farming', 'Hybrid'];
  chipKeys.forEach(k => {
    const rawMatch = k === 'Anti3Star' ? 'Anti 3-Star' : k;
    const btn = document.getElementById('typeChip' + k);
    if (btn) {
      const active = rawMatch === type;
      btn.className = active
        ? "px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shrink-0 transition"
        : "px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-czPanel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0 hover:border-amber-400 transition";
    }
  });
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
        active 
          ? 'bg-amber-500 text-black border border-amber-500' 
          : 'bg-slate-100 dark:bg-czPanel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
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
  ['latest', 'copies', 'views', 'likes'].forEach(s => {
    const btn = document.getElementById('sort' + s.charAt(0).toUpperCase() + s.slice(1));
    if (btn) {
      btn.className = s === sortType
        ? "px-2.5 py-1 rounded-lg text-xs font-bold transition bg-amber-500 text-black"
        : "px-2.5 py-1 rounded-lg text-xs font-bold transition text-slate-600 dark:text-slate-300 hover:text-amber-500";
    }
  });
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

  if (currentSort === "likes") {
    filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else if (currentSort === "copies") {
    filtered.sort((a, b) => (b.copyCount || 0) - (b.copyCount || 0));
  } else if (currentSort === "views") {
    filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  }
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
    if (filtered.length > displayLimit) {
      loadMoreBtnContainer.classList.remove("hidden");
    } else {
      loadMoreBtnContainer.classList.add("hidden");
    }
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
  const isFollowing = userFollowedCreators.includes(base.uploaderUid);

  const ratingSum = base.ratingSum || 0;
  const ratingCount = base.ratingCount || 0;
  const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "0.0";

  const avatarDisplayHtml = creatorAvatar 
    ? `<img src="${creatorAvatar}" class="w-full h-full object-cover" />`
    : `<span>${creatorInitial}</span>`;

  return `
    <div class="glass-panel card-pro rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-amber-500/20 shadow-md">
      
      <!-- TITLE + UPLOADER PROFILE BOX -->
      <div class="p-3 bg-slate-50/60 dark:bg-black/30 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
        <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-amber-400 transition" onclick="window.openBaseDetailsModal('${base.id}')" title="${base.title}">
          ${base.title}
        </h3>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1px] shrink-0 overflow-hidden">
              <div class="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-[9px] font-bold text-amber-400 overflow-hidden">
                ${avatarDisplayHtml}
              </div>
            </div>
            <div class="min-w-0">
              <h5 class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">${creatorName}</h5>
              <p class="text-[8px] text-amber-500 font-extrabold uppercase">12 Followers • ${timeAgo}</p>
            </div>
          </div>

          <button onclick="window.toggleFollowCreator('${base.uploaderUid}', '${creatorName}')" class="text-[9px] font-black uppercase ${isFollowing ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-amber-500 text-black'} px-2 py-0.5 rounded transition shadow">
            ${isFollowing ? 'Following ✓' : '+ Follow'}
          </button>
        </div>
      </div>

      <!-- THUMBNAIL -->
      <div class="w-full bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer group" style="min-height: 180px; max-height: 240px;" onclick="window.openBaseDetailsModal('${base.id}')">
        <img src="${base.image}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy" />
        
        <div class="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
          <i data-lucide="shield" class="w-3 h-3 text-amber-400"></i>
          <span>${base.th}</span>
        </div>

        <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
          <span>⭐ ${avgRating}</span>
        </div>

        <button onclick="event.stopPropagation(); window.toggleBookmark('${base.id}')" class="absolute bottom-2 right-2 w-7 h-7 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md flex items-center justify-center text-white transition shadow border border-white/10" title="${isBookmarked ? 'Unsave' : 'Save'}">
          <i data-lucide="bookmark" class="w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}"></i>
        </button>
      </div>

      <!-- COPY BUTTON & ENGAGEMENT -->
      <div class="p-3 flex flex-col gap-2.5">
        <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition">
          <i data-lucide="external-link" class="w-3.5 h-3.5 stroke-[2.5]"></i>
          <span>Copy Base Layout</span>
        </button>

        <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div class="flex items-center gap-2.5">
            <span class="flex items-center gap-0.5"><i data-lucide="eye" class="w-3 h-3 text-cyan-400"></i> ${views}</span>
            <span class="flex items-center gap-0.5"><i data-lucide="download" class="w-3 h-3 text-amber-400"></i> ${copies}</span>
            <button onclick="window.openBaseDetailsModal('${base.id}')" class="flex items-center gap-0.5 hover:text-amber-400 transition">
              <i data-lucide="message-square" class="w-3 h-3 text-blue-400"></i>
              <span>${commentsCount}</span>
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="window.generateQuickShareCard('${base.id}')" class="text-slate-400 hover:text-amber-400 transition" title="Share Card">
              <i data-lucide="share-2" class="w-3 h-3"></i>
            </button>
            <button onclick="window.handleLikeBase('${base.id}')" class="flex items-center gap-1 hover:text-rose-500 transition">
              <i data-lucide="heart" class="w-3 h-3 ${isLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"}"></i>
              <span class="${isLiked ? 'text-rose-500 font-bold' : ''}">${likes}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

// Tinder Swiper Mode
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
    container.innerHTML = `
      <div class="glass-panel rounded-2xl p-8 text-center space-y-3">
        <span class="text-3xl">🎉</span>
        <h4 class="text-sm font-bold text-white">All Bases Swiped!</h4>
        <p class="text-xs text-slate-400">You have explored all matching layouts.</p>
        <button onclick="window.closeModal('swipeModeModal')" class="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">Close Swiper</button>
      </div>
    `;
    return;
  }

  const base = filtered[swipeIndex];
  container.innerHTML = generateBaseCardHTML(base);
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

// Global Chat Functions
window.openGlobalChatModal = function() {
  window.openModal('globalChatModal');
  loadGlobalChatMessages();
};

async function loadGlobalChatMessages() {
  const container = document.getElementById("globalChatMessagesList");
  if (!container) return;
  try {
    const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    globalChatMessages = [];
    snap.forEach(docSnap => globalChatMessages.push({ id: docSnap.id, ...docSnap.data() }));

    if (globalChatMessages.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 text-center py-10">No messages in the lounge yet. Be the first to say hello!</p>`;
      return;
    }

    container.innerHTML = globalChatMessages.map(m => `
      <div class="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-amber-400">${m.authorName || 'Chief'}</span>
          <span class="text-[9px] text-slate-400">${formatTimeAgo(m.createdAt)}</span>
        </div>
        <p class="text-slate-200">${m.text}</p>
      </div>
    `).join("");
    container.scrollTop = container.scrollHeight;
  } catch (e) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-10">Failed to load chat lounge.</p>`;
  }
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
    loadGlobalChatMessages();
  } catch (err) {
    window.showToast("Failed to send message", "error");
  }
};

window.generateQuickShareCard = function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;
  const siteUrl = window.location.origin + window.location.pathname + `?base=${base.id}`;
  const shareText = `🔥 ClashZone Base Card\n📌 Title: ${base.title}\n🛡️ Level: ${base.th}\n📥 Copy & View:\n${siteUrl}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
    window.showToast("Quick share card copied!");
  } else {
    window.showToast("Share link ready!");
  }
};

function renderInstagramProfileGrid(posts) {
  const container = document.getElementById("profileTabContentPosts");
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 py-12 text-center text-slate-400 space-y-2">
        <i data-lucide="image" class="w-8 h-8 mx-auto text-slate-500"></i>
        <p class="text-xs font-bold">No Layouts Uploaded Yet</p>
      </div>
    `;
    renderAllIcons();
    return;
  }

  container.innerHTML = posts.map(b => `
    <div class="relative aspect-square rounded-xl overflow-hidden group bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer" onclick="window.openBaseDetailsModal('${b.id}')">
      <img src="${b.image}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
      
      <span class="absolute top-1.5 left-1.5 bg-black/80 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
        ${b.th}
      </span>

      <div class="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
        <div class="flex justify-end"></div>

        <div class="flex items-center justify-center gap-3 text-white text-xs font-bold my-auto">
          <span class="flex items-center gap-1"><i data-lucide="download" class="w-3.5 h-3.5 text-amber-400"></i> ${b.copyCount || 0}</span>
          <span class="flex items-center gap-1"><i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500 fill-rose-500"></i> ${b.likesCount || 0}</span>
        </div>

        <button onclick="event.stopPropagation(); window.copyAndLaunchBase('${b.id}', '${b.link}')" class="w-full bg-amber-500 text-black py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
          Copy
        </button>
      </div>
    </div>
  `).join("");
  renderAllIcons();
}

window.copyAndLaunchBase = async function(baseId, link) {
  if (!link) return;
  try {
    const baseRef = doc(db, "bases", baseId);
    updateDoc(baseRef, { copyCount: increment(1) });
    const localBase = allFetchedBases.find(b => b.id === baseId);
    if (localBase) localBase.copyCount = (localBase.copyCount || 0) + 1;
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
  if (auth.currentUser) {
    renderUserSavedVault();
    renderProfileSavedVaultCards();
  }
};

window.handleLikeBase = async function(baseId) {
  const localBase = allFetchedBases.find(b => b.id === baseId);
  if (!userLikedBases.includes(baseId)) {
    userLikedBases.push(baseId);
    if (localBase) localBase.likesCount = (localBase.likesCount || 0) + 1;
    try { updateDoc(doc(db, "bases", baseId), { likesCount: increment(1) }); } catch(e){}
  } else {
    userLikedBases = userLikedBases.filter(id => id !== baseId);
    if (localBase) localBase.likesCount = Math.max(0, (localBase.likesCount || 0) - 1);
    try { updateDoc(doc(db, "bases", baseId), { likesCount: increment(-1) }); } catch(e){}
  }
  localStorage.setItem("cz_liked_bases", JSON.stringify(userLikedBases));
  renderBasesUI();
  if (auth.currentUser) {
    renderUserSavedVault();
    renderProfileSavedVaultCards();
  }
};

window.openBaseDetailsModal = async function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;

  if (!viewedBases.includes(baseId)) {
    viewedBases.push(baseId);
    sessionStorage.setItem("cz_viewed_bases", JSON.stringify(viewedBases));
    base.viewsCount = (base.viewsCount || 0) + 1;
    try { updateDoc(doc(db, "bases", baseId), { viewsCount: increment(1) }); } catch(e){}
  }

  let modal = document.getElementById("baseDetailsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "baseDetailsModal";
    modal.className = "fixed inset-0 bg-black/85 backdrop-blur-sm hidden justify-center items-center p-4 z-50 overflow-y-auto";
    document.body.appendChild(modal);
  }

  const siteUrl = window.location.origin + window.location.pathname + `?base=${base.id}`;
  const shareText = encodeURIComponent(`🔥 Check out this ${base.th} layout "${base.title}" on ClashZone!\nView & Copy Base here:\n${siteUrl}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const timeAgo = formatTimeAgo(base.createdAt);

  const uploaderProfile = usersProfileCache[base.uploaderUid] || {};
  const creatorName = uploaderProfile.name || base.uploaderName || "Chief";
  const defenseScore = calculateMetaDefenseScore(base);

  const tagsHtml = (base.tags && base.tags.length > 0) ? base.tags.map(t => `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">#${t.trim()}</span>`).join("") : "";
  const descHtml = base.description ? `<div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">${base.description}</div>` : "";

  const comments = base.comments || [];
  const commentsHtml = comments.length === 0 
    ? `<p class="text-xs text-slate-400 text-center py-4">No comments yet. Start the strategy discussion below!</p>`
    : comments.map(c => `
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-amber-400">${usersProfileCache[c.uid]?.name || c.authorName || 'Chief'}</span>
          <span class="text-[9px] text-slate-400">${formatTimeAgo(c.timestamp)}</span>
        </div>
        <p class="text-slate-200">${c.text}</p>
      </div>
    `).join("");

  const isFollowingCreator = userFollowedCreators.includes(base.uploaderUid);

  modal.innerHTML = `
    <div class="glass-panel rounded-2xl w-full max-w-lg p-5 relative shadow-2xl my-auto space-y-4 max-h-[90vh] overflow-y-auto scrollbar-none">
      <button onclick="window.closeModal('baseDetailsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-sm">✕</button>
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="bg-amber-500/20 text-amber-500 font-extrabold px-2.5 py-0.5 rounded text-xs">${base.th} • ${(base.type || 'War').toUpperCase()}</span>
          <span class="text-[10px] text-slate-400 font-semibold">${timeAgo}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">By <b class="text-amber-400">${creatorName}</b></span>
          <button id="modalFollowBtn" onclick="window.toggleFollowCreator('${base.uploaderUid}', '${creatorName}')" class="${isFollowingCreator ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-amber-500 text-black'} px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase transition shadow">
            ${isFollowingCreator ? 'Following ✓' : '+ Follow'}
          </button>
        </div>
      </div>

      <h3 class="text-base font-bold dark:text-white">${base.title}</h3>
      
      <div class="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center" style="max-height: 320px;">
        <img src="${base.image}" class="w-full h-full object-contain" />
      </div>

      <!-- Meta Defense Analyzer / AI Score -->
      <div class="bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-[10px] text-amber-400 uppercase font-extrabold block">🛡️ Meta Defense Analyzer (AI Score)</span>
          <p class="text-[11px] text-slate-300">Estimated trap density & anti-meta resilience</p>
        </div>
        <div class="text-right">
          <span class="font-black text-lg text-amber-400">${defenseScore}/100</span>
        </div>
      </div>

      ${descHtml}
      ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 pt-1">${tagsHtml}</div>` : ""}

      <div class="flex items-center gap-4 text-xs font-semibold text-slate-400 py-1 border-t border-slate-200 dark:border-slate-800">
        <span class="flex items-center gap-1"><i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i> ${base.viewsCount || 0} Views</span>
        <span class="flex items-center gap-1"><i data-lucide="download" class="w-4 h-4 text-amber-400"></i> ${base.copyCount || 0} Copies</span>
        <span class="flex items-center gap-1"><i data-lucide="heart" class="w-4 h-4 text-rose-500"></i> ${base.likesCount || 0} Likes</span>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="flex-1 bg-amber-500 text-black py-2.5 rounded-xl font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md">
          <i data-lucide="external-link" class="w-4 h-4"></i> Copy In-Game Layout
        </button>
        <a href="${whatsappUrl}" target="_blank" class="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1">
          <i data-lucide="share-2" class="w-4 h-4"></i> Share Site
        </a>
      </div>

      <!-- COMMENTS SECTION -->
      <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <h4 class="text-xs font-black uppercase text-amber-500 tracking-wider">Strategy Discussion & Comments (${comments.length})</h4>
        
        <div class="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
          ${commentsHtml}
        </div>

        <form onsubmit="window.handleAddCommentInsideModal(event, '${base.id}')" class="flex items-center gap-2 pt-2">
          <input type="text" id="modalCommentInput_${base.id}" placeholder="Write strategy tip..." required class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-400 text-white" />
          <button type="submit" class="bg-amber-500 text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase shrink-0 shadow">Post</button>
        </form>
      </div>

    </div>
  `;
  modal.classList.remove("hidden"); 
  modal.classList.add("flex");
  renderAllIcons();
};

window.handleAddCommentInsideModal = async function(e, baseId) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    window.showToast("Please login to comment!", "error");
    window.openModal("authModal");
    return;
  }

  const inputEl = document.getElementById(`modalCommentInput_${baseId}`);
  const text = inputEl?.value.trim();
  if (!text) return;

  const currentUploaderName = currentUserProfile?.name || user.displayName || "Chief";
  const newComment = {
    uid: user.uid,
    authorName: currentUploaderName,
    text: text,
    timestamp: new Date().toISOString()
  };

  try {
    const baseRef = doc(db, "bases", baseId);
    const base = allFetchedBases.find(b => b.id === baseId);
    const updatedComments = [...(base.comments || []), newComment];

    await updateDoc(baseRef, { comments: updatedComments });
    base.comments = updatedComments;

    window.openBaseDetailsModal(baseId);
    renderBasesUI();
    window.showToast("Comment posted!");
  } catch (err) {
    window.showToast("Failed to post comment", "error");
  }
};

window.openModal = function(id) {
  if (id === "rankingsModal") renderRankingsUI();
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    el.classList.add("flex");
  }
  renderAllIcons();
};

window.closeModal = function(id) { 
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden"); 
    el.classList.remove("flex"); 
  }
};

window.handleBaseUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { 
    window.showToast("Please login first!", "error"); 
    window.openModal("authModal"); 
    return; 
  }
  const rawLink = document.getElementById("uploadLink").value.trim();
  const file = document.getElementById("uploadImageFile")?.files[0];
  const descriptionText = document.getElementById("uploadDescription")?.value.trim() || "";
  const rawTags = document.getElementById("uploadTags")?.value.trim() || "";
  const borderTheme = document.getElementById("uploadBorderTheme").value;
  const watermarkStyle = document.getElementById("uploadWatermarkStyle").value;
  const tagsArray = rawTags ? rawTags.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];

  if (!file) { 
    window.showToast("Base screenshot required!", "error"); 
    return; 
  }

  try {
    const creatorIGN = currentUserProfile?.name || user.displayName || user.email.split("@")[0] || "Chief";
    const base64Image = await compressAndWatermarkImage(file, creatorIGN, borderTheme, watermarkStyle);
    const baseData = {
      zone: document.getElementById("uploadZone").value,
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      description: descriptionText,
      tags: tagsArray,
      link: rawLink,
      image: base64Image,
      uploaderUid: user.uid,
      uploaderName: creatorIGN,
      likesCount: 0,
      copyCount: 0,
      viewsCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      comments: [],
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "bases"), baseData);
    window.closeModal("uploadModal");
    e.target.reset();
    await loadBasesFromFirestore();
    window.showToast("Base published with custom styling!");
  } catch (error) { 
    window.showToast(error.message || "Upload Error", "error"); 
  }
};

window.handleClanUpload = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { 
    window.showToast("Please login first!", "error"); 
    window.openModal("authModal"); 
    return; 
  }
  const clanData = {
    name: document.getElementById("clanNameInput").value.trim(),
    tag: document.getElementById("clanTagInput").value.trim().toUpperCase(),
    link: document.getElementById("clanLinkInput").value.trim(),
    category: document.getElementById("clanCategoryInput").value,
    desc: document.getElementById("clanDescInput").value.trim(),
    uploaderUid: user.uid,
    createdAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db, "clans"), clanData);
    window.closeModal("postClanModal");
    e.target.reset();
    await loadClansFromFirestore();
    window.showToast("Clan recruitment posted!");
  } catch (err) { 
    window.showToast("Error registering clan", "error"); 
  }
};

window.handleSaveProfile = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const fileInput = document.getElementById("editAvatarFile")?.files[0];
  const presetAvatarUrl = document.getElementById("editPresetAvatarUrl")?.value.trim();
  
  let finalAvatarUrl = currentUserProfile?.avatarUrl || "";
  if (presetAvatarUrl) finalAvatarUrl = presetAvatarUrl;
  if (fileInput) {
    finalAvatarUrl = await compressAndWatermarkImage(fileInput, document.getElementById("editName").value.trim(), "gold", "classic", 200, 0.7);
  }

  const profileData = {
    name: document.getElementById("editName").value.trim(),
    townHallLevel: document.getElementById("editTH").value,
    tag: document.getElementById("editPlayerTag").value.trim().toUpperCase(),
    clanName: document.getElementById("editClan").value.trim() || "Solo",
    discord: document.getElementById("editDiscord").value.trim(),
    bio: document.getElementById("editBio").value.trim(),
    avatarUrl: finalAvatarUrl,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
    window.closeModal("editProfileModal");
    window.showToast("Profile updated successfully!");
    setTimeout(() => location.reload(), 500);
  } catch (err) { 
    window.showToast("Update failed", "error"); 
  }
};

async function loadBasesFromFirestore() {
  const container = document.getElementById("basesContainer");
  if (!container) return;
  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    allFetchedBases = [];
    
    const uploaderIds = new Set();
    querySnapshot.forEach(docSnap => {
      const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : null;
      if (data) {
        allFetchedBases.push(data);
        if (data.uploaderUid) uploaderIds.add(data.uploaderUid);
      }
    });

    for (const uid of uploaderIds) {
      try {
        const uDoc = await getDoc(doc(db, "users", uid));
        if (uDoc.exists()) {
          usersProfileCache[uid] = uDoc.data();
        }
      } catch (err) {}
    }
    
    renderBasesUI();
    calculateCreatorOfTheMonth();

    if (auth.currentUser) updateUserDashboardStats(auth.currentUser.uid);

    const urlParams = new URLSearchParams(window.location.search);
    const sharedBaseId = urlParams.get("base");
    if (sharedBaseId) {
      setTimeout(() => window.openBaseDetailsModal(sharedBaseId), 500);
    }
  } catch (error) { 
    renderBasesUI(); 
  }
}

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
    renderClansUI(); 
  }
}

function renderClansUI() {
  const container = document.getElementById("clansContainer");
  if (!container) return;
  if (allFetchedClans.length === 0) { 
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">No clans registered yet.</div>`; 
    return; 
  }
  container.innerHTML = allFetchedClans.map(clan => `
    <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-bold text-sm">${clan.name}</h3>
          <span class="bg-amber-500/20 text-amber-500 font-mono text-[10px] px-2 py-0.5 rounded">${clan.tag}</span>
        </div>
        <span class="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full my-1">${clan.category || 'Active Clan'}</span>
        <p class="text-xs text-slate-500 dark:text-slate-300 my-2">${clan.desc}</p>
      </div>
      <a href="${clan.link}" target="_blank" class="w-full bg-amber-500 text-black font-bold py-2 rounded-xl text-xs text-center uppercase tracking-wider block mt-2">Join Clan</a>
    </div>
  `).join("");
  renderAllIcons();
}

function renderUserSavedVault() {
  const container = document.getElementById("directVaultContainer");
  if (!container) return;
  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) { 
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">Vault is empty. Save bases to view them here.</div>`; 
    renderAllIcons();
    return; 
  }
  container.innerHTML = savedList.map(b => generateBaseCardHTML(b)).join("");
  renderAllIcons();
}

function renderProfileSavedVaultCards() {
  const container = document.getElementById("profileTabContentSaved");
  if (!container) return;
  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) { 
    container.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 text-xs">Vault is empty.</div>`; 
    renderAllIcons();
    return; 
  }
  container.innerHTML = savedList.map(b => generateBaseCardHTML(b)).join("");
  renderAllIcons();
}

function renderRankingsUI() {
  const container = document.getElementById("rankingsListContainer");
  if (!container) return;
  const creatorsMap = {};
  allFetchedBases.forEach(base => {
    const uploader = usersProfileCache[base.uploaderUid] || {};
    const name = uploader.name || base.uploaderName || "Chief";
    if (!creatorsMap[base.uploaderUid]) creatorsMap[base.uploaderUid] = { name, uploads: 0, thLevel: base.th || "TH 16" };
    creatorsMap[base.uploaderUid].uploads += 1;
  });
  const ranked = Object.values(creatorsMap).sort((a, b) => b.uploads - a.uploads);
  if (ranked.length === 0) { 
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">No creators ranked yet.</p>`; 
    return; 
  }
  container.innerHTML = ranked.map((c, idx) => `
    <div class="flex items-center justify-between bg-slate-100 dark:bg-czDark p-2.5 rounded-xl text-xs">
      <div class="flex items-center gap-2.5">
        <span class="font-extrabold text-amber-500 text-xs w-5">#${idx + 1}</span>
        <div><span class="font-bold block">${c.name}</span><span class="text-[10px] text-slate-400">${c.uploads} Layouts</span></div>
      </div>
    </div>
  `).join("");
  renderAllIcons();
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
  else if (viewName === "vault") { 
    document.getElementById("viewVaultSection")?.classList.remove("hidden"); 
    renderUserSavedVault();
  }
  else if (viewName === "clans") { document.getElementById("viewClansSection")?.classList.remove("hidden"); loadClansFromFirestore(); }
  else if (viewName === "profile") { 
    document.getElementById("viewProfileSection")?.classList.remove("hidden");
    if (auth.currentUser) updateUserDashboardStats(auth.currentUser.uid);
  }
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
  loadClansFromFirestore();
  renderAllIcons();
});