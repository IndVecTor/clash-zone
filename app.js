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
let allFetchedBases = [];
let currentUserProfile = null;

// ==========================================
// 2. AUTH STATE LISTENER & USER DASHBOARD
// ==========================================
onAuthStateChanged(auth, async (user) => {
  const headerAuth = document.getElementById("headerAuthArea");
  const userProfileStrip = document.getElementById("userProfileStrip");

  if (user) {
    const defaultName = user.displayName || user.email.split('@')[0];
    
    // Header View
    if (headerAuth) {
      headerAuth.innerHTML = `
        <button onclick="window.openModal('uploadModal')" class="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Upload</span>
        </button>
        <button onclick="window.openEditProfileModal()" class="flex items-center gap-2 bg-czPanel border border-slate-700 hover:border-amber-400/50 px-3 py-1.5 rounded-xl text-xs transition">
          <i class="fa-solid fa-circle-user text-amber-400 text-sm"></i>
          <span class="font-bold text-white max-w-[100px] truncate" id="headerUserName">${defaultName}</span>
        </button>
      `;
    }

    // Load User Profile from Firestore
    if (userProfileStrip) {
      userProfileStrip.classList.remove("hidden");
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          currentUserProfile = userDoc.data();
          document.getElementById("dashPlayerName").innerText = currentUserProfile.name || defaultName;
          document.getElementById("dashTHBadge").innerText = currentUserProfile.townHallLevel || "TH 16";
          document.getElementById("dashClanInfo").innerText = `Clan: ${currentUserProfile.clanName || 'Solo'} | Tag: ${currentUserProfile.tag || '#CLASH'}`;
          document.getElementById("dashTrophies").innerText = `🏆 ${currentUserProfile.trophies || 5000}`;
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
        console.warn("User doc read fallback:", e);
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
// 3. EDIT PROFILE FUNCTIONALITY
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

  window.openModal('editProfileModal');
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
    alert("✅ Profile updated successfully!");
    location.reload();
  } catch (err) {
    console.error("Save profile error:", err);
    alert("❌ Error: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `Save Changes`;
  }
};

// ==========================================
// 4. FETCH & DISPLAY BASES (FIREBASE)
// ==========================================
async function loadBasesFromFirestore() {
  const container = document.getElementById("basesContainer");
  if (!container) return;

  try {
    const q = query(collection(db, "bases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allFetchedBases = [];
    querySnapshot.forEach((doc) => {
      allFetchedBases.push({ id: doc.id, ...doc.data() });
    });

    renderBasesUI();
  } catch (error) {
    console.warn("Firestore access error, loading local:", error);
    allFetchedBases = JSON.parse(localStorage.getItem("cz_user_uploaded_bases")) || [];
    renderBasesUI();
  }
}

function renderBasesUI() {
  const container = document.getElementById("basesContainer");
  if (!container) return;

  const countText = document.getElementById("baseCountText");
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  const filtered = allFetchedBases.filter(base => {
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || (base.type && base.type.toLowerCase().includes(currentType.toLowerCase()));
    const matchSearch = (base.title || "").toLowerCase().includes(search) || 
                        (base.th || "").toLowerCase().includes(search) || 
                        (base.uploaderName || "").toLowerCase().includes(search);
    return matchTH && matchType && matchSearch;
  });

  if (countText) countText.innerText = `${filtered.length} Layouts`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i class="fa-solid fa-shield-cat text-4xl mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-slate-300">Abhi koi base upload nahi hua hai</h3>
        <p class="text-xs text-slate-500 mt-1">Pehle login karein aur apna real base upload karein!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(base => `
    <div class="glass-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group shadow-xl hover:border-amber-400/60 hover:-translate-y-1">
      <div class="h-48 relative overflow-hidden bg-czDark">
        <img src="${base.image}" alt="${base.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'" />
        <span class="absolute top-2.5 left-2.5 bg-czDark/90 text-amber-400 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg backdrop-blur-md shadow-md">
          ${base.th}
        </span>
        <span class="absolute top-2.5 right-2.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700">
          ${base.type}
        </span>
      </div>

      <div class="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span class="text-amber-400 font-bold truncate max-w-[150px]"><i class="fa-solid fa-circle-user mr-1"></i> ${base.uploaderName || 'Verified Player'}</span>
            <span class="text-emerald-400 font-semibold"><i class="fa-solid fa-shield-check mr-1"></i>Verified</span>
          </div>
          <h3 class="font-bold text-sm text-white line-clamp-2 mb-4 leading-snug">${base.title}</h3>
        </div>

        <button onclick="window.copyBaseLink('${base.link}')" class="w-full bg-czPanel hover:bg-amber-500 hover:text-black text-amber-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-400 transition shadow-md">
          <i class="fa-solid fa-copy"></i>
          <span>Copy In-Game Link</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 5. IMAGE COMPRESSION & BASE UPLOAD
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
    alert("Pehle Login karein base upload karne ke liye!");
    window.openModal('authModal');
    return;
  }

  const fileInput = document.getElementById("uploadImageFile");
  const file = fileInput?.files[0];
  if (!file) {
    alert("Base screenshot upload karna zaroori hai!");
    return;
  }

  const submitBtn = document.getElementById("submitBaseBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

  try {
    const base64Image = await compressImage(file);
    const baseData = {
      th: document.getElementById("uploadTH").value,
      type: document.getElementById("uploadType").value,
      title: document.getElementById("uploadTitle").value.trim(),
      link: document.getElementById("uploadLink").value.trim(),
      image: base64Image,
      uploaderUid: user.uid,
      uploaderName: currentUserProfile?.name || user.displayName || user.email.split('@')[0],
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "bases"), baseData);
    } catch (err) {
      console.warn("Firestore direct write error, saving locally:", err);
      let localBases = JSON.parse(localStorage.getItem("cz_user_uploaded_bases")) || [];
      localBases.unshift({ ...baseData, id: Date.now() });
      localStorage.setItem("cz_user_uploaded_bases", JSON.stringify(localBases));
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base Layout`;
    window.closeModal('uploadModal');
    e.target.reset();
    await loadBasesFromFirestore();
    alert("✅ Base layout successfully publish ho gaya!");
  } catch (error) {
    console.error("Upload error:", error);
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Publish Base Layout`;
    alert("❌ Error: " + error.message);
  }
};

// ==========================================
// 6. SIGNUP & LOGIN HANDLERS
// ==========================================
window.handleEmailSignup = async function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass = document.getElementById("signupPass").value.trim();
  const th = document.getElementById("signupTH").value;
  let tag = document.getElementById("signupTag").value.trim().toUpperCase();
  if (tag && !tag.startsWith("#")) tag = "#" + tag;

  if (pass.length < 6) {
    alert("Password kam se kam 6 characters ka hona chahiye!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Save Initial Profile to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: name,
      townHallLevel: th,
      tag: tag || "#CLASH",
      clanName: "Solo",
      trophies: 5000,
      createdAt: serverTimestamp()
    });

    window.closeModal('authModal');
    alert(`🎉 Welcome Chief ${name}! Account ban gaya.`);
    location.reload();
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === 'auth/email-already-in-use') {
      alert("❌ Yeh Email pehle se registered hai! Kripya Login karein.");
      window.switchAuthTab('login');
    } else if (error.code === 'auth/invalid-email') {
      alert("❌ Sahi email address dalein.");
    } else {
      alert("❌ Signup Error: " + error.message);
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
    alert("✅ Login successful!");
    location.reload();
  } catch (error) {
    console.error("Login error:", error);
    alert("❌ Login Error: " + error.message);
  }
};

window.handleLogout = function() {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    location.reload();
  });
};

// ==========================================
// 7. FILTERS & NAVIGATION HELPERS
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

window.copyBaseLink = function(link) {
  if (!link) return;
  navigator.clipboard.writeText(link).then(() => {
    alert("✅ Base Link Copied! Opening in Clash of Clans...");
    window.open(link, "_blank");
  }).catch(() => {
    window.open(link, "_blank");
  });
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
});