/**
 * TECH SHIVX — THREE.JS 3D BACKGROUND ENGINE
 * Pure Cosmic Purple Particle Field, Flowing Cyber Waves & Mouse-Reactive Nebula
 * (All bulky orbs and intrusive geometric wireframes removed as requested)
 */

class CyberScene3D {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.waveMesh = null;
    this.waveGeometry = null;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene Setup with Deep Cosmic Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x06020e, 0.0012);

    // 2. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 2500);
    this.camera.position.set(0, 15, 120);

    // 3. High Performance WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Subtle Ambient & Point Lights
    const ambientLight = new THREE.AmbientLight(0x280544, 2.5);
    this.scene.add(ambientLight);

    const purpleSpot = new THREE.PointLight(0xa855f7, 5, 500);
    purpleSpot.position.set(0, 50, 100);
    this.scene.add(purpleSpot);

    const cyanSpot = new THREE.PointLight(0x38bdf8, 3.5, 450);
    cyanSpot.position.set(-80, -40, 80);
    this.scene.add(cyanSpot);

    const magentaSpot = new THREE.PointLight(0xe879f9, 4, 450);
    magentaSpot.position.set(80, -40, 80);
    this.scene.add(magentaSpot);

    // 5. Build Flowing Cyber Wave Grid (Bottom 3D Floor)
    this.buildCyberWave();

    // 6. Build Deep Floating Particle Galaxy (2,200 Stars)
    this.buildCosmicParticles();

    // 7. Event Handlers
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('scroll', () => this.onScroll());

    // 8. Start Silky Smooth 60fps Loop
    this.animate();
  }

  // 3D Flowing Cyber Grid Floor
  buildCyberWave() {
    const width = 320;
    const height = 320;
    const segmentsX = 45;
    const segmentsY = 45;

    this.waveGeometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    this.waveGeometry.rotateX(-Math.PI / 2.2);

    // Material with glowing purple wireframe & cyber points
    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });

    this.waveMesh = new THREE.Mesh(this.waveGeometry, waveMaterial);
    this.waveMesh.position.set(0, -45, -40);
    this.scene.add(this.waveMesh);
  }

  // Deep Starfield Nebula Particles
  buildCosmicParticles() {
    const particleCount = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0xa855f7); // Electric Purple
    const color2 = new THREE.Color(0xc084fc); // Bright Lavender
    const color3 = new THREE.Color(0x38bdf8); // Neon Cyan
    const color4 = new THREE.Color(0xe879f9); // Magenta

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 800;
      positions[i + 1] = (Math.random() - 0.5) * 600;
      positions[i + 2] = (Math.random() - 0.5) * 700;

      const r = Math.random();
      let chosenColor;
      if (r < 0.45) chosenColor = color1;
      else if (r < 0.70) chosenColor = color2;
      else if (r < 0.85) chosenColor = color3;
      else chosenColor = color4;

      colors[i] = chosenColor.r;
      colors[i + 1] = chosenColor.g;
      colors[i + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX - window.innerWidth / 2) * 0.0008;
    this.targetMouseY = (e.clientY - window.innerHeight / 2) * 0.0008;
  }

  onScroll() {
    this.targetScrollY = window.scrollY;
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Smooth Lerp for Mouse Parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.05;

    // Camera gently orbits and sways with cursor
    this.camera.position.x = this.mouseX * 40;
    this.camera.position.y = 15 - (this.mouseY * 30) - (this.scrollY * 0.04);
    this.camera.lookAt(0, - (this.scrollY * 0.025), 0);

    // Animate Flowing Cyber Waves
    if (this.waveGeometry) {
      const positionAttribute = this.waveGeometry.attributes.position;
      const count = positionAttribute.count;

      for (let i = 0; i < count; i++) {
        const u = (i % 46) / 46;
        const v = Math.floor(i / 46) / 46;
        const wave = Math.sin(u * 12 + elapsedTime * 1.8) * 3.5 + 
                     Math.cos(v * 10 + elapsedTime * 1.5) * 3.5;
        positionAttribute.setY(i, wave);
      }
      positionAttribute.needsUpdate = true;
    }

    // Gentle particle galaxy drift
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.035;
      this.particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.cyberScene3D = new CyberScene3D();
});
