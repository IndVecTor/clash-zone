<!DOCTYPE html>
<html lang="en" class="overflow-x-hidden dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>ClashZone | Next-Gen Esports Base Layout & Clan Hub</title>
  
  <!-- PWA & Mobile Optimization -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#f59e0b" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="ClashZone" />
  <link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6e1.png" />

  <!-- Tailwind & Lucide Icons & Fonts -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
  
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            czGold: '#f59e0b',
            czDark: '#03050b',
            czPanel: '#070c18',
            czCard: '#0b1326',
            czBorder: 'rgba(245, 158, 11, 0.25)',
            czNeon: '#fbbf24',
          },
          fontFamily: {
            gaming: ['Orbitron', 'sans-serif'],
            body: ['Rajdhani', 'sans-serif'],
          },
          boxShadow: {
            'neon-gold': '0 0 25px rgba(245, 158, 11, 0.3)',
            'cyber-card': '0 12px 35px -10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(245, 158, 11, 0.05)',
          }
        }
      }
    }
  </script>
  <style>
    html, body {
      overflow-x: hidden;
      max-width: 100vw;
      width: 100%;
      background-color: #03050b;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 60%),
        linear-gradient(rgba(245, 158, 11, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245, 158, 11, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 36px 36px, 36px 36px;
      font-family: 'Rajdhani', sans-serif;
    }
    .gaming-logo { 
      font-family: 'Orbitron', sans-serif; 
      letter-spacing: 2px;
      text-shadow: 0 0 30px rgba(245, 158, 11, 0.45);
    }
    .gold-gradient {
      background: linear-gradient(135deg, #ffffff 0%, #fbbf24 45%, #d97706 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .base-filter-btn.active, .sort-btn.active, .zone-tab-btn.active, .profile-tab-btn.active {
      background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
      color: #03050b;
      font-weight: 800;
      border-color: #fde68a;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
    }
    .glass-panel {
      background: rgba(7, 12, 24, 0.88);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

    .bnav-btn { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
    .bnav-btn.active { color: #fbbf24; transform: translateY(-3px); }
    .bnav-dot { opacity: 0; transform: scale(0); transition: all 0.25s ease; }
    .bnav-btn.active .bnav-dot { opacity: 1; transform: scale(1); }
  </style>
</head>
<body class="text-slate-100 min-h-screen pb-32 selection:bg-amber-500 selection:text-black">

  <!-- TOAST NOTIFICATION CONTAINER -->
  <div id="toastContainer" class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

  <!-- ULTRA-MODERN HEADER -->
  <header class="sticky top-0 z-40 bg-czDark/95 backdrop-blur-2xl border-b border-czBorder w-full shadow-2xl">
    <div class="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-3">
      
      <!-- Brand Logo -->
      <a href="index.html" class="flex items-center gap-3 shrink-0 group">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 p-[1.5px] shadow-neon-gold group-hover:scale-105 transition">
          <div class="w-full h-full bg-czDark rounded-[15px] flex items-center justify-center">
            <i data-lucide="shield-alert" class="text-amber-400 w-6 h-6"></i>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="gaming-logo text-2xl font-black gold-gradient tracking-widest uppercase leading-none">CLASH<span class="text-white">ZONE</span></span>
          <span class="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mt-1">Esports Layout Command</span>
        </div>
      </a>

      <!-- Header Right Controls -->
      <div class="flex items-center gap-2.5 shrink-0">
        <button id="permanentInstallBtn" onclick="window.triggerPermanentAppInstall()" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-neon-gold cursor-pointer">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span class="hidden sm:inline">Install App</span>
        </button>

        <button onclick="window.openModal('notificationsModal')" class="bg-czPanel hover:bg-slate-800 border border-slate-700 text-slate-300 w-11 h-11 rounded-xl text-xs flex items-center justify-center transition relative shadow-md" title="Platform Alerts">
          <i data-lucide="bell" class="text-amber-400 w-5 h-5"></i>
          <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-neon-gold"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN REDESIGNED APP CONTAINER -->
  <div class="max-w-7xl mx-auto px-4 pt-5 w-full">

    <!-- VIEW 1: FEED SECTION -->
    <div id="viewFeedSection">
      
      <!-- IMMERSIVE HERO BANNER -->
      <section class="py-8 sm:py-12 text-center w-full relative overflow-hidden glass-panel rounded-3xl mb-6 shadow-cyber-card border-amber-500/30 px-4">
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 border border-amber-500/40 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm">
            <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i> Next-Gen Esports Layout Vault • TH 5 to TH 18
          </div>

          <h1 class="gaming-logo text-3xl sm:text-6xl font-black text-white uppercase tracking-wider leading-tight mb-4">
            ELITE WAR & FARMING <span class="gold-gradient">DEFENSE MAPS</span>
          </h1>

          <p class="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-medium">
            Discover verified anti-3-star, CWL, and trophy bases. Instant 1-tap copy integration with official Supercell servers & automated watermark security.
          </p>

          <!-- Powerful Search Bar -->
          <div class="max-w-xl mx-auto bg-czDark border border-amber-500/50 rounded-2xl p-2.5 flex items-center gap-3 shadow-neon-gold">
            <i data-lucide="search" class="text-amber-400 w-5 h-5 ml-2 shrink-0"></i>
            <input type="text" id="searchInput" onkeyup="window.filterBases()" placeholder="Search Town Hall (TH5 - TH18), Creator Name, Tag..." class="w-full bg-transparent border-none text-white text-sm sm:text-base outline-none placeholder-slate-500 font-semibold min-w-0" />
          </div>

          <!-- Quick Stat Counters -->
          <div class="grid grid-cols-3 gap-3 mt-8 max-w-lg mx-auto text-center">
            <div class="bg-czDark/90 border border-slate-800 p-3 rounded-2xl shadow-sm">
              <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Layouts</span>
              <b class="text-amber-400 text-base sm:text-lg font-black">1,840+</b>
            </div>
            <div class="bg-czDark/90 border border-slate-800 p-3 rounded-2xl shadow-sm">
              <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Clans Recr.</span>
              <b class="text-cyan-400 text-base sm:text-lg font-black">420+</b>
            </div>
            <div class="bg-czDark/90 border border-slate-800 p-3 rounded-2xl shadow-sm">
              <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Verified Pros</span>
              <b class="text-emerald-400 text-base sm:text-lg font-black">110+</b>
            </div>
          </div>
        </div>
      </section>

      <!-- ZONE & RANKINGS CONTROL BAR -->
      <section class="py-2 w-full mb-3">
        <div class="glass-panel rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md border-slate-800">
          
          <!-- Zone Switcher -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button onclick="window.switchZone('home')" id="zoneTabHome" class="zone-tab-btn active px-4 py-2 bg-czDark border border-slate-700 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2">
              <i data-lucide="home" class="w-4 h-4 text-amber-400"></i> Home Village
            </button>
            <button onclick="window.switchZone('builder')" id="zoneTabBuilder" class="zone-tab-btn px-4 py-2 bg-czDark border border-slate-700 rounded-xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition flex items-center gap-2">
              <i data-lucide="hammer" class="w-4 h-4 text-cyan-400"></i> Builder Base
            </button>
            <button onclick="window.switchZone('capital')" id="zoneTabCapital" class="zone-tab-btn px-4 py-2 bg-czDark border border-slate-700 rounded-xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition flex items-center gap-2">
              <i data-lucide="mountain" class="w-4 h-4 text-emerald-400"></i> Clan Capital
            </button>
          </div>

          <!-- Rankings Trigger -->
          <div class="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <button onclick="window.openModal('rankingsModal')" class="bg-czDark hover:bg-slate-800 border border-amber-500/40 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm w-full md:w-auto justify-center">
              <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i>
              <span>Pro Builders Rankings</span>
            </button>
          </div>

        </div>
      </section>

      <!-- STICKY LEVEL & SORT FILTER BAR -->
      <div class="sticky top-18 z-30 bg-czDark/95 backdrop-blur-2xl py-3 -mx-4 px-4 border-b border-czBorder/70 shadow-lg">
        <div class="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-none mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase text-amber-400 shrink-0 inline-flex items-center gap-1">
              <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i> Sort:
            </span>
            <button onclick="window.setSortOption('latest')" id="sortLatest" class="sort-btn active px-3.5 py-1.5 bg-czPanel border border-slate-700 rounded-xl text-xs font-bold shrink-0 transition inline-flex items-center gap-1">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i> Latest
            </button>
            <button onclick="window.setSortOption('likes')" id="sortLikes" class="sort-btn px-3.5 py-1.5 bg-czPanel border border-slate-700 rounded-xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1">
              <i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500"></i> Top Liked
            </button>
            <button onclick="window.setSortOption('downloads')" id="sortDownloads" class="sort-btn px-3.5 py-1.5 bg-czPanel border border-slate-700 rounded-xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-400"></i> Most Copied
            </button>
          </div>
          <span class="text-xs font-bold text-slate-400 shrink-0 bg-czPanel px-3 py-1 rounded-xl border border-slate-800" id="baseCountText">0 Layouts</span>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full" id="levelFilterContainer"></div>
      </div>

      <!-- CATEGORY PILL TAGS -->
      <section class="py-3.5 w-full">
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full">
          <button onclick="window.setTypeFilter('ALL')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition">All Layouts</button>
          <button onclick="window.setTypeFilter('War')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="swords" class="w-3.5 h-3.5 text-rose-400"></i> War / CWL</button>
          <button onclick="window.setTypeFilter('Anti 3-Star')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="shield" class="w-3.5 h-3.5 text-amber-400"></i> Anti 3-Star</button>
          <button onclick="window.setTypeFilter('Anti-Edrag')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="zap" class="w-3.5 h-3.5 text-cyan-400"></i> Anti-Edrag</button>
          <button onclick="window.setTypeFilter('Anti-Smash')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="skull" class="w-3.5 h-3.5 text-indigo-400"></i> Anti-Smash</button>
          <button onclick="window.setTypeFilter('Trophy')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="trophy" class="w-3.5 h-3.5 text-blue-400"></i> Trophy</button>
          <button onclick="window.setTypeFilter('Farming')" class="type-filter-btn px-4 py-2 bg-czPanel border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 shrink-0 hover:border-amber-400 transition inline-flex items-center gap-1.5"><i data-lucide="coins" class="w-3.5 h-3.5 text-emerald-400"></i> Farming</button>
        </div>
      </section>

      <!-- BASE GRID -->
      <main class="py-3 w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full" id="basesContainer">
          <div class="glass-panel rounded-3xl overflow-hidden p-4 space-y-3">
            <div class="h-48 rounded-2xl skeleton-box"></div>
            <div class="h-4 w-3/4 rounded skeleton-box"></div>
            <div class="h-10 rounded-2xl skeleton-box"></div>
          </div>
          <div class="glass-panel rounded-3xl overflow-hidden p-4 space-y-3">
            <div class="h-48 rounded-2xl skeleton-box"></div>
            <div class="h-4 w-3/4 rounded skeleton-box"></div>
            <div class="h-10 rounded-2xl skeleton-box"></div>
          </div>
        </div>
      </main>
    </div>

    <!-- VIEW 2: SAVED VAULT SECTION -->
    <div id="viewVaultSection" class="hidden py-6">
      <div class="text-center mb-8">
        <h2 class="gaming-title text-3xl sm:text-5xl font-black text-white gold-gradient">Saved Layouts Vault</h2>
        <p class="text-sm text-slate-400 mt-2">Your bookmarked defense maps ready for instant war preparation.</p>
      </div>

      <div class="max-w-4xl mx-auto space-y-4" id="directVaultContainer">
        <p class="text-xs text-slate-500 text-center py-12">Loading saved layouts...</p>
      </div>
    </div>

    <!-- VIEW 3: CLAN RECRUITMENT HUB -->
    <div id="viewClansSection" class="hidden py-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 class="gaming-title text-3xl sm:text-5xl font-black text-white gold-gradient">Clan Showcase Hub</h2>
          <p class="text-sm text-slate-400 mt-2">Recruit top-tier war clashers or find your dream competitive clan.</p>
        </div>
        <button onclick="window.openModal('postClanModal')" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-neon-gold shrink-0 inline-flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Register Your Clan
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="clansContainer">
        <p class="text-xs text-slate-500 text-center py-12 col-span-full">Loading competitive clans...</p>
      </div>
    </div>

    <!-- VIEW 4: PRO PROFILE PAGE WITH NEW ADVANCED FEATURES -->
    <div id="viewProfileSection" class="hidden py-6 max-w-3xl mx-auto">
      
      <!-- Guest / Not Logged In State -->
      <div id="profileLoggedOutView" class="hidden glass-panel rounded-3xl p-8 text-center">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
          <i data-lucide="user-lock" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Chief Account Required</h3>
        <p class="text-xs text-slate-400 mb-6 max-w-sm mx-auto">Login karke apne uploads, saved layouts, followers aur live Supercell stats manage karein.</p>
        <button onclick="window.openModal('authModal')" class="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-neon-gold">
          Login / Register Now
        </button>
      </div>

      <!-- Logged In Profile Dashboard View -->
      <div id="profileLoggedInView" class="space-y-6">
        
        <!-- Top Profile Card -->
        <div class="glass-panel rounded-3xl p-6 sm:p-8 shadow-cyber-card border-amber-500/30">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-[2px] shadow-neon-gold shrink-0">
              <div class="w-full h-full bg-czDark rounded-[22px] flex items-center justify-center text-amber-400 text-4xl font-black">
                <span id="profileAvatarInitial">C</span>
              </div>
            </div>

            <div class="flex-1 text-center sm:text-left min-w-0 w-full">
              <div class="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-2">
                <h2 id="profileIGN" class="text-xl sm:text-2xl font-black text-white truncate">Chief Player</h2>
                <span id="profileTHBadge" class="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase">TH 16</span>
                <span id="profileVerifiedBadge" class="hidden bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase items-center gap-1">
                  <i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i> Verified
                </span>
              </div>

              <p id="profileTagClan" class="text-xs text-slate-400 mb-4 font-mono">Clan: Solo | #CLASH</p>

              <!-- Stats Counter Row -->
              <div class="flex items-center justify-center sm:justify-start gap-6 mb-4 bg-czDark/80 p-3.5 rounded-2xl border border-slate-800">
                <div class="text-center px-2">
                  <b id="statPostsCount" class="text-white text-base sm:text-lg font-black block">0</b>
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider">Posts</span>
                </div>
                <div class="w-[1px] h-8 bg-slate-800"></div>
                <div class="text-center px-2">
                  <b id="statFollowersCount" class="text-cyan-400 text-base sm:text-lg font-black block">0</b>
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider">Followers</span>
                </div>
                <div class="w-[1px] h-8 bg-slate-800"></div>
                <div class="text-center px-2">
                  <b id="statTrophiesCount" class="text-amber-400 text-base sm:text-lg font-black block">🏆 5000</b>
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider">Trophies</span>
                </div>
              </div>

              <!-- FEATURE 1: PRO BUILDER BADGE PROGRESS BAR -->
              <div class="bg-czDark p-3 rounded-2xl border border-slate-800 mb-5 text-xs">
                <div class="flex items-center justify-between mb-1.5 font-bold">
                  <span class="text-amber-400 flex items-center gap-1.5"><i data-lucide="award" class="w-3.5 h-3.5"></i> Pro Builder Badge Progress</span>
                  <span id="proBadgeProgressText" class="text-slate-400">0 / 10 Uploads</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div id="proBadgeProgressBar" class="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500" style="width: 0%;"></div>
                </div>
              </div>

              <!-- FEATURE 3: CREATOR SOCIAL LINKS -->
              <div class="flex items-center justify-center sm:justify-start gap-2.5 mb-5 flex-wrap">
                <a id="socialYtLink" href="#" target="_blank" class="hidden bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition hover:bg-red-500/25">
                  <i data-lucide="youtube" class="w-3.5 h-3.5"></i> YouTube
                </a>
                <a id="socialDcLink" href="#" target="_blank" class="hidden bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition hover:bg-indigo-500/25">
                  <i data-lucide="message-square" class="w-3.5 h-3.5"></i> Discord
                </a>
                <a id="socialIgLink" href="#" target="_blank" class="hidden bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition hover:bg-rose-500/25">
                  <i data-lucide="instagram" class="w-3.5 h-3.5"></i> Instagram
                </a>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-3">
                <button onclick="window.openModal('editProfileModal')" class="flex-1 bg-czDark hover:bg-slate-800 border border-amber-500/40 text-amber-400 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2">
                  <i data-lucide="user-pen" class="w-4 h-4"></i> Edit Profile & Sync
                </button>
                <button onclick="window.handleLogout()" class="px-4 py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-rose-400 rounded-xl transition text-xs font-bold" title="Logout">
                  <i data-lucide="power-off" class="w-4 h-4"></i>
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- Profile Tabbed Navigation -->
        <div class="flex items-center justify-center gap-2 bg-czDark p-1.5 rounded-2xl border border-slate-800">
          <button onclick="window.switchProfileTab('posts')" id="pTabPosts" class="profile-tab-btn active flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
            <i data-lucide="layout-grid" class="w-4 h-4"></i> My Posts (<span id="tabPostNum">0</span>)
          </button>
          <button onclick="window.switchProfileTab('saved')" id="pTabSaved" class="profile-tab-btn flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 transition flex items-center justify-center gap-2">
            <i data-lucide="bookmark" class="w-4 h-4"></i> Saved Vault
          </button>
          <button onclick="window.switchProfileTab('settings')" id="pTabSettings" class="profile-tab-btn flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 transition flex items-center justify-center gap-2">
            <i data-lucide="settings" class="w-4 h-4"></i> Settings
          </button>
        </div>

        <!-- Tab Content: Posts -->
        <div id="profileTabContentPosts" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>

        <!-- Tab Content: Saved Vault -->
        <div id="profileTabContentSaved" class="hidden space-y-3"></div>

        <!-- FEATURE 2: TAB CONTENT - IN-APP NOTIFICATION PREFERENCES / SETTINGS -->
        <div id="profileTabContentSettings" class="hidden glass-panel rounded-3xl p-6 space-y-4">
          <h4 class="text-sm font-bold text-amber-400 flex items-center gap-2">
            <i data-lucide="bell-ring" class="w-4 h-4"></i> Notification Preferences
          </h4>
          <p class="text-xs text-slate-400">Choose which alerts and notifications you want to receive on your account.</p>

          <div class="space-y-3 pt-2">
            <label class="flex items-center justify-between bg-czDark p-3.5 rounded-2xl border border-slate-800 cursor-pointer">
              <div class="flex items-center gap-3">
                <i data-lucide="heart" class="w-4 h-4 text-rose-500"></i>
                <div>
                  <b class="text-white text-xs block">Base Upvotes & Likes</b>
                  <span class="text-[10px] text-slate-400">Get notified when someone upvotes your layout.</span>
                </div>
              </div>
              <input type="checkbox" id="notifLikesToggle" onchange="window.saveNotificationPreferences()" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" checked />
            </label>

            <label class="flex items-center justify-between bg-czDark p-3.5 rounded-2xl border border-slate-800 cursor-pointer">
              <div class="flex items-center gap-3">
                <i data-lucide="message-square" class="w-4 h-4 text-cyan-400"></i>
                <div>
                  <b class="text-white text-xs block">Strategy Comments & Reviews</b>
                  <span class="text-[10px] text-slate-400">Alerts when players leave feedback on your bases.</span>
                </div>
              </div>
              <input type="checkbox" id="notifCommentsToggle" onchange="window.saveNotificationPreferences()" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" checked />
            </label>

            <label class="flex items-center justify-between bg-czDark p-3.5 rounded-2xl border border-slate-800 cursor-pointer">
              <div class="flex items-center gap-3">
                <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
                <div>
                  <b class="text-white text-xs block">New Followers</b>
                  <span class="text-[10px] text-slate-400">Get notified when a clasher starts following you.</span>
                </div>
              </div>
              <input type="checkbox" id="notifFollowersToggle" onchange="window.saveNotificationPreferences()" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" checked />
            </label>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- EDIT PROFILE & SOCIAL LINKS MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="editProfileModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 relative shadow-cyber-card my-auto max-h-[90vh] overflow-y-auto">
      <button onclick="window.closeModal('editProfileModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      
      <h3 class="gaming-title text-xl text-amber-400 flex items-center gap-2.5 mb-2">
        <i data-lucide="user-cog" class="w-6 h-6"></i> Edit Profile & Creator Links
      </h3>
      <p class="text-xs text-slate-400 mb-5">Update your in-game details and social channels.</p>

      <form onsubmit="window.handleSaveProfile(event)" class="space-y-4">
        <div class="bg-czDark p-4 rounded-2xl border border-amber-500/30">
          <label class="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
            <i data-lucide="zap" class="w-4 h-4"></i> Live Supercell Player Tag
          </label>
          <div class="flex gap-2">
            <input type="text" id="editTag" placeholder="#P9L80YQ2" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white uppercase outline-none focus:border-amber-400 font-mono font-bold" />
            <button type="button" id="btnSyncPlayerTag" onclick="window.handleLiveSupercellSync()" class="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 shadow-neon-gold">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              <span>Sync Live</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">In-Game Name (IGN)</label>
          <input type="text" id="editName" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 font-bold" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Town Hall Level</label>
            <input type="text" id="editTH" readonly class="w-full bg-czDark/60 border border-slate-700 rounded-xl p-3 text-xs text-amber-400 font-bold outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Trophies 🏆</label>
            <input type="number" id="editTrophies" readonly class="w-full bg-czDark/60 border border-slate-700 rounded-xl p-3 text-xs text-amber-400 font-bold outline-none" />
          </div>
        </div>

        <!-- Creator Social Links Input Fields -->
        <div class="space-y-3 pt-2 border-t border-slate-800">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Creator Social Channels</span>
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1"><i data-lucide="youtube" class="w-3.5 h-3.5 inline text-red-400 mr-1"></i> YouTube Channel URL</label>
            <input type="url" id="editYtLink" placeholder="https://youtube.com/@yourchannel" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1"><i data-lucide="message-square" class="w-3.5 h-3.5 inline text-indigo-400 mr-1"></i> Discord Invite URL</label>
            <input type="url" id="editDcLink" placeholder="https://discord.gg/yourserver" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1"><i data-lucide="instagram" class="w-3.5 h-3.5 inline text-rose-400 mr-1"></i> Instagram Profile URL</label>
            <input type="url" id="editIgLink" placeholder="https://instagram.com/yourhandle" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" />
          </div>
        </div>

        <button type="submit" id="btnSaveProfile" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-neon-gold mt-2">
          Save Verified Details
        </button>
      </form>
    </div>
  </div>

  <!-- PRO BUILDERS RANKINGS MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="rankingsModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 relative shadow-cyber-card my-auto max-h-[85vh] overflow-y-auto">
      <button onclick="window.closeModal('rankingsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      
      <h3 class="gaming-title text-xl text-amber-400 flex items-center gap-2.5 mb-1.5">
        <i data-lucide="trophy" class="w-6 h-6 text-amber-400"></i> Pro Builders Rankings
      </h3>
      <p class="text-xs text-slate-400 mb-5">Top verified layout architects ranked by follower count & active uploads.</p>

      <div class="space-y-3" id="rankingsListContainer">
        <p class="text-xs text-slate-500 text-center py-6">Calculating global builder rankings...</p>
      </div>
    </div>
  </div>

  <!-- NOTIFICATIONS MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="notificationsModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-md p-6 relative shadow-cyber-card my-auto">
      <button onclick="window.closeModal('notificationsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      
      <h3 class="gaming-title text-xl text-amber-400 flex items-center gap-2.5 mb-4">
        <i data-lucide="bell" class="w-6 h-6 text-amber-400"></i> ClashZone Site & User Alerts
      </h3>

      <div class="space-y-3 text-xs">
        <div class="bg-czDark p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
          <i data-lucide="shield-check" class="text-amber-400 w-5 h-5 shrink-0 mt-0.5"></i>
          <div>
            <b class="text-white block text-sm">Supercell API Verification Active</b>
            <span class="text-slate-400">Your player tag sync is active and creator watermark protection is enabled.</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PWA INSTALL GUIDE MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="pwaGuideModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-md p-6 relative shadow-cyber-card my-auto text-xs text-slate-300">
      <button onclick="window.closeModal('pwaGuideModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      
      <h3 class="gaming-title text-lg text-amber-400 flex items-center gap-2.5 mb-4">
        <i data-lucide="download" class="w-6 h-6"></i> Install ClashZone App
      </h3>

      <p class="mb-3.5 text-sm">Apne mobile par app ko home screen par add karne ke liye niche diye gaye steps follow karein:</p>
      
      <div class="space-y-3 bg-czDark p-4 rounded-2xl border border-slate-800 mb-5 text-sm">
        <div class="flex items-start gap-2.5">
          <b class="text-amber-400">1.</b>
          <span>Browser menu (<i data-lucide="more-vertical" class="w-4 h-4 inline"></i> ya <i data-lucide="share" class="w-4 h-4 inline"></i> icon) par tap karein.</span>
        </div>
        <div class="flex items-start gap-2.5">
          <b class="text-amber-400">2.</b>
          <span><b>"Add to Home Screen"</b> ya <b>"Install App"</b> option par click karein.</span>
        </div>
      </div>

      <button onclick="window.closeModal('pwaGuideModal')" class="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-neon-gold">
        Got It, Chief!
      </button>
    </div>
  </div>

  <!-- BOTTOM NAVIGATION BAR -->
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#03050b]/95 backdrop-blur-2xl border-t border-amber-500/30 px-3 py-2.5 w-full shadow-2xl">
    <div class="max-w-xl mx-auto flex items-center justify-between">
      
      <button onclick="window.switchMainHubView('feed')" id="bnavFeed" class="bnav-btn active flex-1 flex flex-col items-center gap-1 text-slate-400 text-center cursor-pointer">
        <i data-lucide="home" class="w-5 h-5"></i>
        <span class="text-[10px] font-bold tracking-wider">Feed</span>
        <span class="bnav-dot w-1.5 h-1.5 rounded-full bg-amber-400 shadow-neon-gold"></span>
      </button>

      <button onclick="window.switchMainHubView('vault')" id="bnavVault" class="bnav-btn flex-1 flex flex-col items-center gap-1 text-slate-400 text-center cursor-pointer">
        <i data-lucide="bookmark" class="w-5 h-5"></i>
        <span class="text-[10px] font-bold tracking-wider">Saved</span>
        <span class="bnav-dot w-1.5 h-1.5 rounded-full bg-amber-400 shadow-neon-gold"></span>
      </button>

      <div class="flex-1 flex justify-center -mt-7">
        <button onclick="window.openModal('uploadModal')" class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center text-xl font-black shadow-neon-gold border border-yellow-200/60 hover:scale-110 active:scale-90 transition transform">
          <i data-lucide="plus" class="w-7 h-7 stroke-[3]"></i>
        </button>
      </div>

      <button onclick="window.switchMainHubView('clans')" id="bnavClans" class="bnav-btn flex-1 flex flex-col items-center gap-1 text-slate-400 text-center cursor-pointer">
        <i data-lucide="shield" class="w-5 h-5"></i>
        <span class="text-[10px] font-bold tracking-wider">Clans</span>
        <span class="bnav-dot w-1.5 h-1.5 rounded-full bg-amber-400 shadow-neon-gold"></span>
      </button>

      <button onclick="window.switchMainHubView('profile')" id="bnavProfile" class="bnav-btn flex-1 flex flex-col items-center gap-1 text-slate-400 text-center cursor-pointer">
        <i data-lucide="user" class="w-5 h-5"></i>
        <span class="text-[10px] font-bold tracking-wider">Profile</span>
        <span class="bnav-dot w-1.5 h-1.5 rounded-full bg-amber-400 shadow-neon-gold"></span>
      </button>

    </div>
  </nav>

  <!-- BASE DETAILS MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="baseDetailsModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-2xl p-6 relative shadow-cyber-card my-auto max-h-[92vh] overflow-y-auto">
      <button onclick="window.closeModal('baseDetailsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center z-10">✕</button>

      <div class="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-czDark border border-slate-800 mb-4 group">
        <img id="modalBaseImg" src="" alt="Base Map Layout" class="w-full h-full object-cover" />
        <span id="modalBaseTH" class="absolute top-3 left-3 bg-czDark/95 text-amber-400 border border-amber-400/40 text-xs font-black px-3 py-1 rounded-xl backdrop-blur-md shadow-neon-gold"></span>
        <span id="modalBaseType" class="absolute top-3 right-3 bg-black/85 text-white text-xs font-bold px-3 py-1 rounded-xl border border-slate-700"></span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h2 id="modalBaseTitle" class="text-base sm:text-xl font-black text-white leading-snug"></h2>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span class="text-xs text-amber-400 font-bold" id="modalBaseUploader"></span>
            <span id="modalUploaderVerified" class="hidden bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase items-center gap-1">
              <i data-lucide="check-circle" class="w-3 h-3"></i> Supercell Verified
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="modalFollowBtn" class="px-4 py-2 rounded-xl text-xs font-bold transition"></button>
          <button id="modalBookmarkBtn" class="p-2.5 rounded-xl bg-czDark border border-slate-800 text-slate-400 hover:text-amber-400 transition text-sm">
            <i data-lucide="bookmark" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button id="modalCopyBaseBtn" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition shadow-neon-gold">
          <i data-lucide="copy" class="w-4 h-4"></i>
          <span>Copy In-Game Layout</span>
        </button>
      </div>
    </div>
  </div>

  <!-- UPLOAD BASE MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="uploadModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 relative shadow-cyber-card my-auto">
      <button onclick="window.closeModal('uploadModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      <h3 class="gaming-title text-xl text-amber-400 flex items-center gap-2.5 mb-1.5">
        <i data-lucide="cloud-upload" class="w-6 h-6 text-amber-400"></i> Upload Layout & Strategy
      </h3>
      <p class="text-xs text-slate-400 mb-4">Paste layout copy link for instant auto-detection & watermark protection.</p>

      <form onsubmit="window.handleBaseUpload(event)" class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-amber-400 mb-1">In-Game Copy Link</label>
          <input type="url" id="uploadLink" placeholder="https://link.clashofclans.com/en?action=OpenLayout..." required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Village Zone</label>
            <select id="uploadZone" onchange="window.updateUploadLevelOptions()" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none">
              <option value="home">Home Village</option>
              <option value="builder">Builder Base</option>
              <option value="capital">Clan Capital</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Level</label>
            <select id="uploadTH" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none"></select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Category</label>
          <select id="uploadType" class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none">
            <option>War</option>
            <option>Anti 3-Star</option>
            <option>Anti-Edrag</option>
            <option>Trophy</option>
            <option>Farming</option>
            <option>CWL</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Base Title</label>
          <input type="text" id="uploadTitle" placeholder="e.g. Unbeatable CWL Base" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Base Screenshot</label>
          <input type="file" id="uploadImageFile" accept="image/*" required class="w-full bg-czDark border border-slate-700 rounded-xl p-2 text-xs text-slate-300 outline-none file:mr-2 file:py-1 file:px-2 file:bg-amber-500 file:text-black file:font-bold file:rounded-lg" />
        </div>
        <button type="submit" id="submitBaseBtn" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-neon-gold">
          Publish Base
        </button>
      </form>
    </div>
  </div>

  <!-- AUTH MODAL -->
  <div class="fixed inset-0 bg-black/90 backdrop-blur-md hidden justify-center items-center p-4 z-50 overflow-y-auto" id="authModal">
    <div class="glass-panel border border-amber-500/40 rounded-3xl w-full max-w-md p-6 relative shadow-cyber-card my-auto">
      <button onclick="window.closeModal('authModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">✕</button>
      
      <div class="flex gap-2 mb-5 bg-czDark p-1.5 rounded-2xl">
        <button id="tabLoginBtn" onclick="window.switchAuthTab('login')" class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black transition">Login</button>
        <button id="tabSignupBtn" onclick="window.switchAuthTab('signup')" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 transition">Sign Up</button>
      </div>

      <form id="loginForm" onsubmit="window.handleEmailLogin(event)" class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
          <input type="email" id="loginEmail" placeholder="yourname@gmail.com" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Password</label>
          <input type="password" id="loginPass" placeholder="Enter password" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <button type="submit" class="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-neon-gold">
          Login to ClashZone
        </button>
      </form>

      <form id="signupForm" onsubmit="window.handleEmailSignup(event)" class="space-y-3.5 hidden">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Player Tag (With #)</label>
          <input type="text" id="signupTag" placeholder="#P9L80YQ2" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white uppercase outline-none font-mono" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">In-Game Name (IGN)</label>
          <input type="text" id="signupName" placeholder="Chief Name" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
          <input type="email" id="signupEmail" placeholder="yourname@gmail.com" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Set Password</label>
          <input type="password" id="signupPass" placeholder="Min 6 characters" required class="w-full bg-czDark border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
        </div>
        <button type="submit" class="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-neon-gold">
          Create Account
        </button>
      </form>
    </div>
  </div>

  <script>
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    window.triggerPermanentAppInstall = async function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          window.showToast("⚡ ClashZone successfully installed!");
        }
        deferredPrompt = null;
      } else {
        window.openModal('pwaGuideModal');
      }
    };

    window.switchProfileTab = function(tabName) {
      ['Posts', 'Saved', 'Settings'].forEach(t => {
        const btn = document.getElementById(`pTab${t}`);
        const content = document.getElementById(`profileTabContent${t}`);
        if (btn) btn.classList.toggle('active', t.toLowerCase() === tabName.toLowerCase());
        if (content) content.classList.toggle('hidden', t.toLowerCase() !== tabName.toLowerCase());
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.saveNotificationPreferences = function() {
      const prefs = {
        likes: document.getElementById('notifLikesToggle').checked,
        comments: document.getElementById('notifCommentsToggle').checked,
        followers: document.getElementById('notifFollowersToggle').checked
      };
      localStorage.setItem('cz_notif_prefs', JSON.stringify(prefs));
      window.showToast("Notification settings updated!");
    };
  </script>
  <script type="module" src="app.js"></script>
</body>
</html>