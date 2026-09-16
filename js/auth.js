/**
 * TECH SHIVX — USER AUTHENTICATION & DOWNLOAD GATEKEEPER
 * Manages user registration, login, subscriber conversion, and protected downloads
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.pendingDownloadAction = null;
    this.init();
  }

  init() {
    // Restore session from localStorage
    const saved = localStorage.getItem('tech_shivx_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = null;
      }
    }
    this.updateNavbarAuthUI();
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async register(name, email, password) {
    if (!name || !email || !password) {
      throw new Error('All fields are required.');
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check existing user
    const users = await window.vaultStorage.getAll('users');
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('This email is already registered. Please login instead.');
    }

    const newUser = {
      name: name.trim(),
      email: cleanEmail,
      password: password, // client-side vault demo
      registeredAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      downloadsCount: 0
    };

    await window.vaultStorage.add('users', newUser);

    // Auto-enroll as Subscriber as requested!
    await this.addSubscriber(cleanEmail, name.trim(), 'Registration');

    // Auto-login
    this.setCurrentSession(newUser);
    return newUser;
  }

  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const users = await window.vaultStorage.getAll('users');
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password. If you are new, please register.');
    }

    this.setCurrentSession(user);
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('tech_shivx_user');
    this.updateNavbarAuthUI();
    if (typeof showToast === 'function') {
      showToast('Logged out successfully', 'info');
    }
  }

  setCurrentSession(user) {
    const safeUser = {
      name: user.name,
      email: user.email,
      registeredAt: user.registeredAt
    };
    this.currentUser = safeUser;
    localStorage.setItem('tech_shivx_user', JSON.stringify(safeUser));
    this.updateNavbarAuthUI();

    // Execute pending download if any
    if (this.pendingDownloadAction) {
      const action = this.pendingDownloadAction;
      this.pendingDownloadAction = null;
      setTimeout(() => action(), 300);
    }
  }

  async addSubscriber(email, name = 'Subscriber', source = 'Newsletter') {
    const cleanEmail = email.trim().toLowerCase();
    const subs = await window.vaultStorage.getAll('subscribers');
    const existing = subs.find(s => s.email.toLowerCase() === cleanEmail);

    if (!existing) {
      await window.vaultStorage.add('subscribers', {
        email: cleanEmail,
        name: name,
        subscribedAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        source: source
      });
    }
  }

  // DOWNLOAD GATEKEEPER
  // Protects files and apps so visitors must register or login before downloading
  requireAuthForDownload(downloadCallback, itemName, itemType = 'File') {
    if (this.isLoggedIn()) {
      // Log download into audit logs
      window.vaultStorage.recordDownload(this.currentUser.email, itemName, itemType);
      downloadCallback();
      if (window.cyberAudio) window.cyberAudio.playSuccessChime();
    } else {
      // Save pending download action and open Auth Modal
      this.pendingDownloadAction = () => {
        window.vaultStorage.recordDownload(this.currentUser.email, itemName, itemType);
        downloadCallback();
        if (window.cyberAudio) window.cyberAudio.playSuccessChime();
      };
      this.openAuthModal(`Access Required: Please login or create a free account to download "${itemName}".`);
    }
  }

  openAuthModal(noticeText = '') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    const noticeEl = document.getElementById('auth-modal-notice');
    if (noticeEl) {
      if (noticeText) {
        noticeEl.textContent = noticeText;
        noticeEl.style.display = 'block';
      } else {
        noticeEl.style.display = 'none';
      }
    }
    modal.classList.add('active');
    if (window.cyberAudio) window.cyberAudio.playHoverSound();
  }

  async loginWithGoogle() {
    let email = prompt('Sign in with Google - Enter your Google email:', 'shiv.creator@gmail.com');
    if (!email) return;
    email = email.trim().toLowerCase();
    if (!email.includes('@')) {
      if (typeof showToast === 'function') showToast('Please enter a valid Google email address.', 'error');
      return;
    }

    let defaultName = email.split('@')[0].replace(/[._]/g, ' ');
    defaultName = defaultName.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    const users = await window.vaultStorage.getAll('users');
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        name: defaultName,
        email: email,
        provider: 'google',
        registeredAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        downloadsCount: 0
      };
      await window.vaultStorage.add('users', user);
      await this.addSubscriber(email, defaultName, 'Google Sign-In');
    }

    this.setCurrentSession(user);
    this.closeAuthModal();
    if (typeof showToast === 'function') {
      showToast(`Signed in with Google as ${user.name}!`);
    }
    if (window.cyberAudio) window.cyberAudio.playSuccessChime();
  }

  updateNavbarAuthUI() {
    const authArea = document.getElementById('nav-auth-area');
    const drawerAuthArea = document.getElementById('drawer-auth-area');
    
    const isGoogle = this.currentUser && this.currentUser.provider === 'google';
    const userIcon = isGoogle 
      ? '<i class="ph ph-google-logo" style="font-size: 1.3rem; color: #38bdf8;"></i>'
      : '<i class="ph ph-user-circle" style="font-size: 1.3rem; color: var(--neon-cyan);"></i>';

    if (authArea) {
      if (this.isLoggedIn()) {
        authArea.innerHTML = `
          <div class="user-pill-wrap">
            <div class="user-pill" title="${escapeHtml(this.currentUser.email)}">
              ${userIcon}
              <span class="user-pill-email">${escapeHtml(this.currentUser.email)}</span>
            </div>
            <button class="btn-logout" title="Sign Out" onclick="window.authManager.logout()">
              <i class="ph ph-sign-out"></i>
            </button>
          </div>
        `;
      } else {
        authArea.innerHTML = `
          <button class="btn-auth-trigger" onclick="window.authManager.openAuthModal()" title="Login or Register">
            <i class="ph ph-user"></i>
            <span>Login / Register</span>
          </button>
        `;
      }
    }

    if (drawerAuthArea) {
      if (this.isLoggedIn()) {
        drawerAuthArea.innerHTML = `
          <div style="background: rgba(168, 85, 247, 0.15); border: 1px solid var(--purple-neon-border); border-radius: 12px; padding: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${userIcon}
              <div style="font-size: 0.82rem;">
                <div style="font-weight: 700; color: #fff;">${escapeHtml(this.currentUser.name)}</div>
                <div style="color: var(--text-muted); font-size: 0.72rem;">${escapeHtml(this.currentUser.email)}</div>
              </div>
            </div>
            <button class="btn-logout" title="Sign Out" onclick="window.authManager.logout()">
              <i class="ph ph-sign-out"></i>
            </button>
          </div>
        `;
      } else {
        drawerAuthArea.innerHTML = `
          <button class="btn-auth-trigger" style="width: 100%; justify-content: center; margin-bottom: 14px; padding: 12px 18px;" onclick="document.getElementById('mobile-nav-drawer').classList.remove('open'); window.authManager.openAuthModal();">
            <i class="ph ph-user"></i>
            <span style="display: inline !important;">Sign In / Register</span>
          </button>
        `;
      }
    }
  }
}

window.authManager = new AuthManager();
