import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
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
const db = getFirestore(app);

let currentZone = "home";
let currentTH = "ALL";
let currentType = "ALL";
let currentSort = "latest";
let allFetchedBases = [];
let allFetchedClans = [];
let currentUserProfile = null;
let phoneConfirmationResult = null;

let userLikedBases = JSON.parse(localStorage.getItem("cz_liked_bases") || "[]");
let userBookmarkedBases = JSON.parse(localStorage.getItem("cz_bookmarked_bases") || "[]");

// Full range like cocbases.com
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

function compressAndWatermarkImage(file, creatorName = "Chief", maxWidth = 800, quality = 0.65) {
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
        
        const padding = 16, badgeHeight = 28, badgeWidth = Math.min(width * 0.5, 230);
        const x = width - badgeWidth - padding, y = height - badgeHeight - padding;
        
        ctx.save();
        ctx.fillStyle = "rgba(3, 5, 11, 0.85)";
        ctx.fillRect(x, y, badgeWidth, badgeHeight);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)"; 
        ctx.lineWidth = 1.5; 
        ctx.strokeRect(x, y, badgeWidth, badgeHeight);
        ctx.font = "bold 11px Rajdhani, sans-serif"; 
        ctx.fillStyle = "#fbbf24"; 
        ctx.fillText("CLASHZONE", x + 8, y + 18);
        ctx.fillStyle = "#ffffff"; 
        ctx.fillText(`| ${creatorName.substring(0, 10)}`, x + 80, y + 18);
        ctx.restore();
        
        resolve(elem.toDataURL("image/jpeg", quality));
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}

// ----------------- PHONE OTP AUTH -----------------
function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptchaContainer', {
      size: 'invisible'
    });
  }
}

window.sendPhoneOtp = async function() {
  const phoneInput = document.getElementById("userPhoneNumber");
  const btn = document.getElementById("btnSendOtp");
  const phoneNumber = phoneInput?.value.trim();

  if (!phoneNumber || phoneNumber.length < 10) {
    window.showToast("Enter phone with country code (e.g. +91...)", "error");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Sending...";
  try {
    setupRecaptcha();
    phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    document.getElementById("phoneStep1").classList.add("hidden");
    document.getElementById("phoneStep2").classList.remove("hidden");
    window.showToast("OTP sent to mobile!");
  } catch (error) {
    console.error("Phone Auth Error:", error);
    window.showToast(error.message || "Failed to send OTP", "error");
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  } finally {
    btn.disabled = false;
    btn.innerText = "Send Instant OTP";
  }
};

window.verifyPhoneOtp = async function() {
  const otpInput = document.getElementById("phoneOtpInput");
  const btn = document.getElementById("btnVerifyOtp");
  const code = otpInput?.value.trim();

  if (!code || code.length !== 6) {
    window.showToast("Enter 6-digit OTP", "error");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Verifying...";
  try {
    const result = await phoneConfirmationResult.confirm(code);
    const user = result.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        name: "Chief " + user.phoneNumber.slice(-4),
        townHallLevel: "TH 16",
        tag: "#CLASH",
        clanName: "Solo",
        trophies: 5000,
        bio: "ClashZone Chief",
        createdAt: serverTimestamp()
      });
    }
    window.closeModal("authModal");
    window.showToast("Login successful!");
    setTimeout(() => location.reload(), 600);
  } catch (error) {
    window.showToast("Invalid OTP code", "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Verify & Login";
  }
};

window.handleEmailLogin = async function(e) {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("loginEmail").value.trim(), document.getElementById("loginPass").value.trim());
    window.closeModal("authModal");
    window.showToast("Login successful!");
    setTimeout(() => location.reload(), 600);
  } catch (error) { 
    window.showToast(error.message || "Login Failed", "error"); 
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
    const defaultName = user.displayName || user.phoneNumber || (user.email ? user.email.split("@")[0] : "Chief");
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
        bio: "ClashZone Chief" 
      };
      
      if (document.getElementById("profileIGN")) document.getElementById("profileIGN").innerText = currentUserProfile.name || defaultName;
      if (document.getElementById("profileTHBadge")) document.getElementById("profileTHBadge").innerText = currentUserProfile.townHallLevel || "TH 16";
      if (document.getElementById("profileTagClan")) document.getElementById("profileTagClan").innerText = `Clan: ${currentUserProfile.clanName || "Solo"} | ${currentUserProfile.tag || "#CLASH"}`;
      if (document.getElementById("profileBioText")) document.getElementById("profileBioText").innerText = currentUserProfile.bio || "No bio added.";
      
      const avatarContainer = document.getElementById("profileAvatarContainer");
      if (avatarContainer) {
        avatarContainer.innerHTML = `<span>${(currentUserProfile.name || defaultName).charAt(0).toUpperCase()}</span>`;
      }

      const userPosts = allFetchedBases.filter(b => b.uploaderUid === user.uid);
      if (document.getElementById("statPostsCount")) document.getElementById("statPostsCount").innerText = userPosts.length;
      if (document.getElementById("tabPostNum")) document.getElementById("tabPostNum").innerText = userPosts.length;
      
      renderUserProfilePosts(userPosts);
      renderUserSavedVault();
    } catch (e) {
      console.error(e);
    }
  } else {
    currentUserProfile = null;
    if (profileLoggedOut) profileLoggedOut.classList.remove("hidden");
    if (profileLoggedIn) profileLoggedIn.classList.add("hidden");
  }
  renderAllIcons();
});

// ----------------- FILTERS & SEARCH -----------------
window.switchZone = function(zone) {
  currentZone = zone; 
  currentTH = "ALL";
  ['home', 'builder', 'capital'].forEach(z => {
    const tab = document.getElementById('zoneTab' + z.charAt(0).toUpperCase() + z.slice(1));
    if (tab) {
      const active = z === zone;
      tab.className = active 
        ? "px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-500 text-black"
        : "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-600 dark:text-slate-300 hover:text-amber-500";
    }
  });
  renderLevelFilters(); 
  renderBasesUI();
};

window.setTypeFilter = function(type) {
  currentType = type;
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
  renderLevelFilters(); 
  renderBasesUI(); 
};

window.setSortOption = function(sortType) { 
  currentSort = sortType;
  ['latest', 'copies', 'likes'].forEach(s => {
    const btn = document.getElementById('sort' + s.charAt(0).toUpperCase() + s.slice(1));
    if (btn) {
      btn.className = s === sortType
        ? "px-2.5 py-1 rounded-lg text-xs font-bold transition bg-amber-500 text-black"
        : "px-2.5 py-1 rounded-lg text-xs font-bold transition text-slate-600 dark:text-slate-300 hover:text-amber-500";
    }
  });
  renderBasesUI(); 
};

window.filterBases = function() { renderBasesUI(); };

// ----------------- COCBASES ENGINE RENDER -----------------
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

  if (currentSort === "likes") {
    filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else if (currentSort === "copies") {
    filtered.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">No base layouts found matching filters.</div>`;
    renderAllIcons();
    return;
  }

  container.innerHTML = filtered.map(base => {
    const isLiked = userLikedBases.includes(base.id);
    const isBookmarked = userBookmarkedBases.includes(base.id);
    const copies = base.copyCount || 0;
    
    return `
      <div class="glass-panel rounded-2xl overflow-hidden flex flex-col group border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition">
        
        <!-- IMAGE & DIRECT MODAL -->
        <div class="h-44 relative overflow-hidden bg-slate-950 cursor-pointer" onclick="window.openBaseDetailsModal('${base.id}')">
          <img src="${base.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          
          <span class="absolute top-2 left-2 bg-black/85 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded shadow">${base.th}</span>
          <span class="absolute top-2 right-2 bg-black/85 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">${base.type || 'War'}</span>

          <!-- COPIES TICKER (Cocbases style) -->
          <span class="absolute bottom-2 left-2 bg-black/80 text-slate-200 text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
            <i data-lucide="download" class="w-2.5 h-2.5 text-amber-400"></i> ${copies} Copies
          </span>
        </div>

        <!-- CONTENT -->
        <div class="p-3.5 flex flex-col flex-grow justify-between">
          <div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>By <b class="text-amber-500 font-bold">${base.uploaderName || "Chief"}</b></span>
              <button onclick="window.toggleBookmark('${base.id}')" class="text-slate-400 hover:text-amber-400 transition" title="Bookmark">
                <i data-lucide="bookmark" class="w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}"></i>
              </button>
            </div>
            <h3 class="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">${base.title}</h3>
          </div>

          <!-- BOTTOM ACTION: 1-CLICK DIRECT APP LAUNCH -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button onclick="window.handleLikeBase('${base.id}')" class="text-xs text-slate-400 flex items-center gap-1"><i data-lucide="heart" class="w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}"></i><span>${base.likesCount || 0}</span></button>
            
            <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-1.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1 shadow-md transition">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Copy Base
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  renderAllIcons();
}

// ----------------- COCBASES 1-CLICK COPY & COUNTER -----------------
window.copyAndLaunchBase = async function(baseId, link) {
  if (!link) return;

  // Background increment copy counter in Firestore
  try {
    const baseRef = doc(db, "bases", baseId);
    updateDoc(baseRef, { copyCount: increment(1) });
  } catch (e) {}

  // Clipboard copy
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).catch(() => {});
  }
  
  window.showToast("Opening Clash of Clans with Layout...");
  
  // Direct Supercell App Deep-Link trigger
  setTimeout(() => {
    window.location.href = link;
  }, 400);
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

// ----------------- MODAL POPUPS -----------------
window.openBaseDetailsModal = function(baseId) {
  const base = allFetchedBases.find(b => b.id === baseId);
  if (!base) return;
  let modal = document.getElementById("baseDetailsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "baseDetailsModal";
    modal.className = "fixed inset-0 bg-black/85 backdrop-blur-sm hidden justify-center items-center p-4 z-50 overflow-y-auto";
    document.body.appendChild(modal);
  }
  const shareText = encodeURIComponent(`Check out this ${base.th} layout "${base.title}" on ClashZone!\nCopy: ${base.link}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  
  modal.innerHTML = `
    <div class="glass-panel rounded-2xl w-full max-w-lg p-5 relative shadow-2xl my-auto space-y-3">
      <button onclick="window.closeModal('baseDetailsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-sm">✕</button>
      <div class="flex items-center justify-between">
        <span class="bg-amber-500/20 text-amber-500 font-extrabold px-2.5 py-0.5 rounded text-xs">${base.th} • ${(base.type || 'War').toUpperCase()}</span>
        <span class="text-xs text-slate-400">By <b>${base.uploaderName || 'Chief'}</b></span>
      </div>
      <h3 class="text-base font-bold dark:text-white">${base.title}</h3>
      <div class="w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-slate-950">
        <img src="${base.image}" class="w-full h-full object-cover" />
      </div>
      <div class="flex items-center gap-2 pt-2">
        <button onclick="window.copyAndLaunchBase('${base.id}', '${base.link}')" class="flex-1 bg-amber-500 text-black py-2.5 rounded-xl font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md">
          <i data-lucide="external-link" class="w-4 h-4"></i> Copy In-Game Layout
        </button>
        <a href="${whatsappUrl}" target="_blank" class="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1">
          <i data-lucide="share-2" class="w-4 h-4"></i> Share
        </a>
      </div>
    </div>
  `;
  modal.classList.remove("hidden"); 
  modal.classList.add("flex");
  renderAllIcons();
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
  if (!file) { 
    window.showToast("Base screenshot required!", "error"); 
    return; 
  }
  try {
    const creatorIGN = currentUserProfile?.name || user.displayName || user.phoneNumber || "Chief";
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
      copyCount: 0,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "bases"), baseData);
    window.closeModal("uploadModal");
    e.target.reset();
    await loadBasesFromFirestore();
    window.showToast("Base published to ClashZone!");
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
    desc: document.getElementById("clanDescInput").value.trim(),
    uploaderUid: user.uid,
    createdAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db, "clans"), clanData);
    window.closeModal("postClanModal");
    e.target.reset();
    await loadClansFromFirestore();
    window.showToast("Clan added!");
  } catch (err) { 
    window.showToast("Error registering clan", "error"); 
  }
};

window.handleSaveProfile = async function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const profileData = {
    name: document.getElementById("editName").value.trim(),
    townHallLevel: document.getElementById("editTH").value,
    clanName: document.getElementById("editClan").value.trim() || "Solo",
    bio: document.getElementById("editBio").value.trim(),
    updatedAt: serverTimestamp()
  };
  try {
    await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
    window.closeModal("editProfileModal");
    window.showToast("Profile saved!");
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
    querySnapshot.forEach(docSnap => allFetchedBases.push({ id: docSnap.id, ...docSnap.data() }));
    renderBasesUI();
  } catch (error) { 
    console.error("Error reading bases:", error);
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
        <p class="text-xs text-slate-500 dark:text-slate-300 my-2">${clan.desc}</p>
      </div>
      <a href="${clan.link}" target="_blank" class="w-full bg-amber-500 text-black font-bold py-2 rounded-xl text-xs text-center uppercase tracking-wider block mt-2">Join Clan</a>
    </div>
  `).join("");
  renderAllIcons();
}

function renderUserProfilePosts(posts) {
  const container = document.getElementById("profileTabContentPosts");
  if (!container) return;
  if (posts.length === 0) { 
    container.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 text-xs">No uploads yet.</div>`; 
    return; 
  }
  container.innerHTML = posts.map(b => `
    <div class="glass-panel rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
      <img src="${b.image}" class="w-12 h-12 rounded-lg object-cover shrink-0" />
      <div class="min-w-0 flex-1">
        <span class="text-amber-500 font-bold text-[10px]">${b.th}</span>
        <h4 class="text-xs font-bold truncate">${b.title}</h4>
      </div>
      <button onclick="window.copyAndLaunchBase('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0">Launch</button>
    </div>
  `).join("");
}

function renderUserSavedVault() {
  const container = document.getElementById("profileTabContentSaved");
  if (!container) return;
  const savedList = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
  if (savedList.length === 0) { 
    container.innerHTML = `<div class="py-6 text-center text-slate-400 text-xs">No saved bases in vault.</div>`; 
    return; 
  }
  container.innerHTML = savedList.map(b => `
    <div class="glass-panel rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
      <img src="${b.image}" class="w-12 h-12 rounded-lg object-cover shrink-0" />
      <div class="min-w-0 flex-1">
        <span class="text-amber-500 font-bold text-[10px]">${b.th}</span>
        <h4 class="text-xs font-bold truncate">${b.title}</h4>
      </div>
      <button onclick="window.copyAndLaunchBase('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0">Launch</button>
    </div>
  `).join("");
}

function renderRankingsUI() {
  const container = document.getElementById("rankingsListContainer");
  if (!container) return;
  const creatorsMap = {};
  allFetchedBases.forEach(base => {
    const key = base.uploaderUid || base.uploaderName || "Chief";
    if (!creatorsMap[key]) creatorsMap[key] = { name: base.uploaderName || "Chief", uploads: 0, thLevel: base.th || "TH 16" };
    creatorsMap[key].uploads += 1;
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
    const vCont = document.getElementById("directVaultContainer");
    const saved = allFetchedBases.filter(b => userBookmarkedBases.includes(b.id));
    if (vCont) {
      vCont.innerHTML = saved.length === 0 ? `<p class="text-xs text-center text-slate-400 py-10">Vault is empty.</p>` : saved.map(b => `
        <div class="glass-panel rounded-xl p-3 flex items-center justify-between gap-3">
          <img src="${b.image}" class="w-14 h-14 rounded-lg object-cover" />
          <div class="flex-1 min-w-0">
            <span class="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">${b.th}</span>
            <h4 class="text-xs font-bold truncate mt-0.5">${b.title}</h4>
          </div>
          <button onclick="window.copyAndLaunchBase('${b.id}', '${b.link}')" class="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold">Copy</button>
        </div>
      `).join("");
    }
  }
  else if (viewName === "clans") { document.getElementById("viewClansSection")?.classList.remove("hidden"); loadClansFromFirestore(); }
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
  loadClansFromFirestore();
  renderAllIcons();
});