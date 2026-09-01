// Sample Database of CocBases style layouts
const initialBases = [
  {
    id: 1,
    th: "TH 18",
    type: "War",
    title: "Anti 3-Star CWL Pro Ring Base",
    downloads: 1420,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=TH18_WAR_01"
  },
  {
    id: 2,
    th: "TH 17",
    type: "Anti 3-Star",
    title: "Anti-Root Rider & Zap Lalo Defense",
    downloads: 980,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=TH17_ANTI3_02"
  },
  {
    id: 3,
    th: "TH 16",
    type: "Trophy",
    title: "Legend League 5800+ Push Base",
    downloads: 2310,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=TH16_LEGEND_03"
  },
  {
    id: 4,
    th: "TH 15",
    type: "Farming",
    title: "Dark Elixir Vault Defender Base",
    downloads: 870,
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=TH15_FARM_04"
  },
  {
    id: 5,
    th: "TH 11",
    type: "War",
    title: "Anti-Electro Dragon Island Base",
    downloads: 3450,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=TH11_WAR_05"
  },
  {
    id: 6,
    th: "BH 10",
    type: "Trophy",
    title: "Stage 2 Anti-Baby Dragon Layout",
    downloads: 1120,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80",
    link: "https://link.clashofclans.com/en?action=OpenLayout&id=BH10_TROPHY_06"
  }
];

let currentTH = "ALL";
let currentType = "ALL";

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("cz_bases")) {
    localStorage.setItem("cz_bases", JSON.stringify(initialBases));
  }
  renderBases();
});

function renderBases() {
  const container = document.getElementById("basesContainer");
  if (!container) return;

  let bases = JSON.parse(localStorage.getItem("cz_bases")) || initialBases;
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();

  const filtered = bases.filter(base => {
    const matchTH = currentTH === "ALL" || base.th === currentTH;
    const matchType = currentType === "ALL" || base.type.toLowerCase().includes(currentType.toLowerCase());
    const matchSearch = base.title.toLowerCase().includes(search) || base.th.toLowerCase().includes(search) || base.type.toLowerCase().includes(search);
    return matchTH && matchType && matchSearch;
  });

  const countText = document.getElementById("baseCountText");
  if (countText) countText.innerText = `Showing ${filtered.length} layouts`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i class="fa-solid fa-chess-board text-4xl mb-2 text-slate-600"></i>
        <p>No base layouts found matching your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(base => `
    <div class="bg-czCard border border-slate-800 hover:border-amber-400/60 rounded-2xl overflow-hidden transition duration-300 flex flex-col group">
      <!-- Thumbnail & Badge -->
      <div class="h-44 relative overflow-hidden bg-slate-900">
        <img src="${base.img}" alt="${base.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <span class="absolute top-2.5 left-2.5 bg-czDark/90 text-amber-400 border border-amber-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-md">
          ${base.th}
        </span>
        <span class="absolute top-2.5 right-2.5 bg-black/80 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
          ${base.type}
        </span>
      </div>

      <!-- Card Details -->
      <div class="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span><i class="fa-solid fa-download text-amber-400 mr-1"></i> ${base.downloads}+ Copies</span>
            <span><i class="fa-solid fa-star text-amber-400 mr-1"></i> ${base.rating}</span>
          </div>
          <h3 class="font-bold text-sm sm:text-base text-white line-clamp-1 mb-4">${base.title}</h3>
        </div>

        <!-- 1-Click Copy Button -->
        <button onclick="copyBaseLink('${base.link}')" class="w-full bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-400 transition">
          <i class="fa-solid fa-copy"></i>
          <span>Copy Base Link</span>
        </button>
      </div>
    </div>
  `).join('');
}

function setTHFilter(th) {
  currentTH = th;
  document.querySelectorAll(".base-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.innerText === th || (th === 'ALL' && btn.innerText === 'ALL BASES'));
  });
  renderBases();
}

function setTypeFilter(type) {
  currentType = type;
  renderBases();
}

function filterBases() {
  renderBases();
}

function copyBaseLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    alert("✅ Base Link Copied! Opening in Clash of Clans layout editor...");
    window.open(link, "_blank");
  }).catch(() => {
    window.open(link, "_blank");
  });
}

function handleBaseUpload(e) {
  e.preventDefault();
  const th = document.getElementById("uploadTH").value;
  const type = document.getElementById("uploadType").value;
  const title = document.getElementById("uploadTitle").value.trim();
  const link = document.getElementById("uploadLink").value.trim();

  let bases = JSON.parse(localStorage.getItem("cz_bases")) || initialBases;
  bases.unshift({
    id: Date.now(),
    th,
    type,
    title,
    downloads: 1,
    rating: 5.0,
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    link
  });

  localStorage.setItem("cz_bases", JSON.stringify(bases));
  closeModal("uploadModal");
  e.target.reset();
  renderBases();
  alert("🎉 Base layout published to ClashZone successfully!");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}