import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { SYSTEMS } from "./content.js";

const DEFAULT_OPACITY = {
  skeletal: 1,
  muscular: 0.11,
  nervous: 1,
  cardiovascular: 1,
  respiratory: 0.82,
  digestive: 1,
  urinary: 1,
  endocrine: 1,
  lymphatic: 1,
  reproductive: 1,
  integumentary: 0.16,
};
const OFFSETS = {
  skeletal: [0, 0, 0],
  muscular: [-180, 0, 40],
  nervous: [0, 35, 150],
  cardiovascular: [180, 0, 90],
  respiratory: [220, 35, 90],
  digestive: [-210, -35, 170],
  urinary: [160, -20, -100],
  endocrine: [100, 35, 100],
  lymphatic: [-90, 10, 150],
  reproductive: [0, -100, 200],
  integumentary: [-320, 0, -90],
};
export class AnatomyViewer {
  constructor(canvas, { onSelect, onProgress, onHover, onState } = {}) {
    this.canvas = canvas;
    this.callbacks = { onSelect, onProgress, onHover, onState };
    this.meshes = new Map();
    this.selected = new Set();
    this.hidden = new Set();
    this.isolated = null;
    this.explode = 0;
    this.explodeTarget = 0;
    this.dirty = true;
    this.ready = false;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.systems = Object.fromEntries(
      SYSTEMS.map((s) => [
        s.id,
        {
          visible: !["integumentary", "cardiovascular"].includes(s.id),
          opacity: DEFAULT_OPACITY[s.id],
        },
      ]),
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 15000);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.rotateSpeed = 0.65;
    this.controls.panSpeed = 0.7;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 7000;
    this.controls.addEventListener("change", () => {
      this.dirty = true;
      this.callbacks.onState?.();
    });
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8e9b81, 1.6));
    const key = new THREE.DirectionalLight(0xfff5e8, 2.5);
    key.position.set(-1000, 1500, 2000);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9e9f0, 1.2);
    fill.position.set(1400, 500, -800);
    this.scene.add(fill);
    const front = new THREE.DirectionalLight(0xffffff, 0.4);
    front.position.set(0, -100, 2500);
    this.scene.add(front);
    this.body = new THREE.Group();
    this.scene.add(this.body);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.canvas.addEventListener("pointerdown", (e) => {
      this.pointerStart = [e.clientX, e.clientY];
    });
    this.canvas.addEventListener("pointerup", (e) => {
      if (
        this.pointerStart &&
        Math.hypot(
          e.clientX - this.pointerStart[0],
          e.clientY - this.pointerStart[1],
        ) < 5
      ) {
        const hit = this.pick(e);
        if (hit)
          this.callbacks.onSelect?.(
            hit.userData.meta.concept,
            hit.userData.meta.id,
          );
      }
      this.pointerStart = null;
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (e.buttons) return;
      const now = performance.now();
      if (now - (this.lastHover || 0) < 80) return;
      this.lastHover = now;
      const hit = this.pick(e);
      if (this.hovered !== hit) {
        this.hovered = hit;
        this.canvas.style.cursor = hit ? "pointer" : "grab";
        this.callbacks.onHover?.(hit?.userData.meta, e);
      }
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.hovered = null;
      this.callbacks.onHover?.(null);
    });
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.callbacks.onProgress?.({
        error:
          "The graphics context was interrupted. Reload to restore the anatomy viewer.",
      });
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      location.reload();
    });
    this.renderer.setAnimationLoop(() => this.tick());
  }
  async load() {
    const response = await fetch("./assets/anatomy/catalog.json");
    if (!response.ok)
      throw new Error("The anatomy catalog could not be loaded.");
    this.catalog = await response.json();
    const [lo, hi] = this.catalog.bounds;
    this.origin = new THREE.Vector3(...lo)
      .add(new THREE.Vector3(...hi))
      .multiplyScalar(0.5);
    this.height = hi[1] - lo[1];
    this.body.position.copy(this.origin).negate();
    this.concepts = new Map(this.catalog.concepts.map((c) => [c.id, c]));
    this.meshMeta = new Map(this.catalog.meshes.map((m) => [m.id, m]));
    this.home(true);
    let done = 0;
    const queue = [
      "skeletal",
      "muscular",
      "respiratory",
      "digestive",
      "nervous",
      "urinary",
      "endocrine",
      "lymphatic",
      "reproductive",
      "cardiovascular",
      "integumentary",
    ];
    const worker = async () => {
      while (queue.length) {
        const system = queue.shift();
        await this.loadSystem(system);
        done++;
        this.callbacks.onProgress?.({
          percent: (done / 11) * 100,
          system,
          count: this.meshes.size,
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    this.ready = true;
    this.applyState();
    this.callbacks.onProgress?.({
      percent: 100,
      complete: true,
      count: this.meshes.size,
    });
    return this.catalog;
  }
  async loadSystem(system) {
    const bundle = this.catalog.files[system];
    if (!bundle) return;
    const response = await fetch("./assets/anatomy/" + bundle.file);
    if (!response.ok)
      throw new Error("Could not load the " + system + " system.");
    if (!("DecompressionStream" in window))
      throw new Error(
        "This browser does not support compressed 3D assets. Please use a current version of Chrome, Edge, Firefox, or Safari.",
      );
    const buffer = await new Response(
      response.body.pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
    if (buffer.byteLength !== bundle.decodedBytes)
      throw new Error("The " + system + " model bundle is incomplete.");
    for (const meta of this.catalog.meshes.filter((m) => m.system === system)) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array(buffer, meta.offset, meta.vertices * 3),
          3,
        ),
      );
      geometry.setIndex(
        new THREE.BufferAttribute(
          new Uint32Array(
            buffer,
            meta.offset + meta.vertices * 12,
            meta.indices,
          ),
          1,
        ),
      );
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const color = this.meshColor(meta);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = meta.id;
      const center = new THREE.Vector3(...meta.bounds[0])
        .add(new THREE.Vector3(...meta.bounds[1]))
        .multiplyScalar(0.5);
      const rel = center.clone().sub(this.origin);
      const radial = new THREE.Vector3(rel.x * 1.15, rel.y * 0.35, rel.z * 1.3);
      const offset = new THREE.Vector3(...OFFSETS[system]);
      // A small deterministic displacement separates neighboring components without randomness between sessions.
      const hash = [...meta.id].reduce(
        (a, c) => (a * 31 + c.charCodeAt(0)) >>> 0,
        0,
      );
      const angle = ((hash % 360) * Math.PI) / 180;
      radial
        .add(offset)
        .add(
          new THREE.Vector3(
            Math.cos(angle) * 45,
            ((hash % 13) - 6) * 5,
            Math.sin(angle) * 45,
          ),
        );
      mesh.userData = {
        meta,
        center,
        explodeVector: radial,
        color: new THREE.Color(color),
      };
      this.body.add(mesh);
      this.meshes.set(meta.id, mesh);
    }
    this.applyState();
  }
  meshColor(meta) {
    const n = meta.name.toLowerCase();
    let color = SYSTEMS.find((s) => s.id === meta.system).color;
    if (meta.system === "cardiovascular") {
      if (/vein|venous|vena|sinus/.test(n)) color = "#658da1";
      else if (/heart|atrium|ventricle|valve|myocard/.test(n))
        color = "#b35b50";
      else color = "#c76b59";
    }
    if (meta.system === "digestive") {
      if (/liver|hepato/.test(n)) color = "#945e4d";
      else if (/intestin|colon|ileum|jejunum|cecum/.test(n)) color = "#c99581";
      else if (/stomach/.test(n)) color = "#ca8e89";
      else if (/gallbladder/.test(n)) color = "#819870";
    }
    if (
      meta.system === "nervous" &&
      /brain|cerebr|cerebell|gyrus|lobe|cortex|thalam|pons/.test(n)
    )
      color = "#d7b7a3";
    return color;
  }
  applyState() {
    for (const [id, mesh] of this.meshes) {
      const s = this.systems[mesh.userData.meta.system];
      const chosen = this.selected.has(id);
      mesh.visible =
        (s.visible || chosen) &&
        !this.hidden.has(id) &&
        (!this.isolated || this.isolated.has(id));
      const opacity = chosen ? 1 : s.opacity;
      mesh.material.opacity = opacity;
      mesh.material.transparent = opacity < 1;
      mesh.material.depthWrite = opacity >= 0.9;
      mesh.renderOrder = opacity < 1 ? 2 : 0;
      mesh.material.color.copy(mesh.userData.color);
      mesh.material.emissive.set(chosen ? 0x365929 : 0x000000);
      mesh.material.emissiveIntensity = chosen ? 0.16 : 0;
      mesh.material.needsUpdate = true;
    }
    this.appliedExplode = null;
    this.dirty = true;
    this.callbacks.onState?.();
  }
  setSystem(id, visible) {
    this.systems[id].visible = visible;
    this.isolated = null;
    this.selected.clear();
    this.applyState();
  }
  setOpacity(id, value) {
    this.systems[id].opacity = value;
    this.applyState();
  }
  setPreset(name) {
    this.hidden.clear();
    this.isolated = null;
    this.selected.clear();
    for (const [id, s] of Object.entries(this.systems)) {
      s.opacity = DEFAULT_OPACITY[id];
      s.visible = !["integumentary", "cardiovascular"].includes(id);
      if (name === "surface") {
        s.visible = id === "muscular" || id === "skeletal";
        s.opacity = 1;
      }
      if (name === "skeleton") {
        s.visible = id === "skeletal";
        s.opacity = 1;
      }
      if (name === "organs") {
        s.visible = ![
          "integumentary",
          "muscular",
          "skeletal",
          "cardiovascular",
        ].includes(id);
        s.opacity = 1;
      }
    }
    this.applyState();
  }
  showSystems(ids) {
    this.hidden.clear();
    this.isolated = null;
    this.selected.clear();
    for (const [id, s] of Object.entries(this.systems)) {
      s.visible = ids.includes(id);
      s.opacity = 1;
    }
    this.applyState();
  }
  select(ids) {
    this.selected = new Set(ids);
    for (const id of ids) this.hidden.delete(id);
    if (this.isolated) {
      this.isolated = new Set(ids);
      this.updateIsolationVectors();
    }
    this.appliedExplode = null;
    this.applyState();
  }
  clearSelection() {
    this.selected.clear();
    this.isolated = null;
    this.appliedExplode = null;
    this.applyState();
  }
  isolateSelection() {
    this.isolated = new Set(this.selected);
    this.updateIsolationVectors();
    this.appliedExplode = null;
    this.applyState();
    this.focusSelection();
  }
  hideSelection() {
    for (const id of this.selected) this.hidden.add(id);
    this.selected.clear();
    this.isolated = null;
    this.appliedExplode = null;
    this.applyState();
  }
  updateIsolationVectors() {
    const box = new THREE.Box3();
    for (const id of this.isolated) {
      const m = this.meshes.get(id);
      if (m)
        box.union(
          new THREE.Box3(
            new THREE.Vector3(...m.userData.meta.bounds[0]),
            new THREE.Vector3(...m.userData.meta.bounds[1]),
          ),
        );
    }
    const center = box.getCenter(new THREE.Vector3());
    for (const id of this.isolated) {
      const m = this.meshes.get(id);
      if (m)
        m.userData.isolationVector = m.userData.center
          .clone()
          .sub(center)
          .multiplyScalar(0.8);
    }
  }
  explosionVector(mesh) {
    return this.isolated && this.isolated.has(mesh.name)
      ? mesh.userData.isolationVector || mesh.userData.explodeVector
      : mesh.userData.explodeVector;
  }
  selectionBounds(predicted = false) {
    const box = new THREE.Box3();
    for (const id of this.selected) {
      const m = this.meshes.get(id);
      if (!m) continue;
      const b = new THREE.Box3(
        new THREE.Vector3(...m.userData.meta.bounds[0]),
        new THREE.Vector3(...m.userData.meta.bounds[1]),
      );
      b.translate(this.body.position).translate(
        predicted
          ? this.explosionVector(m)
              .clone()
              .multiplyScalar(this.explodeTarget * 2)
          : m.position,
      );
      box.union(b);
    }
    return box;
  }
  focusSelection() {
    const box = this.selectionBounds(true);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = Math.max(size.length() * 1.8, 130);
    const direction = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    this.animateCamera(
      center.clone().addScaledVector(direction, distance),
      center,
    );
  }
  home(immediate = false) {
    if (!this.origin) return;
    const aspect =
      this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    const target = new THREE.Vector3(
      0,
      this.height * (aspect < 0.8 ? -0.11 : -0.08),
      0,
    );
    const dist =
      (this.height / (2 * Math.tan(THREE.MathUtils.degToRad(17.5)))) *
      (aspect < 0.8 ? 1.56 : 1.39) *
      Math.max(1, 0.6 / aspect) *
      (1 + this.explodeTarget * 0.5);
    this.animateCamera(new THREE.Vector3(0, target.y, dist), target, immediate);
  }
  angle(side) {
    const directions = {
      front: [0, 0, 1],
      back: [0, 0, -1],
      left: [1, 0, 0],
      right: [-1, 0, 0],
    };
    const distance = this.camera.position.distanceTo(this.controls.target);
    const pos = this.controls.target
      .clone()
      .add(new THREE.Vector3(...directions[side]).multiplyScalar(distance));
    this.animateCamera(pos, this.controls.target.clone());
  }
  animateCamera(position, target, immediate = false) {
    if (immediate || this.reducedMotion) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.dirty = true;
      return;
    }
    this.cameraAnimation = {
      from: this.camera.position.clone(),
      targetFrom: this.controls.target.clone(),
      to: position,
      targetTo: target,
      start: performance.now(),
    };
  }
  zoom(factor) {
    const delta = this.camera.position
      .clone()
      .sub(this.controls.target)
      .multiplyScalar(factor);
    delta.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(delta);
    this.controls.update();
    this.dirty = true;
  }
  setExplode(value) {
    this.explodeTarget = value;
    if (this.reducedMotion) this.explode = value;
    this.dirty = true;
    if (this.isolated) this.focusSelection();
    else this.home();
  }
  setSlice(axis, value) {
    if (!axis) {
      this.renderer.clippingPlanes = [];
    } else {
      const normal = new THREE.Vector3(
        ...{ sagittal: [-1, 0, 0], coronal: [0, 0, -1], axial: [0, -1, 0] }[
          axis
        ],
      );
      const dim = { sagittal: 0, coronal: 2, axial: 1 }[axis];
      const min = this.catalog.bounds[0][dim] - this.origin.getComponent(dim);
      const max = this.catalog.bounds[1][dim] - this.origin.getComponent(dim);
      const coordinate = min + (max - min) * value;
      this.renderer.clippingPlanes = [new THREE.Plane(normal, coordinate)];
    }
    this.dirty = true;
  }
  setAutoRotate(value) {
    this.controls.autoRotate = value;
    this.dirty = true;
  }
  pick(e) {
    if (!this.ready) return null;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = [...this.meshes.values()].filter(
      (m) => m.visible && m.material.opacity > 0.25,
    );
    return this.raycaster
      .intersectObjects(meshes, false)
      .find((hit) =>
        this.renderer.clippingPlanes.every(
          (plane) => plane.distanceToPoint(hit.point) >= 0,
        ),
      )?.object;
  }
  resize() {
    const width = this.canvas.parentElement.clientWidth,
      height = this.canvas.parentElement.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }
  projectedSelection() {
    if (!this.selected.size) return null;
    const box = this.selectionBounds();
    if (box.isEmpty()) return null;
    const center = box.getCenter(new THREE.Vector3()).project(this.camera);
    return {
      x: ((center.x + 1) * this.canvas.clientWidth) / 2,
      y: ((1 - center.y) * this.canvas.clientHeight) / 2,
      visible: center.z < 1 && center.z > -1,
    };
  }
  direction() {
    const d = this.camera.position.clone().sub(this.controls.target);
    if (Math.abs(d.x) > Math.abs(d.z))
      return d.x > 0 ? "LEFT LATERAL" : "RIGHT LATERAL";
    return d.z > 0 ? "ANTERIOR" : "POSTERIOR";
  }
  tick() {
    if (this.contextLost) return;
    if (this.cameraAnimation) {
      const a = this.cameraAnimation;
      const p = Math.min((performance.now() - a.start) / 650, 1);
      const t = 1 - Math.pow(1 - p, 3);
      this.camera.position.lerpVectors(a.from, a.to, t);
      this.controls.target.lerpVectors(a.targetFrom, a.targetTo, t);
      this.dirty = true;
      if (p === 1) this.cameraAnimation = null;
    }
    if (Math.abs(this.explode - this.explodeTarget) > 0.0005) {
      this.explode += (this.explodeTarget - this.explode) * 0.1;
      this.dirty = true;
    } else if (this.explode !== this.explodeTarget) {
      this.explode = this.explodeTarget;
      this.dirty = true;
    }
    if (this.appliedExplode !== this.explode) {
      for (const m of this.meshes.values())
        m.position
          .copy(this.explosionVector(m))
          .multiplyScalar(this.explode * 2);
      this.appliedExplode = this.explode;
      this.dirty = true;
    }
    this.controls.update();
    if (this.dirty || this.controls.autoRotate) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      this.callbacks.onState?.();
    }
  }
  screenshot() {
    this.renderer.render(this.scene, this.camera);
    const out = document.createElement("canvas");
    out.width = this.canvas.width;
    out.height = this.canvas.height + 92;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#f4f4ed";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(this.canvas, 0, 0);
    ctx.fillStyle = "#35503e";
    ctx.font = "20px Georgia";
    ctx.fillText(
      "Human Atlas · " +
        (this.explodeTarget ? "Exploded anatomy" : "Anatomy explorer"),
      22,
      out.height - 54,
    );
    ctx.font = "11px sans-serif";
    ctx.fillText(
      "BodyParts3D, © The Database Center for Life Science · CC BY 4.0",
      22,
      out.height - 31,
    );
    ctx.fillText(
      "Adult male reference · Simplified educational model",
      22,
      out.height - 13,
    );
    return out.toDataURL("image/png");
  }
  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    for (const m of this.meshes.values()) {
      m.geometry.dispose();
      m.material.dispose();
    }
    this.renderer.dispose();
  }
}
