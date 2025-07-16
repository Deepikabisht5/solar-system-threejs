
// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
if (window.innerWidth < 600) {
  camera.position.set(0, 60, 180);
  camera.fov = 90;
} else {
  camera.position.set(0, 80, 220);
}
camera.updateProjectionMatrix();

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CSS2DRenderer for labels
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 500;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1));
const sunLight = new THREE.PointLight(0xffffff, 1, 100);
scene.add(sunLight);

// Texture loader
const loader = new THREE.TextureLoader();

// Background
scene.background = loader.load('star.jpg');
// 🌌 Starfield Particle System
const starsGeometry = new THREE.BufferGeometry();
const starCount = 1000; // number of stars
const positions = [];
const sizes = [];
const opacity = [];

// Generate random star positions and opacities
for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  positions.push(x, y, z);
  sizes.push(Math.random() * 1.5 + 0.5); // random star sizes
  opacity.push(Math.random());
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 2,
  transparent: true,
  opacity : 1,
  blending : THREE.AdditiveBlending,
  depthWrite: false
});

const starPoints = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starPoints);

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  tooltip.style.left = event.clientX + 10 + 'px';
  tooltip.style.top = event.clientY + 10 + 'px';
});

// Sun
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ map: loader.load('sunmap.jpg') });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets data
const planetsData = [
  { name: 'Mercury', size: 3, orbit: 25, speed: 0.02, texture: 'mercurymap.jpg', rotationSpeed: 0.004 },
  { name: 'Venus', size: 4, orbit: 35, speed: 0.015, texture: 'venusmap.jpg', rotationSpeed: -0.001 },
  { name: 'Earth', size: 5, orbit: 48, speed: 0.01, texture: 'earthmap.jpg', rotationSpeed: 0.02 },
  { name: 'Mars', size: 4.5, orbit: 60, speed: 0.008, texture: 'marsmap.jpg', rotationSpeed: 0.018 },
  { name: 'Jupiter', size: 8, orbit: 75, speed: 0.006, texture: 'jupitermap.jpg', rotationSpeed: 0.04 },
  { name: 'Saturn', size: 7, orbit: 90, speed: 0.005, texture: 'saturnmap.jpg', rotationSpeed: 0.03 },
  { name: 'Uranus', size: 6, orbit: 105, speed: 0.004, texture: 'uranusmap.jpg', rotationSpeed: -0.025 },
  { name: 'Neptune', size: 6, orbit: 120, speed: 0.003, texture: 'neptunemap.jpg', rotationSpeed: 0.028 },
];

// Static labels evenly spread on orbit
planetsData.forEach((data, index, array) => {
  const labelDiv = document.createElement('div');
  labelDiv.textContent = data.name;
  labelDiv.style.color = 'white'; // pure text, no background
  labelDiv.style.fontFamily = 'sans-serif';
  labelDiv.style.fontSize = '14px';

  const label = new THREE.CSS2DObject(labelDiv);

  // Evenly spaced angles around full circle
  const angle = (index / array.length) * Math.PI * 2;

  label.position.set(
    data.orbit * Math.cos(angle),
    0,
    data.orbit * Math.sin(angle)
  );

  scene.add(label);
});

// Responsive scaling
if (window.innerWidth < 600) {
  planetsData.forEach(p => { p.size *= 0.6; p.orbit *= 0.6; });
}

const planets = [];
planetsData.forEach(data => {
  const geometry = new THREE.SphereGeometry(data.size, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: loader.load(data.texture),
    metalness: 0.1,
    roughness: 0.8
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    orbit: data.orbit,
    speed: data.speed,
    angle: Math.random() * Math.PI * 2,
    rotationSpeed: data.rotationSpeed
  };
  mesh.name = data.name;
  scene.add(mesh);
  planets.push(mesh);

  // Axial tilt
  mesh.rotation.z = { Mercury: 0, Venus: 3.1, Earth: 0.41, Mars: 0.44, Jupiter: 0.05, Saturn: 0.46, Uranus: 0.46, Neptune: 0.49 }[data.name] || 0;

  // Rings
  if (data.name === 'Saturn') mesh.add(createRing(data.size + 1.5, data.size + 4, 'saturnring.png'));
  if (data.name === 'Uranus') mesh.add(createRing(data.size + 1, data.size + 2.5, 'uranusring.png'));
});

// Orbit circles
planetsData.forEach(data => {
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitVertices = [];
  for (let i = 0; i <= 100; i++) {
    const theta = (i / 100) * Math.PI * 2;
    orbitVertices.push(data.orbit * Math.cos(theta), 0, data.orbit * Math.sin(theta));
  }
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitVertices, 3));
  scene.add(new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })));
});

// Rings helper
function createRing(innerRadius, outerRadius, texturePath) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const texture = loader.load(texturePath);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

// GUI controls
const gui = new dat.GUI();
const folder = gui.addFolder('Planet Speeds');
planets.forEach(p => folder.add(p.userData, 'speed', 0, 0.05).name(p.name + ' Speed'));
folder.open();

let globalSpeedMultiplier = 1;
gui.add({ multiplier: 1 }, 'multiplier', 0, 5).name('Global Speed').onChange(v => globalSpeedMultiplier = v);

let paused = false;
gui.add({ Pause: () => paused = !paused }, 'Pause').name('Pause/Resume');

// Zoom controls
gui.add({ ZoomIn: () => camera.position.z -= 10 }, 'ZoomIn').name('Zoom In');
gui.add({ ZoomOut: () => camera.position.z += 10 }, 'ZoomOut').name('Zoom Out');

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    sun.rotation.y += 0.004;
    planets.forEach(p => {
      p.userData.angle += p.userData.speed * globalSpeedMultiplier;
      p.position.x = p.userData.orbit * Math.cos(p.userData.angle);
      p.position.z = p.userData.orbit * Math.sin(p.userData.angle);
      p.rotation.y += p.userData.rotationSpeed;
    });
  }

  // Tooltip
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    tooltip.style.display = 'block';
    tooltip.innerHTML = intersects[0].object.name;
  } else {
    tooltip.style.display = 'none';
  }

  controls.update();
  // Animate star opacity for blinking effect
const positionsArray = starsGeometry.attributes.position.array;

for (let i = 0; i < positionsArray.length; i += 3) {
  const starOpacity = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + i);
  starsMaterial.opacity = starOpacity;
}
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera); // render labels
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

