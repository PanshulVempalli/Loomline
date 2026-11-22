/* Loomline 3D logo: the thread "L", node and ring, floating, turning with scroll and cursor,
   with three UI chips orbiting it. Three.js is only downloaded when the section is near. */
const host = document.getElementById('orb');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (host) {
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    start().catch(() => host.remove());
  }, { rootMargin: '600px' });
  io.observe(host);
}

function chipTexture(THREE, kind) {
  const c = document.createElement('canvas'); c.width = 360; c.height = 240;
  const g = c.getContext('2d');
  g.fillStyle = '#15123A'; g.strokeStyle = '#14B8A6'; g.lineWidth = 6;
  g.beginPath(); g.roundRect(6, 6, 348, 228, 36); g.fill(); g.stroke();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'chat') {
    g.fillStyle = '#2A2766'; g.beginPath(); g.roundRect(36, 44, 200, 54, 27); g.fill();
    g.fillStyle = '#14B8A6'; g.beginPath(); g.roundRect(124, 120, 200, 54, 27); g.fill();
    g.fillStyle = '#F4F4FB'; [70, 100, 130].forEach((x) => { g.beginPath(); g.arc(x, 71, 9, 0, Math.PI * 2); g.fill(); });
  } else if (kind === 'web') {
    g.strokeStyle = '#99F6E4'; g.lineWidth = 5; g.beginPath(); g.roundRect(40, 40, 280, 160, 16); g.stroke();
    g.beginPath(); g.moveTo(40, 76); g.lineTo(320, 76); g.stroke();
    g.fillStyle = '#FB7185'; [60, 80, 100].forEach((x) => { g.beginPath(); g.arc(x, 58, 6, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#F4F4FB'; g.fillRect(64, 98, 130, 16); g.fillStyle = '#5EEAD4'; g.fillRect(64, 126, 100, 10);
    g.fillStyle = '#FB7185'; g.beginPath(); g.roundRect(64, 152, 76, 26, 13); g.fill();
    g.fillStyle = '#14B8A6'; g.fillRect(214, 98, 84, 80);
  } else {
    g.strokeStyle = '#14B8A6'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(180, 34); g.lineTo(262, 62); g.lineTo(262, 112); g.bezierCurveTo(262, 160, 222, 190, 180, 206);
    g.bezierCurveTo(138, 190, 98, 160, 98, 112); g.lineTo(98, 62); g.closePath(); g.stroke();
    g.strokeStyle = '#FB7185'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(118, 120); g.lineTo(150, 120); g.lineTo(164, 92); g.lineTo(182, 150); g.lineTo(198, 106); g.lineTo(208, 120); g.lineTo(242, 120); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

async function start() {
  const THREE = await import('./vendor/three.module.min.js');
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 8.8);

  scene.add(new THREE.AmbientLight(0x8f8de0, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 5); scene.add(key);
  const rimT = new THREE.PointLight(0x14b8a6, 30, 12); rimT.position.set(-3, 1, 2); scene.add(rimT);
  const rimC = new THREE.PointLight(0xfb7185, 26, 12); rimC.position.set(3, -2, 2); scene.add(rimC);

  // the logo
  const logo = new THREE.Group(); scene.add(logo);
  const inner = new THREE.Group(); inner.position.set(-0.75, -0.2, 0); logo.add(inner);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, -0.45, 0),
    new THREE.Vector3(0.12, -0.95, 0), new THREE.Vector3(0.6, -1.15, 0), new THREE.Vector3(1.75, -1.15, 0)], false, 'catmullrom', 0.2);
  const tubeGeo = new THREE.TubeGeometry(curve, 220, 0.17, 24, false);
  const teal = new THREE.MeshPhysicalMaterial({ color: 0x14b8a6, emissive: 0x0f766e, emissiveIntensity: 0.45, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.15 });
  const tube = new THREE.Mesh(tubeGeo, teal); inner.add(tube);
  const coral = new THREE.MeshPhysicalMaterial({ color: 0xfb7185, emissive: 0xfb7185, emissiveIntensity: 0.35, roughness: 0.25, clearcoat: 1 });
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 32), coral); node.position.set(0, 1.7, 0); inner.add(node);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 24, 72), coral); ring.position.set(2.15, -1.15, 0); inner.add(ring);

  // orbiting chips
  const chips = ['chat', 'web', 'care'].map((kind, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.7), new THREE.MeshBasicMaterial({ map: chipTexture(THREE, kind), transparent: true }));
    m.userData = { phase: (i / 3) * Math.PI * 2, speed: 0.32 + i * 0.05, tilt: 0.35 + i * 0.12 };
    scene.add(m); return m;
  });

  // drifting thread particles
  const count = 160, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 1.6, a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI;
    pos[i * 3] = Math.cos(a) * Math.cos(b) * r; pos[i * 3 + 1] = Math.sin(b) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r - 1;
  }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x5eead4, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(host);

  // inputs: scroll progress through the section and the cursor
  const section = host.closest('section');
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  const scrollP = () => { const r = section.getBoundingClientRect(); return Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height))); };

  // the thread draws itself in the first time the scene is shown
  const fullCount = tubeGeo.index.count; let drawn = reduce ? 1 : 0;
  const clock = new THREE.Clock();

  const frame = (t) => {
    const p = scrollP();
    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    if (drawn < 1) { drawn = Math.min(1, drawn + 0.012); }
    const e = 1 - Math.pow(1 - drawn, 3);
    tubeGeo.setDrawRange(0, Math.floor(fullCount * e / 6) * 6);
    node.scale.setScalar(0.4 + 0.6 * Math.min(1, e * 1.6));
    ring.scale.setScalar(Math.max(0.001, (e - 0.75) * 4 > 1 ? 1 : Math.max(0.001, (e - 0.75) * 4)));
    ring.rotation.y = t * 0.8;
    logo.position.y = Math.sin(t * 1.1) * 0.12;
    logo.rotation.y = -0.7 + p * 1.6 + tx * 0.6;
    logo.rotation.x = -0.12 + ty * 0.4 + Math.sin(t * 0.7) * 0.05;
    logo.rotation.z = Math.sin(t * 0.5) * 0.04;
    chips.forEach((c) => {
      const { phase, speed, tilt } = c.userData, a = phase + t * speed;
      c.position.set(Math.cos(a) * 1.95, Math.sin(a * 1.3) * 0.5 + Math.sin(a) * tilt, Math.sin(a) * 1.4);
      c.lookAt(camera.position); c.rotation.z += Math.sin(t + phase) * 0.06;
      c.material.opacity = 0.55 + 0.45 * ((Math.sin(a) + 1) / 2);
    });
    dust.rotation.y = t * 0.04; dust.rotation.x = Math.sin(t * 0.2) * 0.1;
    renderer.render(scene, camera);
  };

  if (reduce) { frame(0); return; }
  let visible = true, raf = 0;
  const loop = () => { raf = 0; if (!visible) return; frame(clock.getElapsedTime()); raf = requestAnimationFrame(loop); };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(host);
  raf = requestAnimationFrame(loop);
}
