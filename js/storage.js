/**
 * TECH SHIVX — VAULT STORAGE & DATABASE ENGINE (IndexedDB v2)
 * Manages Videos, Photos, Apps, Files, Users, Subscribers, Download Logs, and Settings
 */

const DB_NAME = 'TechShivxVaultDB';
const DB_VERSION = 2;

class VaultStorage {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Content Stores
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
          videoStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
          photoStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('apps')) {
          const appStore = db.createObjectStore('apps', { keyPath: 'id', autoIncrement: true });
          appStore.createIndex('platform', 'platform', { unique: false });
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
          fileStore.createIndex('type', 'type', { unique: false });
        }

        // User Accounts Store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Email Subscribers Store
        if (!db.objectStoreNames.contains('subscribers')) {
          const subStore = db.createObjectStore('subscribers', { keyPath: 'id', autoIncrement: true });
          subStore.createIndex('email', 'email', { unique: true });
        }

        // Download Audit Logs Store
        if (!db.objectStoreNames.contains('download_logs')) {
          const logStore = db.createObjectStore('download_logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('userEmail', 'userEmail', { unique: false });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Page Views Analytics Store
        if (!db.objectStoreNames.contains('page_views')) {
          db.createObjectStore('page_views', { keyPath: 'id', autoIncrement: true });
        }

        // Site Settings Key-Value Store
        if (!db.objectStoreNames.contains('site_settings')) {
          db.createObjectStore('site_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this.seedDefaultsIfEmpty();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async seedDefaultsIfEmpty() {
    // Seed Default Settings
    const adminPass = await this.getSetting('adminPassword');
    if (!adminPass) {
      await this.setSetting('adminPassword', 'admin123');
      await this.setSetting('heroTitle', 'THE ULTIMATE 3D PURPLE VAULT FOR YOUR VIDEOS, APPS & FILES.');
      await this.setSetting('heroSubtitle', 'A seamless cybernetic portfolio and cloud depot. Stream YouTube masterclasses, explore 8K wallpapers, launch custom software, and upload personal files directly into your persistent browser vault.');
      await this.setSetting('announcement', '🚀 Welcome to TECH SHIVX 3D Platform! Register for free to unlock all downloads.');
      await this.setSetting('adsEnabled', 'true');
      await this.setSetting('social_youtube', 'https://youtube.com');
      await this.setSetting('social_instagram', 'https://instagram.com');
      await this.setSetting('social_twitter', 'https://x.com');
      await this.setSetting('social_telegram', 'https://t.me');
      await this.setSetting('social_whatsapp', 'https://wa.me/');
      await this.setSetting('social_discord', 'https://discord.com');
    }

    // Seed Demo Subscribers if empty
    const subscribers = await this.getAll('subscribers');
    if (subscribers.length === 0) {
      const demoSubs = [
        { email: 'alex.cyber@gmail.com', name: 'Alex Cyber', subscribedAt: '12 Sep 2026, 14:30', source: 'Registration' },
        { email: 'shiv.creator@outlook.com', name: 'Shiv Creator', subscribedAt: '14 Sep 2026, 18:22', source: 'Newsletter' },
        { email: 'dev.matrix@tech.io', name: 'Matrix Dev', subscribedAt: '15 Sep 2026, 09:15', source: 'Registration' }
      ];
      for (const s of demoSubs) await this.add('subscribers', s);
    }

    // Seed Demo Download Logs if empty
    const logs = await this.getAll('download_logs');
    if (logs.length === 0) {
      const demoLogs = [
        { userEmail: 'alex.cyber@gmail.com', itemName: 'SHIVX OS Launcher', itemType: 'App', timestamp: '15 Sep 2026, 16:40' },
        { userEmail: 'dev.matrix@tech.io', itemName: 'TechShivx_Purple_Theme_Pack.zip', itemType: 'File', timestamp: '16 Sep 2026, 10:12' }
      ];
      for (const l of demoLogs) await this.add('download_logs', l);
    }

    // Seed Videos
    const videos = await this.getAll('videos');
    if (videos.length === 0) {
      const defaultVideos = [
        {
          title: 'BUILDING A 3D CYBERNETIC AI ASSISTANT IN PYTHON & THREE.JS',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          youtubeId: 'dQw4w9WgXcQ',
          thumbnail: 'assets/images/cyber_purple_core.jpg',
          category: 'Coding & AI',
          duration: '18:45',
          description: 'Step-by-step masterclass on engineering an intelligent holographic assistant with voice recognition and 3D visualizers.',
          views: '45.2K',
          date: '2 days ago',
          isDefault: true
        },
        {
          title: 'CYBERPUNK NEON CITY WALKTHROUGH — UNREAL ENGINE 5.4',
          youtubeUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
          youtubeId: 'ScMzIvxBSi4',
          thumbnail: 'assets/images/neon_cyber_city.jpg',
          category: 'Gaming',
          duration: '24:10',
          description: 'Exploring the photorealistic raytraced purple neon underworld powered by Nanite and Lumen technology.',
          views: '112K',
          date: '1 week ago',
          isDefault: true
        },
        {
          title: 'QUANTUM PORTALS & PROCEDURAL SHADERS BREAKDOWN',
          youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
          youtubeId: 'fJ9rUzIMcZQ',
          thumbnail: 'assets/images/ai_quantum_portal.jpg',
          category: 'Tutorials',
          duration: '14:20',
          description: 'Deep dive into GLSL fragment shaders, particle vortex mathematics, and post-processing bloom magic.',
          views: '38.9K',
          date: '2 weeks ago',
          isDefault: true
        }
      ];
      for (const item of defaultVideos) await this.add('videos', item);
    }

    // Seed Photos
    const photos = await this.getAll('photos');
    if (photos.length === 0) {
      const defaultPhotos = [
        {
          title: 'Cyber Purple Reactor Core',
          category: '3D Wallpapers',
          imageUrl: 'assets/images/cyber_purple_core.jpg',
          date: 'Sep 2026',
          isDefault: true
        },
        {
          title: 'Neo-Kyoto Rain & Neon Glow',
          category: 'Cyberpunk',
          imageUrl: 'assets/images/neon_cyber_city.jpg',
          date: 'Sep 2026',
          isDefault: true
        },
        {
          title: 'Quantum AI Singularity Portal',
          category: 'Concept Art',
          imageUrl: 'assets/images/ai_quantum_portal.jpg',
          date: 'Sep 2026',
          isDefault: true
        }
      ];
      for (const item of defaultPhotos) await this.add('photos', item);
    }

    // Seed Apps
    const apps = await this.getAll('apps');
    if (apps.length === 0) {
      const defaultApps = [
        {
          name: 'SHIVX OS Launcher',
          version: 'v2.6.4',
          platform: 'Windows',
          icon: 'ph-cpu',
          description: 'Futuristic desktop customizer with glowing 3D HUD widgets, memory optimizer, and audio visualizer.',
          features: ['60FPS Hardware Acceleration', 'Custom Cyber Themes', 'System Telemetry HUD'],
          downloadUrl: 'assets/images/cyber_purple_core.jpg',
          demoUrl: '#',
          downloads: '14.8K',
          isDefault: true
        },
        {
          name: 'NeonSync Cloud Vault',
          version: 'v1.4.0',
          platform: 'Web App',
          icon: 'ph-cloud-arrow-up',
          description: 'Zero-knowledge encrypted cloud locker for media creators with high-speed peer-to-peer file sharing.',
          features: ['End-to-End Encryption', 'Zero Compression Loss', 'Instant P2P Transfer'],
          downloadUrl: 'assets/images/ai_quantum_portal.jpg',
          demoUrl: '#',
          downloads: '29.1K',
          isDefault: true
        },
        {
          name: 'Jarvis Voice Controller',
          version: 'v3.1.0',
          platform: 'Python',
          icon: 'ph-waveform',
          description: 'Offline capable AI voice command suite that automates desktop workflows, launches apps, and plays media.',
          features: ['Offline Speech Recognition', 'Custom Command Triggers', 'Ultra-low Latency'],
          downloadUrl: 'assets/images/neon_cyber_city.jpg',
          demoUrl: '#',
          downloads: '52.3K',
          isDefault: true
        }
      ];
      for (const item of defaultApps) await this.add('apps', item);
    }

    // Seed Files
    const files = await this.getAll('files');
    if (files.length === 0) {
      const defaultFiles = [
        {
          name: 'TechShivx_Purple_Theme_Pack.zip',
          type: 'archive',
          extension: 'ZIP',
          size: '42.8 MB',
          date: '14 Sep 2026',
          downloads: 1420,
          description: 'Complete 8K wallpapers, cursor themes, and sound FX bundle.',
          downloadUrl: 'assets/images/cyber_purple_core.jpg',
          isDefault: true
        },
        {
          name: 'AI_Voice_Assistant_Source_Code.zip',
          type: 'code',
          extension: 'ZIP',
          size: '12.4 MB',
          date: '10 Sep 2026',
          downloads: 3840,
          description: 'Full Python backend source code with modular skill system.',
          downloadUrl: 'assets/images/ai_quantum_portal.jpg',
          isDefault: true
        },
        {
          name: 'Cyberpunk_LUTs_Color_Presets.cube',
          type: 'preset',
          extension: 'CUBE',
          size: '4.2 MB',
          date: '05 Sep 2026',
          downloads: 910,
          description: 'Color grading LUTs for Premiere Pro, DaVinci Resolve, and Photoshop.',
          downloadUrl: 'assets/images/neon_cyber_city.jpg',
          isDefault: true
        }
      ];
      for (const item of defaultFiles) await this.add('files', item);
    }
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(Number(id));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(Number(id));
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Site Settings
  async getSetting(key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('site_settings', 'readonly');
      const store = tx.objectStore('site_settings');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('site_settings', 'readwrite');
      const store = tx.objectStore('site_settings');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Record Page View
  async recordPageView() {
    try {
      await this.add('page_views', {
        timestamp: new Date().toISOString(),
        dateString: new Date().toLocaleDateString('en-GB')
      });
    } catch (e) {
      console.warn('Could not record view:', e);
    }
  }

  // Record Download Audit Log
  async recordDownload(userEmail, itemName, itemType) {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    return await this.add('download_logs', {
      userEmail,
      itemName,
      itemType,
      timestamp
    });
  }

  async exportAll() {
    const data = {
      videos: await this.getAll('videos'),
      photos: await this.getAll('photos'),
      apps: await this.getAll('apps'),
      files: (await this.getAll('files')).map(f => {
        const copy = { ...f };
        if (copy.fileBlob) delete copy.fileBlob;
        return copy;
      }),
      users: (await this.getAll('users')).map(u => {
        const c = { ...u };
        delete c.password;
        return c;
      }),
      subscribers: await this.getAll('subscribers'),
      download_logs: await this.getAll('download_logs'),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importAll(jsonData) {
    const data = JSON.parse(jsonData);
    for (const store of ['videos', 'photos', 'apps', 'files']) {
      if (data[store] && Array.isArray(data[store])) {
        for (const item of data[store]) {
          delete item.id;
          await this.add(store, item);
        }
      }
    }
    return true;
  }
}

window.vaultStorage = new VaultStorage();
