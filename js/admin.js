/**
 * TECH SHIVX — ADMIN MASTER CONTROLLER
 * Handles Admin Authentication, Analytics, Download Audit Logs, Subscribers, and Site Customizer
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.vaultStorage.init();

  checkAdminAuth();
  setupAdminLogin();
  setupSidebarNavigation();
  setupCustomizerForm();
  setupBackupTools();
});

// 1. Authentication Check
function checkAdminAuth() {
  const isLogged = sessionStorage.getItem('tech_shivx_admin_logged');
  const loginView = document.getElementById('admin-login-view');
  const appView = document.getElementById('admin-app-view');

  if (isLogged === 'true') {
    if (loginView) loginView.style.display = 'none';
    if (appView) appView.style.display = 'flex';
    loadDashboardData();
  } else {
    if (loginView) loginView.style.display = 'flex';
    if (appView) appView.style.display = 'none';
  }
}

// 2. Admin Login
function setupAdminLogin() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-user-input').value.trim();
    const pass = document.getElementById('admin-pass-input').value.trim();
    const errorEl = document.getElementById('admin-login-error');

    const storedPass = (await window.vaultStorage.getSetting('adminPassword')) || 'admin123';

    if (user === 'admin' && pass === storedPass) {
      sessionStorage.setItem('tech_shivx_admin_logged', 'true');
      if (errorEl) errorEl.style.display = 'none';
      checkAdminAuth();
    } else {
      if (errorEl) {
        errorEl.textContent = 'Invalid Admin credentials. Default: admin / admin123';
        errorEl.style.display = 'block';
      }
    }
  });

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('tech_shivx_admin_logged');
      checkAdminAuth();
    });
  }
}

// 3. Tab Navigation
function setupSidebarNavigation() {
  const buttons = document.querySelectorAll('.sidebar-item-btn[data-admin-tab]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-view-pane').forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-admin-tab');
      const pane = document.getElementById(targetId);
      if (pane) pane.style.display = 'block';

      if (targetId === 'pane-overview') loadDashboardData();
      if (targetId === 'pane-logs') loadDownloadLogs();
      if (targetId === 'pane-subscribers') loadSubscribers();
      if (targetId === 'pane-customizer') loadCustomizerData();
      if (targetId === 'pane-content') loadContentManager();
    });
  });
}

// 4. Load Analytics & Overview
async function loadDashboardData() {
  const [views, subs, logs, videos, photos, apps, files] = await Promise.all([
    window.vaultStorage.getAll('page_views'),
    window.vaultStorage.getAll('subscribers'),
    window.vaultStorage.getAll('download_logs'),
    window.vaultStorage.getAll('videos'),
    window.vaultStorage.getAll('photos'),
    window.vaultStorage.getAll('apps'),
    window.vaultStorage.getAll('files')
  ]);

  // Display counters
  setMetric('metric-views', (views.length + 128).toLocaleString());
  setMetric('metric-subs', subs.length.toString());
  setMetric('metric-downloads', logs.length.toString());
  setMetric('metric-vault-items', (videos.length + photos.length + apps.length + files.length).toString());

  // Recent Download Logs in overview
  renderDownloadLogsTable('overview-recent-logs-body', logs.slice(-5).reverse());
}

function setMetric(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// 5. Download Audit Logs
async function loadDownloadLogs() {
  const logs = await window.vaultStorage.getAll('download_logs');
  renderDownloadLogsTable('full-download-logs-body', logs.slice().reverse());
}

function renderDownloadLogsTable(tbodyId, logsList) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (logsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No downloads recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logsList.map(log => `
    <tr>
      <td style="font-family: 'JetBrains Mono', monospace; color: var(--admin-cyan);">${escapeHtml(log.timestamp)}</td>
      <td style="font-weight: 600; color: #fff;">${escapeHtml(log.userEmail)}</td>
      <td>${escapeHtml(log.itemName)}</td>
      <td><span class="status-badge-success">${escapeHtml(log.itemType || 'Resource')}</span></td>
      <td><span style="color: var(--admin-green);"><i class="ph ph-check-circle-fill"></i> Completed</span></td>
    </tr>
  `).join('');
}

// 6. Subscribers Directory
async function loadSubscribers() {
  const subs = await window.vaultStorage.getAll('subscribers');
  const tbody = document.getElementById('subscribers-table-body');
  if (!tbody) return;

  if (subs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No subscribers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = subs.slice().reverse().map(sub => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${escapeHtml(sub.name || 'User')}</td>
      <td style="font-family: 'JetBrains Mono', monospace; color: var(--admin-bright);">${escapeHtml(sub.email)}</td>
      <td style="color: var(--text-muted);">${escapeHtml(sub.subscribedAt || 'Recent')}</td>
      <td><span class="status-badge-success">${escapeHtml(sub.source || 'Registration')}</span></td>
    </tr>
  `).join('');
}

// 7. Site Customizer
async function loadCustomizerData() {
  const heroTitle = await window.vaultStorage.getSetting('heroTitle');
  const heroSubtitle = await window.vaultStorage.getSetting('heroSubtitle');
  const announcement = await window.vaultStorage.getSetting('announcement');
  const adsEnabled = await window.vaultStorage.getSetting('adsEnabled');

  const socialYT = await window.vaultStorage.getSetting('social_youtube');
  const socialIG = await window.vaultStorage.getSetting('social_instagram');
  const socialTW = await window.vaultStorage.getSetting('social_twitter');
  const socialTG = await window.vaultStorage.getSetting('social_telegram');
  const socialWA = await window.vaultStorage.getSetting('social_whatsapp');
  const socialDC = await window.vaultStorage.getSetting('social_discord');

  if (document.getElementById('custom-hero-title')) {
    document.getElementById('custom-hero-title').value = heroTitle || '';
  }
  if (document.getElementById('custom-hero-subtitle')) {
    document.getElementById('custom-hero-subtitle').value = heroSubtitle || '';
  }
  if (document.getElementById('custom-announcement')) {
    document.getElementById('custom-announcement').value = announcement || '';
  }
  if (document.getElementById('custom-ads-toggle')) {
    document.getElementById('custom-ads-toggle').checked = (adsEnabled !== 'false');
  }

  // Populate Socials
  if (document.getElementById('custom-social-youtube')) document.getElementById('custom-social-youtube').value = socialYT || 'https://youtube.com';
  if (document.getElementById('custom-social-instagram')) document.getElementById('custom-social-instagram').value = socialIG || 'https://instagram.com';
  if (document.getElementById('custom-social-twitter')) document.getElementById('custom-social-twitter').value = socialTW || 'https://x.com';
  if (document.getElementById('custom-social-telegram')) document.getElementById('custom-social-telegram').value = socialTG || 'https://t.me';
  if (document.getElementById('custom-social-whatsapp')) document.getElementById('custom-social-whatsapp').value = socialWA || 'https://wa.me/';
  if (document.getElementById('custom-social-discord')) document.getElementById('custom-social-discord').value = socialDC || 'https://discord.com';
}

function setupCustomizerForm() {
  const form = document.getElementById('site-customizer-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const heroTitle = document.getElementById('custom-hero-title').value.trim();
    const heroSubtitle = document.getElementById('custom-hero-subtitle').value.trim();
    const announcement = document.getElementById('custom-announcement').value.trim();
    const adsEnabled = document.getElementById('custom-ads-toggle').checked ? 'true' : 'false';

    const socialYT = document.getElementById('custom-social-youtube').value.trim();
    const socialIG = document.getElementById('custom-social-instagram').value.trim();
    const socialTW = document.getElementById('custom-social-twitter').value.trim();
    const socialTG = document.getElementById('custom-social-telegram').value.trim();
    const socialWA = document.getElementById('custom-social-whatsapp').value.trim();
    const socialDC = document.getElementById('custom-social-discord').value.trim();

    await window.vaultStorage.setSetting('heroTitle', heroTitle);
    await window.vaultStorage.setSetting('heroSubtitle', heroSubtitle);
    await window.vaultStorage.setSetting('announcement', announcement);
    await window.vaultStorage.setSetting('adsEnabled', adsEnabled);

    // Save Social Links
    await window.vaultStorage.setSetting('social_youtube', socialYT);
    await window.vaultStorage.setSetting('social_instagram', socialIG);
    await window.vaultStorage.setSetting('social_twitter', socialTW);
    await window.vaultStorage.setSetting('social_telegram', socialTG);
    await window.vaultStorage.setSetting('social_whatsapp', socialWA);
    await window.vaultStorage.setSetting('social_discord', socialDC);

    // Password change if filled
    const newPass = document.getElementById('custom-admin-password').value.trim();
    if (newPass) {
      await window.vaultStorage.setSetting('adminPassword', newPass);
      document.getElementById('custom-admin-password').value = '';
    }

    alert('Site settings & social media links updated successfully! Changes are live on the main website.');
  });
}

// 8. Content Manager
async function loadContentManager() {
  const [videos, photos, apps, files] = await Promise.all([
    window.vaultStorage.getAll('videos'),
    window.vaultStorage.getAll('photos'),
    window.vaultStorage.getAll('apps'),
    window.vaultStorage.getAll('files')
  ]);

  renderContentTable('manage-videos-body', 'videos', videos, 'title');
  renderContentTable('manage-photos-body', 'photos', photos, 'title');
  renderContentTable('manage-apps-body', 'apps', apps, 'name');
  renderContentTable('manage-files-body', 'files', files, 'name');
}

function renderContentTable(tbodyId, storeName, items, titleKey) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 14px;">No items in store.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${escapeHtml(item[titleKey])}</td>
      <td style="color: var(--text-muted);">${escapeHtml(item.category || item.platform || item.extension || 'General')}</td>
      <td>
        <button class="btn-delete-item" style="background: rgba(244, 63, 94, 0.2); border: 1px solid #f43f5e; color: #f43f5e; padding: 4px 10px; border-radius: 6px; cursor: pointer;" onclick="deleteContentItem('${storeName}', ${item.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteContentItem = async function(storeName, id) {
  if (confirm('Delete this item from vault?')) {
    await window.vaultStorage.delete(storeName, id);
    loadContentManager();
  }
};

// 9. Backup Tools
function setupBackupTools() {
  const exportBtn = document.getElementById('admin-export-backup-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const json = await window.vaultStorage.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TechShivx_Master_Backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const importInput = document.getElementById('admin-import-backup-input');
  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        await window.vaultStorage.importAll(text);
        alert('Data backup successfully restored!');
        loadDashboardData();
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    });
  }
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
