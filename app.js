// ==========================================================================
// 3D PERLIN NOISE GENERATOR FOR PROCEDURAL TEXTURES
// ==========================================================================
class PerlinNoise3D {
  constructor() {
    this.p = new Uint8Array(512);
    const p = [151,160,137,91,90,15,
      131,13,201,95,96,53,194,233, 7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
      88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
      135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
      5,202,38,147,118,126,255,82,85,212,207,206, 59,227,47,16,58,17,182,189,28,42,
      223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
      129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
      49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) {
      this.p[i] = p[i];
      this.p[256 + i] = p[i];
    }
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  noise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;
    return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
                                                   this.grad(this.p[BA], x - 1, y, z)),
                                     this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                                                   this.grad(this.p[BB], x - 1, y - 1, z))),
                   this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                                                   this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                                     this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                                                   this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
  }
  fbm(x, y, z, octaves = 5) {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * (this.noise(x * frequency, y * frequency, z * frequency) * 0.5 + 0.5);
      maxVal += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value / maxVal;
  }
}

const noiseGen = new PerlinNoise3D();

// ==========================================================================
// TEXTURE GENERATION ON HEAP-CANVAS (OPTIMIZED DIMENSIONS)
// ==========================================================================
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;  
  canvas.height = 512; 
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  
  for (let y = 0; y < canvas.height; y++) {
    const phi = (y / canvas.height) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    for (let x = 0; x < canvas.width; x++) {
      const theta = (x / canvas.width) * 2 * Math.PI;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      
      const nx = cosTheta * sinPhi;
      const ny = sinTheta * sinPhi;
      const nz = cosPhi;
      
      const h = noiseGen.fbm(nx * 3.5, ny * 3.5, nz * 3.5, 5);
      let r, g, b;
      
      if (h > 0.46) {
        // LAND (Mossy & Lush Green)
        if (h < 0.49) {
          // Coastlines / Sand
          const t = (h - 0.46) / 0.03;
          r = Math.floor(190 * (1 - t) + 16 * t);
          g = Math.floor(175 * (1 - t) + 185 * t);
          b = Math.floor(125 * (1 - t) + 129 * t);
        } else if (h < 0.65) {
          // Main Forests
          const t = (h - 0.49) / 0.16;
          r = Math.floor(16 * (1 - t) + 5 * t);
          g = Math.floor(185 * (1 - t) + 150 * t);
          b = Math.floor(129 * (1 - t) + 95 * t);
        } else {
          // Dark Highlands / Mountains
          const t = Math.min((h - 0.65) / 0.2, 1.0);
          r = Math.floor(5 * (1 - t) + 21 * t);
          g = Math.floor(150 * (1 - t) + 128 * t);
          b = Math.floor(95 * (1 - t) + 61 * t);
        }
      } else {
        // WATER (Vibrant turquoise to deep blue)
        if (h > 0.42) {
          const t = (h - 0.42) / 0.04;
          r = Math.floor(13 * (1 - t) + 59 * t);
          g = Math.floor(148 * (1 - t) + 130 * t);
          b = Math.floor(136 * (1 - t) + 246 * t);
        } else {
          const t = Math.min((0.42 - h) / 0.32, 1.0);
          r = Math.floor(13 * (1 - t) + 15 * t);
          g = Math.floor(148 * (1 - t) + 23 * t);
          b = Math.floor(136 * (1 - t) + 76 * t);
        }
      }
      
      const idx = (y * canvas.width + x) * 4;
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// ==========================================================================
// GLOBALS & DOM REFERENCES (INITIALLY NULL TO BE SAFE)
// ==========================================================================
let scene, camera, renderer, earth, hotspotGroup;
let bgScene, bgCamera, bgRenderer, bgParticles, bgLeaves;
let canvasEl = null;
let wrapper = null;
let container = null;
let badges = [];
let badgesState = [];
let tooltip = null;
let tooltipImg = null;
let tooltipTitle = null;
let tooltipDesc = null;
let leavesContainer = null;
let clock = null;

// Raycasting & Hover Tracker
let raycaster = null;
let mouse = new THREE.Vector2(-9999, -9999);
const interactiveObjects = [];
let activeHover = null; // Stores { type: 'satellite'/'hotspot', id: satId }

// Drag, Inertia, and Hover States
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let autoRotateSpeed = 0.0018;
let isHoveringBadge = false;
const leafHues = ['#059669', '#10b981', '#34d399', '#84cc16', '#0d9488'];

// ==========================================================================
// THREE.JS BACKGROUND SCENE CONFIGURATION
// ==========================================================================
function initBgThree() {
  const bgCanvas = document.getElementById('bg-canvas');
  if (!bgCanvas) return;

  bgScene = new THREE.Scene();

  bgCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  bgCamera.position.z = 10;

  bgRenderer = new THREE.WebGLRenderer({
    canvas: bgCanvas,
    antialias: true,
    alpha: true
  });
  bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  bgRenderer.setSize(window.innerWidth, window.innerHeight);

  // 1. Spores Particle System (Bioluminescent green/gold spores)
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = [];
  const phases = [];
  const colors = new Float32Array(particleCount * 3);

  const sporeTexture = createSporeTexture();

  const colorGreen = new THREE.Color(0x34d399); 
  const colorGold = new THREE.Color(0xfacc15);  

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;

    speeds.push(0.004 + Math.random() * 0.008);
    phases.push(Math.random() * Math.PI * 2);

    const isGold = Math.random() > 0.75;
    const c = isGold ? colorGold : colorGreen;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.18,
    map: sporeTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  bgParticles = new THREE.Points(particleGeometry, particleMaterial);
  bgParticles.userData = { speeds, phases };
  bgScene.add(bgParticles);

  // 2. Procedural 3D Falling Leaves (PlaneGeometry with custom leaf canvas texture)
  bgLeaves = [];
  const leafCount = 25;
  
  const leafTexture = createLeafTexture();
  const leafGeometry = new THREE.PlaneGeometry(0.24, 0.38);

  for (let i = 0; i < leafCount; i++) {
    const leafMaterial = new THREE.MeshBasicMaterial({
      map: leafTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25 + Math.random() * 0.35
    });
    
    const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
    
    leafMesh.position.set(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 8 - 3
    );
    
    leafMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scale = 0.6 + Math.random() * 1.0;
    leafMesh.scale.setScalar(scale);
    
    leafMesh.userData = {
      fallSpeed: 0.006 + Math.random() * 0.012,
      rotSpeedX: (Math.random() - 0.5) * 0.015,
      rotSpeedY: (Math.random() - 0.5) * 0.015,
      rotSpeedZ: (Math.random() - 0.5) * 0.015,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.01,
      swayAmp: 0.004 + Math.random() * 0.008
    };
    
    bgScene.add(leafMesh);
    bgLeaves.push(leafMesh);
  }

  window.addEventListener('resize', onBgResize);
}

function createSporeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
  grad.addColorStop(0.3, 'rgba(52, 211, 153, 0.8)'); 
  grad.addColorStop(1, 'rgba(16, 185, 129, 0)'); 
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

function createLeafTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 64, 64);

  // Draw Leaf Shape
  ctx.fillStyle = '#10b981'; // Green leaf body
  ctx.beginPath();
  ctx.moveTo(32, 60);
  ctx.quadraticCurveTo(8, 36, 32, 4);
  ctx.quadraticCurveTo(56, 36, 32, 60);
  ctx.fill();

  // Draw leaf veins
  ctx.strokeStyle = '#047857'; // Dark green stem/veins
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(32, 60);
  ctx.lineTo(32, 10);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  // Left side veins
  ctx.moveTo(32, 50); ctx.lineTo(18, 42);
  ctx.moveTo(32, 40); ctx.lineTo(14, 30);
  ctx.moveTo(32, 30); ctx.lineTo(16, 20);
  // Right side veins
  ctx.moveTo(32, 50); ctx.lineTo(46, 42);
  ctx.moveTo(32, 40); ctx.lineTo(50, 30);
  ctx.moveTo(32, 30); ctx.lineTo(48, 20);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

function onBgResize() {
  if (!bgRenderer || !bgCamera) return;
  bgCamera.aspect = window.innerWidth / window.innerHeight;
  bgCamera.updateProjectionMatrix();
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================================================
// THREE.JS SCENE CONFIGURATION
// ==========================================================================
function initThree() {
  if (!canvasEl) return;
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 4.8;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(320, 320);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
  sunLight.position.set(5, 3, 5); 
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0xd1fae5, 0.65);
  rimLight.position.set(-5, -2, -5); 
  scene.add(rimLight);

  // Earth mesh
  const earthGeometry = new THREE.SphereGeometry(1.6, 64, 64);
  const earthTexture = createEarthTexture();
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.1
  });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Initial rotations
  earth.rotation.x = 0.25;

  // ----------------------------------------------------
  // IIT Bombay Location Marker Pin on Earth surface
  // ----------------------------------------------------
  const R = 1.6;
  const lat = 19.1334;
  const lon = 72.9133;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 148) * (Math.PI / 180); // Adjust alignment to face front camera initially
  
  const hotspotPos = new THREE.Vector3(
    -R * Math.sin(phi) * Math.sin(theta),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.cos(theta)
  );

  hotspotGroup = new THREE.Group();
  hotspotGroup.position.copy(hotspotPos);
  hotspotGroup.lookAt(hotspotPos.clone().normalize().multiplyScalar(3));

  // Glowing center marker pin
  const pinGroup = new THREE.Group();

  // Cone (pointer) pointing down to (0,0,0) on the surface of the globe
  const coneGeom = new THREE.ConeGeometry(0.035, 0.12, 16);
  const pinColor = 0xef4444; // IITB red
  const pinMat = new THREE.MeshStandardMaterial({
    color: pinColor,
    roughness: 0.3,
    metalness: 0.8,
    depthTest: false // Render on top of everything!
  });
  const coneMesh = new THREE.Mesh(coneGeom, pinMat);
  coneMesh.rotation.x = -Math.PI / 2;
  coneMesh.position.set(0, 0, 0.06);
  coneMesh.renderOrder = 1000;
  pinGroup.add(coneMesh);

  // Sphere (pin head) at the top of the cone
  const headGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const headMesh = new THREE.Mesh(headGeom, pinMat);
  headMesh.position.set(0, 0, 0.12);
  headMesh.renderOrder = 1001;
  pinGroup.add(headMesh);

  // Glowing white inner core in the pin head
  const innerGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    depthTest: false // Render on top!
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  innerMesh.position.set(0, 0, 0.12);
  innerMesh.renderOrder = 1002;
  pinGroup.add(innerMesh);

  hotspotGroup.add(pinGroup);

  // Pulsing outer ring
  const ringGeom = new THREE.RingGeometry(0.04, 0.07, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthTest: false // Render on top!
  });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.renderOrder = 999;
  hotspotGroup.add(ringMesh);

  // Hit-Helper for larger hover targets
  const hitHelperGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const hitHelperMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitHelperMesh = new THREE.Mesh(hitHelperGeom, hitHelperMat);
  hitHelperMesh.position.set(0, 0, 0.06);
  hitHelperMesh.renderOrder = 1003;
  hotspotGroup.add(hitHelperMesh);

  hotspotGroup.userData = { type: 'hotspot', ring: ringMesh };
  earth.add(hotspotGroup);
  interactiveObjects.push(hotspotGroup);

  // Start animate loop
  animate();
}

// ==========================================================================
// ANIMATION LOOP
// ==========================================================================
function animate() {
  requestAnimationFrame(animate);

  // Pause WebGL rendering loop when hidden on mobile to save CPU/battery
  if (!wrapper || window.getComputedStyle(wrapper).display === 'none') {
    return;
  }

  // Clock time update
  const time = clock ? clock.getElapsedTime() : 0;

  // Earth auto rotation
  const isHoveringHotspot = (activeHover && activeHover.type === 'hotspot');
  if (!isDragging && !isHoveringHotspot && earth) {
    earth.rotation.y += autoRotateSpeed;
  }

  // 1. IIT Bombay Hotspot Pulsing & Z-Depth Check
  if (hotspotGroup && hotspotGroup.userData && hotspotGroup.userData.ring) {
    const ring = hotspotGroup.userData.ring;
    const pulse = 1 + 0.3 * Math.sin(time * 6.5);
    ring.scale.setScalar(pulse);
    ring.material.opacity = 0.85 - 0.4 * (pulse - 0.7);

    hotspotGroup.visible = true;
  }

  // 2. Update HTML badges orbit position (clockwise)
  positionBadges();

  // 3. Raycast Hover Interactions
  let hoveredObj = null;
  if (!isHoveringBadge && mouse.x !== -9999 && raycaster && camera) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);
    
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && obj.parent) {
        if (obj.userData && obj.userData.type) {
          hoveredObj = obj;
          break;
        }
        obj = obj.parent;
      }
    }
  }

  if (hoveredObj) {
    const type = hoveredObj.userData.type;
    
    if (!activeHover || activeHover.type !== type) {
      clearActiveHover(); // Reset previous hover state
      
      activeHover = { type };
      
      if (type === 'hotspot') {
        gsap.to(hotspotGroup.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.35, ease: "power2.out" });
        if (tooltipImg) tooltipImg.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80";
        if (tooltipTitle) tooltipTitle.textContent = "IIT Bombay, Powai";
        if (tooltipDesc) tooltipDesc.textContent = "Home to the Sustainability Cell, driving campus-wide green policies, carbon footprint reduction, and student-led environmental initiatives.";
        if (tooltip) {
          tooltip.classList.add('highlighted');
          tooltip.style.setProperty('--active-color', '#ef4444');
        }
      }
    }
  } else {
    if (activeHover) {
      clearActiveHover();
      activeHover = null;
    }
  }

  // Update background particles and leaves
  if (bgParticles) {
    const positions = bgParticles.geometry.attributes.position.array;
    const count = positions.length / 3;
    const speeds = bgParticles.userData.speeds;
    const phases = bgParticles.userData.phases;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += speeds[i];
      positions[i * 3] += Math.sin(time * 0.5 + phases[i]) * 0.003;

      if (positions[i * 3 + 1] > 10) {
        positions[i * 3 + 1] = -10;
        positions[i * 3] = (Math.random() - 0.5) * 20;
      }
    }
    bgParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (bgLeaves && bgLeaves.length > 0) {
    bgLeaves.forEach(leaf => {
      leaf.position.y -= leaf.userData.fallSpeed;
      leaf.userData.swayPhase += leaf.userData.swaySpeed;
      leaf.position.x += Math.sin(leaf.userData.swayPhase) * leaf.userData.swayAmp;
      
      leaf.rotation.x += leaf.userData.rotSpeedX;
      leaf.rotation.y += leaf.userData.rotSpeedY;
      leaf.rotation.z += leaf.userData.rotSpeedZ;

      if (leaf.position.y < -10) {
        leaf.position.y = 10;
        leaf.position.x = (Math.random() - 0.5) * 22;
      }
    });
  }

  // Render background Three.js scene
  if (bgRenderer && bgScene && bgCamera) {
    bgRenderer.render(bgScene, bgCamera);
  }

  // Render Three.js scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function positionBadges() {
  if (!container || badgesState.length === 0) return;
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  
  const radius = isMobile ? rect.width * 0.35 : 190;
  const offset = isSmallMobile ? 19 : 24;

  badgesState.forEach(sat => {
    if (!isHoveringBadge && !isDragging) {
      sat.angle += sat.speed;
    }
    
    const x = centerX + radius * Math.cos(sat.angle) - offset;
    const y = centerY + radius * Math.sin(sat.angle) - offset;
    
    sat.element.style.left = `${x}px`;
    sat.element.style.top = `${y}px`;
  });
}

function clearActiveHover() {
  if (!activeHover) return;
  
  if (activeHover.type === 'hotspot') {
    if (tooltip) tooltip.classList.remove('highlighted');
    gsap.to(hotspotGroup.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3 });
  }
}

// ==========================================================================
// DRAG HANDLERS
// ==========================================================================
function setupDragHandlers() {
  if (!wrapper) return;

  wrapper.addEventListener('mousedown', e => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging || !earth) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    earth.rotation.y += deltaX * 0.006;
    earth.rotation.x += deltaY * 0.006;

    earth.rotation.x = Math.max(-0.6, Math.min(0.6, earth.rotation.x));

    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  wrapper.addEventListener('touchstart', e => {
    isDragging = true;
    previousMousePosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isDragging || !earth) return;

    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;

    earth.rotation.y += deltaX * 0.008;
    earth.rotation.x += deltaY * 0.008;

    earth.rotation.x = Math.max(-0.6, Math.min(0.6, earth.rotation.x));

    previousMousePosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// ==========================================================================
// BACKGROUND FLOATING LEAVES SYSTEM (GSAP ANIMATED)
// ==========================================================================
function createFloatingLeaf() {
  if (!leavesContainer || window.getComputedStyle(leavesContainer).display === 'none') return;
  
  const leaf = document.createElement('div');
  leaf.className = 'floating-leaf';
  
  const size = Math.random() * 22 + 15; 
  const startLeft = Math.random() * 100;
  const randomColor = leafHues[Math.floor(Math.random() * leafHues.length)];
  
  leaf.style.width = `${size}px`;
  leaf.style.height = `${size}px`;
  leaf.style.left = `${startLeft}%`;
  leaf.style.top = `-50px`;
  
  leaf.innerHTML = `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
      <path d="M 10 90 C 20 50, 45 20, 90 10 C 75 40, 50 80, 10 90 Z" fill="${randomColor}" />
      <path d="M 10 90 Q 50 50 90 10" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round"/>
      <path d="M 30 70 Q 25 60 22 58 M 30 70 Q 38 72 40 73 M 50 50 Q 42 38 38 34 M 50 50 Q 60 55 64 57 M 70 30 Q 62 20 58 16 M 70 30 Q 78 35 80 37" stroke="rgba(255,255,255,0.25)" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
  
  leavesContainer.appendChild(leaf);
  
  const duration = Math.random() * 10 + 7;
  const horizontalDrift = Math.random() * 160 - 80; 
  const randomRotation = Math.random() * 540 - 270; 
  
  gsap.to(leaf, {
    y: window.innerHeight + 100,
    x: horizontalDrift,
    rotation: randomRotation,
    duration: duration,
    ease: "none",
    onComplete: () => leaf.remove()
  });
}

// ==========================================================================
// MAIN INITIALIZATION FUNCTION (GUARANTEES DOM READINESS)
// ==========================================================================
function startApp() {
  canvasEl = document.getElementById('globe-canvas');
  wrapper = document.querySelector('.globe-canvas-wrapper');
  container = document.querySelector('.hero-globe-container');
  badges = document.querySelectorAll('.orbit-badge');
  tooltip = document.getElementById('badge-tooltip');
  tooltipImg = document.getElementById('tooltip-img');
  tooltipTitle = document.getElementById('tooltip-title');
  tooltipDesc = document.getElementById('tooltip-desc');
  leavesContainer = document.getElementById('leaves-container');

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  if (typeof gsap !== 'undefined') {

    initBgThree();
    initThree();
    setupDragHandlers();

    if (wrapper) {
      wrapper.addEventListener('mousemove', e => {
        const rect = canvasEl.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      });
      wrapper.addEventListener('mouseleave', () => {
        mouse.set(-9999, -9999);
      });
    }

    const badgeColors = {
      biodiversity: '#059669',
      environment: '#10b981',
      energy: '#f97316',
      water: '#0d9488',
      waste: '#15803d',
      mobility: '#84cc16'
    };

    badgesState = Array.from(badges).map(badge => {
      const angleDeg = parseFloat(badge.dataset.angle);
      const angleRad = (angleDeg * Math.PI) / 180;
      const id = badge.id.replace('badge-', '');
      
      return {
        element: badge,
        angle: angleRad,
        speed: 0.0035, // Smooth clockwise speed
        isPaused: false,
        id: id,
        title: badge.dataset.title,
        image: badge.dataset.image,
        info: badge.dataset.info,
        color: badgeColors[id] || '#10b981'
      };
    });

    badgesState.forEach(sat => {
      sat.element.addEventListener('mouseenter', () => {
        isHoveringBadge = true;
        sat.isPaused = true;
        sat.element.classList.add('active');
        clearActiveHover();
        
        if (tooltipImg) tooltipImg.src = sat.image;
        if (tooltipTitle) tooltipTitle.textContent = sat.title;
        if (tooltipDesc) tooltipDesc.textContent = sat.info;
        if (tooltip) {
          tooltip.classList.add('highlighted');
          tooltip.style.setProperty('--active-color', sat.color);
        }
      });

      sat.element.addEventListener('mouseleave', () => {
        isHoveringBadge = false;
        sat.isPaused = false;
        sat.element.classList.remove('active');
        if (tooltip) tooltip.classList.remove('highlighted');
      });
    });

    // Background blobs dynamic interactive parallax (replaces ScrollTrigger)
    window.addEventListener('mousemove', e => {
      const x = (e.clientX - window.innerWidth / 2) / window.innerWidth * 35;
      const y = (e.clientY - window.innerHeight / 2) / window.innerHeight * 35;
      gsap.to(".bg-blobs-container", {
        x: x,
        y: y,
        duration: 2.0,
        ease: "power2.out"
      });
    });

    // Gentle floating loop animation for slogan wrapper
    gsap.to(".hero-slogan-wrapper", {
      y: -8,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // 2. Animated Twinkling Spores / Fireflies
    const firefliesContainer = document.getElementById('fireflies-container');
    if (firefliesContainer) {
      for (let i = 0; i < 20; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        const size = Math.random() * 10 + 6;
        firefly.style.width = `${size}px`;
        firefly.style.height = `${size}px`;
        firefly.style.left = `${Math.random() * 100}%`;
        firefly.style.top = `${Math.random() * 100}%`;
        firefly.style.opacity = Math.random() * 0.5 + 0.15;
        firefliesContainer.appendChild(firefly);
        
        gsap.to(firefly, {
          x: "random(-120, 120)",
          y: "random(-120, 120)",
          opacity: "random(0.15, 0.8)",
          scale: "random(0.7, 1.4)",
          duration: "random(6, 12)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    }

    // 3. Staggered Hero Load Sequence (Entrance Timeline)
    const mainTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.0 } });

    // Navbar Slide Down
    mainTl.from('.header', {
      y: -30,
      opacity: 0,
      duration: 0.9
    });

    // Headings Slide Up
    if (document.querySelector('.hero-title span')) {
      mainTl.from('.hero-title span', {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 1
      }, '-=0.5');
    }

    // Description Reveal
    if (document.querySelector('.hero-subtitle')) {
      mainTl.from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.8
      }, '-=0.6');
    }

    // Statistics Cards slide-up and trigger count-up
    if (document.querySelector('.stat-item')) {
      mainTl.from('.stat-item', {
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        onComplete: animateStatsCounters
      }, '-=0.6');
    }

    // Globe wrapper scales in
    if (container) {
      mainTl.from('.globe-canvas-wrapper', {
        scale: 0.6,
        opacity: 0,
        duration: 1.3,
        ease: "back.out(1.4)"
      }, '-=0.8');
      
      // Dashed orbit path lines fade in
      mainTl.from('.orbit-path', {
        opacity: 0,
        duration: 0.8
      }, '-=0.6');
    }

    // Orbiting category label elements reveal
    if (badges.length) {
      mainTl.from(badges, {
        scale: 0,
        opacity: 0,
        stagger: 0.08,
        ease: "back.out(1.8)",
        duration: 0.8
      }, '-=0.6');
    }

    // Slogan wrapper and Scroll down indicators fade-in
    mainTl.from('.hero-slogan-wrapper, .scroll-explore', {
      opacity: 0,
      y: 10,
      duration: 1
    }, '-=0.6');

    // 4. Stats Count-up Function
    function animateStatsCounters() {
      document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        if (isNaN(target)) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: "power2.out",
          onUpdate: () => {
            stat.textContent = Math.floor(obj.val);
          }
        });
      });
    }

    // 5. Magnetic Lift Effect on Action Buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.35,
          y: y * 0.35,
          scale: 1.025,
          duration: 0.35,
          ease: "power2.out"
        });
      });
      
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: "power3.out"
        });
      });
    });

    // 6. GSAP Animated Leaves Spawn
    if (leavesContainer) {
      for (let i = 0; i < 5; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'floating-leaf';
        const size = Math.random() * 20 + 15; 
        const startLeft = Math.random() * 100;
        const startTop = Math.random() * 80;
        const randomColor = leafHues[Math.floor(Math.random() * leafHues.length)];
        
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${startLeft}%`;
        leaf.style.top = `${startTop}%`;
        
        leaf.innerHTML = `
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <path d="M 10 90 C 20 50, 45 20, 90 10 C 75 40, 50 80, 10 90 Z" fill="${randomColor}" />
            <path d="M 10 90 Q 50 50 90 10" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round"/>
            <path d="M 30 70 Q 25 60 22 58 M 30 70 Q 38 72 40 73 M 50 50 Q 42 38 38 34 M 50 50 Q 60 55 64 57 M 70 30 Q 62 20 58 16 M 70 30 Q 78 35 80 37" stroke="rgba(255,255,255,0.25)" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        `;
        leavesContainer.appendChild(leaf);
        
        const duration = (1 - (startTop / 100)) * (Math.random() * 10 + 7);
        gsap.to(leaf, {
          y: window.innerHeight - (startTop * window.innerHeight / 100) + 100,
          x: Math.random() * 120 - 60,
          rotation: Math.random() * 360,
          duration: duration,
          ease: "none",
          onComplete: () => leaf.remove()
        });
      }
      
      setInterval(createFloatingLeaf, 2600);
    }

    // 7. Interactive Cursor Aura Mouse-Follower (with smooth GSAP inertia)
    const aura = document.querySelector('.cursor-aura');
    if (aura) {
      gsap.set(aura, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      window.addEventListener('mousemove', e => {
        gsap.to(aura, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.8,
          ease: "power2.out"
        });
      });
    }

    // 8. Live Campus Impact Tracker Cycle Logic
    const ecoTips = [
      "IIT Bombay is aiming to achieve Net-Zero Carbon Emissions by 2047.",
      "Our campus EV shuttle network saves over 12 tons of CO2 annually.",
      "RePedal bicycle sharing facilitates 1,500+ green trips daily across campus.",
      "Solar installations on hostel rooftops generate 1.8MW of clean electricity.",
      "Biogas plants on campus recycle organic waste into fuel for hostel kitchens.",
      "Over 80% of campus waste is segregated at source and composted or recycled."
    ];
    let currentTipIndex = 0;
    function cycleEcoTips() {
      const tipEl = document.getElementById('impact-tip-text');
      if (!tipEl) return;
      
      currentTipIndex = (currentTipIndex + 1) % ecoTips.length;
      
      gsap.to(tipEl, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        onComplete: () => {
          tipEl.textContent = ecoTips[currentTipIndex];
          gsap.fromTo(tipEl, {
            opacity: 0,
            y: 10
          }, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        }
      });
    }
    setInterval(cycleEcoTips, 6000);
  } else {
    initBgThree();
    initThree();
    setupDragHandlers();
    window.addEventListener('resize', positionBadges);
  }
}

// Mobile Menu Toggle
function setupMobileMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('mobile-active');
    });

    const links = navLinks.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('mobile-active');
      });
    });
  }
}

// Start execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startApp();
    setupMobileMenu();
  });
} else {
  startApp();
  setupMobileMenu();
}
