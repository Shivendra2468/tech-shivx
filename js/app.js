/**
 * TECH SHIVX — MAIN APPLICATION CONTROLLER
 * Handles UI interactions, rendering, search, filters, protected downloads, auth modals, and newsletter
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.vaultStorage.init();
    await window.vaultStorage.recordPageView();
    await applySiteSettings();
    await refreshAllSections();
  } catch (err) {
    console.error('Error initializing vault storage:', err);
    showToast('Storage initialization failed', 'error');
  }

  // Event Listeners
  setupAudioControls();
  setupNavigation();
  setupMobileDrawer();
  setupAuthModal();
  setupNewsletterForm();
  setupFiltersAndSearch();
  setupStudioModal();
  setupVideoPlayerModal();
  setupLightboxModal();
  setupDropzones();
  setup3DTilt();
});

/* ==========================================================================
   DYNAMIC SITE SETTINGS (From Admin Panel)
   ========================================================================== */
async function applySiteSettings() {
  const heroTitle = await window.vaultStorage.getSetting('heroTitle');
  const heroSubtitle = await window.vaultStorage.getSetting('heroSubtitle');
  const announcement = await window.vaultStorage.getSetting('announcement');
  const adsEnabled = await window.vaultStorage.getSetting('adsEnabled');

  // Load Social Links
  const socialYT = await window.vaultStorage.getSetting('social_youtube');
  const socialIG = await window.vaultStorage.getSetting('social_instagram');
  const socialTW = await window.vaultStorage.getSetting('social_twitter');
  const socialTG = await window.vaultStorage.getSetting('social_telegram');
  const socialWA = await window.vaultStorage.getSetting('social_whatsapp');
  const socialDC = await window.vaultStorage.getSetting('social_discord');

  if (heroTitle && document.getElementById('hero-main-title')) {
    document.getElementById('hero-main-title').innerHTML = heroTitle;
  }

  if (heroSubtitle && document.getElementById('hero-main-subtitle')) {
    document.getElementById('hero-main-subtitle').textContent = heroSubtitle;
  }

  if (announcement && document.getElementById('top-announcement-text')) {
    document.getElementById('top-announcement-text').textContent = announcement;
  }

  // Handle Monetization / AdSense Display
  const adSlots = document.querySelectorAll('.ad-slot-wrapper');
  adSlots.forEach(slot => {
    slot.style.display = (adsEnabled === 'false') ? 'none' : 'block';
  });

  // Apply Social Media Links
  updateSocialLink('social-link-youtube', socialYT || 'https://youtube.com');
  updateSocialLink('social-link-instagram', socialIG || 'https://instagram.com');
  updateSocialLink('social-link-twitter', socialTW || 'https://x.com');
  updateSocialLink('social-link-telegram', socialTG || 'https://t.me');
  updateSocialLink('social-link-whatsapp', socialWA || 'https://wa.me/');
  updateSocialLink('social-link-discord', socialDC || 'https://discord.com');
}

function updateSocialLink(id, url) {
  const elements = document.querySelectorAll(`.${id}, #${id}`);
  elements.forEach(el => {
    el.href = url;
  });
}

/* ==========================================================================
   DATA REFRESH & RENDERING
   ========================================================================== */
async function refreshAllSections() {
  await Promise.all([
    renderVideos(),
    renderPhotos(),
    renderApps(),
    renderFiles(),
    updateHUDStats()
  ]);
}

async function updateHUDStats() {
  const [videos, photos, apps, files] = await Promise.all([
    window.vaultStorage.getAll('videos'),
    window.vaultStorage.getAll('photos'),
    window.vaultStorage.getAll('apps'),
    window.vaultStorage.getAll('files')
  ]);

  const statVideos = document.getElementById('stat-videos-count');
  const statPhotos = document.getElementById('stat-photos-count');
  const statApps = document.getElementById('stat-apps-count');
  const statFiles = document.getElementById('stat-files-count');

  if (statVideos) animateCounter(statVideos, videos.length);
  if (statPhotos) animateCounter(statPhotos, photos.length);
  if (statApps) animateCounter(statApps, apps.length);
  if (statFiles) animateCounter(statFiles, files.length);
}

function animateCounter(el, target) {
  let count = 0;
  const step = Math.max(1, Math.floor(target / 15));
  const timer = setInterval(() => {
    count += step;
    if (count >= target) {
      count = target;
      clearInterval(timer);
    }
    el.textContent = count;
  }, 25);
}

/* ==========================================================================
   SECTION 1: YOUTUBE VIDEOS RENDERING
   ========================================================================== */
let currentVideoFilter = 'all';
let currentVideoSearch = '';

async function renderVideos() {
  const container = document.getElementById('videos-container');
  if (!container) return;

  const allVideos = await window.vaultStorage.getAll('videos');
  
  const filtered = allVideos.filter(v => {
    const matchesFilter = currentVideoFilter === 'all' || 
      (v.category && v.category.toLowerCase().includes(currentVideoFilter.toLowerCase()));
    const matchesSearch = !currentVideoSearch || 
      v.title.toLowerCase().includes(currentVideoSearch.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(currentVideoSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  let html = `
    <div class="add-new-card" onclick="openStudioTab('tab-video')">
      <div class="add-plus-icon"><i class="ph ph-plus"></i></div>
      <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: #fff; margin-bottom: 6px;">Add YouTube Video</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Paste YouTube URL or ID to embed instantly</p>
    </div>
  `;

  filtered.forEach(video => {
    html += `
      <div class="video-card tilt-card" data-id="${video.id}">
        <div class="video-thumb-wrap" onclick="playVideo('${escapeHtml(video.youtubeId || '')}', '${escapeHtml(video.title)}')">
          <img class="video-thumb" src="${video.thumbnail || 'assets/images/cyber_purple_core.jpg'}" alt="${escapeHtml(video.title)}" loading="lazy">
          <div class="video-play-overlay">
            <div class="play-button-glow">
              <i class="ph ph-play-fill"></i>
            </div>
          </div>
          <span class="video-duration">${video.duration || 'HD'}</span>
        </div>
        <div class="video-card-body">
          <span class="video-category-tag">${escapeHtml(video.category || 'Video')}</span>
          <h4 class="video-card-title" onclick="playVideo('${escapeHtml(video.youtubeId || '')}', '${escapeHtml(video.title)}')">${escapeHtml(video.title)}</h4>
          <p class="video-card-desc">${escapeHtml(video.description || 'No description provided.')}</p>
          <div class="video-card-footer">
            <span><i class="ph ph-eye" style="margin-right: 4px;"></i>${video.views || '1.2K views'}</span>
            <div class="card-actions-row">
              <button class="card-action-btn" title="Copy Link" onclick="copyToClipboard('${escapeHtml(video.youtubeUrl)}')"><i class="ph ph-link"></i></button>
              ${!video.isDefault ? `<button class="card-action-btn" title="Delete Video" onclick="deleteItem('videos', ${video.id})"><i class="ph ph-trash"></i></button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  setup3DTilt();
}

/* ==========================================================================
   SECTION 2: PHOTOS & WALLPAPERS RENDERING
   ========================================================================== */
let currentPhotoFilter = 'all';
let currentPhotoSearch = '';

async function renderPhotos() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  const allPhotos = await window.vaultStorage.getAll('photos');

  const filtered = allPhotos.filter(p => {
    const matchesFilter = currentPhotoFilter === 'all' || 
      (p.category && p.category.toLowerCase().includes(currentPhotoFilter.toLowerCase()));
    const matchesSearch = !currentPhotoSearch || 
      p.title.toLowerCase().includes(currentPhotoSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  let html = `
    <div class="add-new-card" onclick="openStudioTab('tab-photo')">
      <div class="add-plus-icon"><i class="ph ph-image-square"></i></div>
      <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: #fff; margin-bottom: 6px;">Upload Picture</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Add high-res wallpaper or photo</p>
    </div>
  `;

  filtered.forEach(photo => {
    html += `
      <div class="gallery-card tilt-card" onclick="openLightbox('${photo.imageUrl}', '${escapeHtml(photo.title)}', '${escapeHtml(photo.category || '')}')">
        <img class="gallery-img" src="${photo.imageUrl}" alt="${escapeHtml(photo.title)}" loading="lazy">
        <div class="gallery-overlay">
          <h4 class="gallery-title">${escapeHtml(photo.title)}</h4>
          <div class="gallery-meta">
            <span>${escapeHtml(photo.category || 'Gallery')}</span>
            ${!photo.isDefault ? `<button class="card-action-btn" style="color: #fff;" onclick="event.stopPropagation(); deleteItem('photos', ${photo.id})"><i class="ph ph-trash"></i></button>` : '<span><i class="ph ph-arrows-out-simple"></i> View</span>'}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  setup3DTilt();
}

/* ==========================================================================
   SECTION 3: APPS SHOWCASE RENDERING (With Protected Downloads)
   ========================================================================== */
let currentAppFilter = 'all';
let currentAppSearch = '';

async function renderApps() {
  const container = document.getElementById('apps-container');
  if (!container) return;

  const allApps = await window.vaultStorage.getAll('apps');

  const filtered = allApps.filter(a => {
    const matchesFilter = currentAppFilter === 'all' || 
      (a.platform && a.platform.toLowerCase().includes(currentAppFilter.toLowerCase()));
    const matchesSearch = !currentAppSearch || 
      a.name.toLowerCase().includes(currentAppSearch.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(currentAppSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  let html = `
    <div class="add-new-card" onclick="openStudioTab('tab-app')">
      <div class="add-plus-icon"><i class="ph ph-rocket-launch"></i></div>
      <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: #fff; margin-bottom: 6px;">Add New Software</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Showcase web app, desktop exe, or script</p>
    </div>
  `;

  filtered.forEach(app => {
    const featuresList = (app.features || []).map(f => `
      <li class="app-feature-item">
        <i class="ph ph-check-circle-fill"></i>
        <span>${escapeHtml(f)}</span>
      </li>
    `).join('');

    const iconHtml = app.iconUrl 
      ? `<img src="${app.iconUrl}" alt="${escapeHtml(app.name)}">`
      : `<i class="ph ${app.icon || 'ph-terminal-window'}"></i>`;

    html += `
      <div class="app-card tilt-card" data-id="${app.id}">
        <div class="app-card-top">
          <div class="app-icon-wrap">${iconHtml}</div>
          <div class="app-header-info">
            <h4 class="app-name">${escapeHtml(app.name)}</h4>
            <div>
              <span class="app-platform-badge">${escapeHtml(app.platform || 'App')}</span>
              <span class="app-version-badge">${escapeHtml(app.version || 'v1.0')}</span>
            </div>
          </div>
          ${!app.isDefault ? `
            <button class="card-action-btn" title="Delete App" onclick="deleteItem('apps', ${app.id})">
              <i class="ph ph-trash"></i>
            </button>
          ` : ''}
        </div>
        <p class="app-desc">${escapeHtml(app.description || 'No description.')}</p>
        <ul class="app-features-list">
          ${featuresList}
        </ul>
        <div class="app-card-actions">
          <button class="btn-app-download" onclick="triggerProtectedAppDownload('${escapeHtml(app.name)}', '${app.downloadUrl || '#'}')">
            <i class="ph ph-download-simple"></i> Download App
          </button>
          ${app.demoUrl && app.demoUrl !== '#' ? `
            <a href="${app.demoUrl}" target="_blank" class="btn-app-demo">
              <i class="ph ph-arrow-square-out"></i> Live Demo
            </a>
          ` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  setup3DTilt();
}

function triggerProtectedAppDownload(appName, downloadUrl) {
  window.authManager.requireAuthForDownload(() => {
    if (downloadUrl && downloadUrl !== '#') {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = appName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    showToast(`Downloading "${appName}" successfully!`);
  }, appName, 'App');
}

/* ==========================================================================
   SECTION 4: FILES VAULT RENDERING (With Protected Downloads)
   ========================================================================== */
let currentFileSearch = '';

async function renderFiles() {
  const tbody = document.getElementById('files-table-body');
  if (!tbody) return;

  const allFiles = await window.vaultStorage.getAll('files');

  const filtered = allFiles.filter(f => {
    return !currentFileSearch || 
      f.name.toLowerCase().includes(currentFileSearch.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(currentFileSearch.toLowerCase()));
  });

  let html = '';

  filtered.forEach(file => {
    let iconClass = 'ph-file-archive';
    if (file.extension === 'PDF') iconClass = 'ph-file-pdf';
    else if (['EXE', 'MSI'].includes(file.extension)) iconClass = 'ph-cpu';
    else if (['APK'].includes(file.extension)) iconClass = 'ph-device-mobile';
    else if (['PNG', 'JPG', 'WEBP'].includes(file.extension)) iconClass = 'ph-image';
    else if (['JS', 'PY', 'HTML', 'CSS'].includes(file.extension)) iconClass = 'ph-code';

    html += `
      <tr>
        <td>
          <div class="file-name-cell">
            <div class="file-type-icon"><i class="ph ${iconClass}"></i></div>
            <div>
              <div>${escapeHtml(file.name)}</div>
              <small style="color: var(--text-muted); font-size: 0.78rem;">${escapeHtml(file.description || '')}</small>
            </div>
          </div>
        </td>
        <td><span class="file-badge-ext">${escapeHtml(file.extension || 'FILE')}</span></td>
        <td style="font-family: var(--font-mono); color: var(--purple-bright);">${escapeHtml(file.size || 'Unknown')}</td>
        <td style="color: var(--text-muted);">${escapeHtml(file.date || 'Recent')}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-file-download" onclick="triggerProtectedFileDownload(${file.id})">
              <i class="ph ph-download-simple"></i> Download
            </button>
            ${!file.isDefault ? `
              <button class="card-action-btn" title="Delete File" onclick="deleteItem('files', ${file.id})">
                <i class="ph ph-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  if (filtered.length === 0) {
    html = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No files found matching criteria. Drag and drop a file above to add it to the vault!</td></tr>`;
  }

  tbody.innerHTML = html;
}

async function triggerProtectedFileDownload(fileId) {
  const files = await window.vaultStorage.getAll('files');
  const file = files.find(f => f.id === fileId);
  if (!file) return;

  window.authManager.requireAuthForDownload(() => {
    const a = document.createElement('a');
    a.href = file.fileDataUrl || file.downloadUrl || '#';
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading file: ${file.name}`);
  }, file.name, 'File');
}

/* ==========================================================================
   USER AUTH MODAL CONTROLLER
   ========================================================================== */
function setupAuthModal() {
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('close-auth-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  const googleModal = document.getElementById('google-oauth-modal');
  if (googleModal) {
    googleModal.addEventListener('click', (e) => {
      if (e.target === googleModal) {
        window.authManager.closeGoogleModal();
      }
    });
  }

  // Switch between Login and Register Tabs
  const tabLogin = document.getElementById('tab-btn-auth-login');
  const tabRegister = document.getElementById('tab-btn-auth-register');
  const paneLogin = document.getElementById('auth-pane-login');
  const paneRegister = document.getElementById('auth-pane-register');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      paneLogin.style.display = 'block';
      paneRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      paneRegister.style.display = 'block';
      paneLogin.style.display = 'none';
    });
  }

  // Login Form Submit
  const formLogin = document.getElementById('form-auth-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email-input').value;
      const pass = document.getElementById('login-password-input').value;
      try {
        await window.authManager.login(email, pass);
        modal.classList.remove('active');
        showToast(`Welcome back, ${email}!`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Register Form Submit
  const formRegister = document.getElementById('form-auth-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name-input').value;
      const email = document.getElementById('register-email-input').value;
      const pass = document.getElementById('register-password-input').value;
      try {
        await window.authManager.register(name, email, pass);
        modal.classList.remove('active');
        showToast(`Account created! Welcome to TECH SHIVX, ${name}!`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

/* ==========================================================================
   EMAIL NEWSLETTER SUBSCRIPTION
   ========================================================================== */
function setupNewsletterForm() {
  const form = document.getElementById('newsletter-subscribe-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletter-email-input');
    const email = input.value.trim();

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    await window.authManager.addSubscriber(email, 'Subscriber', 'Newsletter');
    input.value = '';
    showToast('Subscribed to TECH SHIVX dispatch successfully!');
    if (window.cyberAudio) window.cyberAudio.playSuccessChime();
  });
}

/* ==========================================================================
   MOBILE DRAWER CONTROLLER
   ========================================================================== */
function setupMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('close-drawer-btn');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => drawer.classList.add('open'));
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
  }

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => drawer.classList.remove('open'));
  });
}

/* ==========================================================================
   DELETE HANDLER
   ========================================================================== */
async function deleteItem(storeName, id) {
  if (confirm('Are you sure you want to remove this item from your vault?')) {
    await window.vaultStorage.delete(storeName, id);
    showToast('Item deleted successfully', 'info');
    await refreshAllSections();
  }
}

/* ==========================================================================
   NAVIGATION & AUDIO CONTROLS
   ========================================================================== */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isSoundOn = window.cyberAudio.toggleSound();
      audioBtn.classList.toggle('sound-active', isSoundOn);
      audioBtn.innerHTML = isSoundOn 
        ? '<i class="ph ph-speaker-high" style="color: var(--neon-cyan);"></i>' 
        : '<i class="ph ph-speaker-slash"></i>';
      showToast(isSoundOn ? 'Cyber Audio Synthesizer: ACTIVE' : 'Audio Muted', 'info');
    });
  }
}

function setupAudioControls() {
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, .btn-primary, .btn-secondary, .nav-link, .video-card, .gallery-card, .app-card')) {
      if (window.cyberAudio) window.cyberAudio.playHoverSound();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('button, .btn-primary, .btn-secondary, .filter-btn')) {
      if (window.cyberAudio) window.cyberAudio.playClickSound();
    }
  });
}

function setupFiltersAndSearch() {
  // Video Filters
  document.querySelectorAll('[data-video-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-video-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVideoFilter = btn.getAttribute('data-video-filter');
      renderVideos();
    });
  });

  const searchVideos = document.getElementById('search-videos');
  if (searchVideos) {
    searchVideos.addEventListener('input', (e) => {
      currentVideoSearch = e.target.value.trim();
      renderVideos();
    });
  }

  // Photo Filters
  document.querySelectorAll('[data-photo-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-photo-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPhotoFilter = btn.getAttribute('data-photo-filter');
      renderPhotos();
    });
  });

  const searchPhotos = document.getElementById('search-photos');
  if (searchPhotos) {
    searchPhotos.addEventListener('input', (e) => {
      currentPhotoSearch = e.target.value.trim();
      renderPhotos();
    });
  }

  // App Filters
  document.querySelectorAll('[data-app-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-app-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAppFilter = btn.getAttribute('data-app-filter');
      renderApps();
    });
  });

  const searchApps = document.getElementById('search-apps');
  if (searchApps) {
    searchApps.addEventListener('input', (e) => {
      currentAppSearch = e.target.value.trim();
      renderApps();
    });
  }

  // File Search
  const searchFiles = document.getElementById('search-files');
  if (searchFiles) {
    searchFiles.addEventListener('input', (e) => {
      currentFileSearch = e.target.value.trim();
      renderFiles();
    });
  }
}

/* ==========================================================================
   CREATOR STUDIO MODAL & FORMS
   ========================================================================== */
function setupStudioModal() {
  const modal = document.getElementById('studio-modal');
  const openButtons = document.querySelectorAll('.open-studio-btn, .fab-studio');
  const closeBtn = document.getElementById('close-studio-btn');

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('active');
      if (window.cyberAudio) window.cyberAudio.playSuccessChime();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  const tabBtns = document.querySelectorAll('.studio-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Video Form
  const formVideo = document.getElementById('form-add-video');
  if (formVideo) {
    formVideo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('video-title-input').value.trim();
      const url = document.getElementById('video-url-input').value.trim();
      const category = document.getElementById('video-category-select').value;
      const duration = document.getElementById('video-duration-input').value.trim() || 'HD';
      const desc = document.getElementById('video-desc-input').value.trim();

      const videoId = extractYouTubeID(url);
      if (!videoId) {
        showToast('Please enter a valid YouTube URL or video ID', 'error');
        return;
      }

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      await window.vaultStorage.add('videos', {
        title,
        youtubeUrl: url,
        youtubeId: videoId,
        thumbnail,
        category,
        duration,
        description: desc,
        views: '1',
        date: 'Just now'
      });

      formVideo.reset();
      modal.classList.remove('active');
      showToast('YouTube Video added to vault!');
      await refreshAllSections();
    });
  }

  // Photo Form
  const formPhoto = document.getElementById('form-add-photo');
  if (formPhoto) {
    formPhoto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('photo-title-input').value.trim();
      const category = document.getElementById('photo-category-select').value;
      const fileInput = document.getElementById('photo-file-input');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please choose an image file to upload', 'error');
        return;
      }

      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target.result;
        await window.vaultStorage.add('photos', {
          title,
          category,
          imageUrl,
          date: 'Sep 2026'
        });

        formPhoto.reset();
        modal.classList.remove('active');
        showToast('Picture uploaded to vault!');
        await refreshAllSections();
      };
      reader.readAsDataURL(file);
    });
  }

  // App Form
  const formApp = document.getElementById('form-add-app');
  if (formApp) {
    formApp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('app-name-input').value.trim();
      const version = document.getElementById('app-version-input').value.trim() || 'v1.0';
      const platform = document.getElementById('app-platform-select').value;
      const downloadUrl = document.getElementById('app-download-input').value.trim() || '#';
      const demoUrl = document.getElementById('app-demo-input').value.trim() || '#';
      const desc = document.getElementById('app-desc-input').value.trim();
      const featuresRaw = document.getElementById('app-features-input').value.trim();
      const features = featuresRaw ? featuresRaw.split(',').map(s => s.trim()) : ['High Performance', 'Futuristic UI'];

      await window.vaultStorage.add('apps', {
        name,
        version,
        platform,
        icon: 'ph-app-window',
        description: desc,
        features,
        downloadUrl,
        demoUrl,
        downloads: '1'
      });

      formApp.reset();
      modal.classList.remove('active');
      showToast('App added to software repository!');
      await refreshAllSections();
    });
  }

  // File Form
  const formFile = document.getElementById('form-add-file');
  if (formFile) {
    formFile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('file-upload-input');
      const desc = document.getElementById('file-desc-input').value.trim();

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a file to store', 'error');
        return;
      }

      const file = fileInput.files[0];
      await handleFileUpload(file, desc);
      formFile.reset();
      modal.classList.remove('active');
    });
  }

  // Backup Export/Import
  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      const json = await window.vaultStorage.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TechShivx_Vault_Backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Vault backup exported successfully!');
    });
  }

  const inputImport = document.getElementById('input-import-backup');
  if (inputImport) {
    inputImport.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        await window.vaultStorage.importAll(text);
        showToast('Backup imported successfully!');
        await refreshAllSections();
      } catch (err) {
        showToast('Invalid backup file format', 'error');
      }
    });
  }
}

function openStudioTab(tabId) {
  const modal = document.getElementById('studio-modal');
  modal.classList.add('active');
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

/* ==========================================================================
   DROPZONE & FILE PROCESSING
   ========================================================================== */
function setupDropzones() {
  const dropzone = document.getElementById('main-file-dropzone');
  const fileInput = document.getElementById('direct-file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await handleFileUpload(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', async (e) => {
      if (e.dataTransfer.files.length > 0) {
        await handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }
}

async function handleFileUpload(file, description = '') {
  const extension = file.name.split('.').pop().toUpperCase();
  const sizeString = formatBytes(file.size);

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    await window.vaultStorage.add('files', {
      name: file.name,
      extension: extension,
      size: sizeString,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      downloads: 0,
      description: description || `Uploaded ${extension} file`,
      fileDataUrl: dataUrl
    });

    showToast(`File "${file.name}" saved to vault!`);
    await refreshAllSections();
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   YOUTUBE PLAYER & LIGHTBOX MODALS
   ========================================================================== */
function setupVideoPlayerModal() {
  const modal = document.getElementById('video-player-modal');
  const closeBtn = document.getElementById('close-video-modal');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      const frame = document.getElementById('youtube-iframe');
      if (frame) frame.src = '';
    });
  }

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      const frame = document.getElementById('youtube-iframe');
      if (frame) frame.src = '';
    }
  });
}

function playVideo(youtubeId, title) {
  const modal = document.getElementById('video-player-modal');
  const frame = document.getElementById('youtube-iframe');
  const titleEl = document.getElementById('video-modal-title');

  if (!modal || !frame) return;

  if (titleEl) titleEl.textContent = title;
  frame.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`;
  modal.classList.add('active');
}

function setupLightboxModal() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('close-lightbox-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

function openLightbox(imageUrl, title, category) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-title');
  const cat = document.getElementById('lightbox-category');
  const downloadLink = document.getElementById('lightbox-download');

  if (!modal || !img) return;

  img.src = imageUrl;
  if (caption) caption.textContent = title;
  if (cat) cat.textContent = category;
  if (downloadLink) {
    downloadLink.href = imageUrl;
    downloadLink.download = `${title.replace(/\s+/g, '_')}.jpg`;
  }

  modal.classList.add('active');
}

/* ==========================================================================
   3D CARD TILT EFFECT
   ========================================================================== */
function setup3DTilt() {
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0deg)';
    });
  });
}

/* ==========================================================================
   HELPERS & TOAST
   ========================================================================== */
function extractYouTubeID(url) {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy link', 'error');
  });
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `cyber-toast ${type === 'error' ? 'toast-error' : ''}`;
  const icon = type === 'error' ? 'ph-warning-circle' : 'ph-check-circle-fill';

  toast.innerHTML = `
    <i class="ph ${icon}" style="font-size: 1.25rem; color: ${type === 'error' ? '#f43f5e' : 'var(--purple-bright)'};"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// Global exposes
window.playVideo = playVideo;
window.openLightbox = openLightbox;
window.deleteItem = deleteItem;
window.copyToClipboard = copyToClipboard;
window.openStudioTab = openStudioTab;
window.triggerProtectedAppDownload = triggerProtectedAppDownload;
window.triggerProtectedFileDownload = triggerProtectedFileDownload;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
