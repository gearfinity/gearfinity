// SceneEngine — imperative three.js core of the configurator, ported from the
// proven web/configurator.html. Owns GLB loading, placement (SolidWorks
// row-vector rotations -> transposed), exact gear-train animation, and
// per-instance highlight / ghost / hide. React (SceneViewer.tsx) drives it.
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { chainStages, type StageRates } from "@/lib/gear-train";
import type { Kin, SceneData } from "@/lib/scene";

export interface Inst {
  id: number;
  stem: string;
  src: string;
  kin: Kin;
  obj: THREE.Object3D;
  base: THREE.Matrix4;
  /** spin axis anchor (mm): kin.center when present, else the part origin */
  pos0: THREE.Vector3;
  axisOrigin: THREE.Vector3; // mm
  axisDir: THREE.Vector3;
  ghost: boolean;
  hidden: boolean;
}

const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

// cache GLTFs per URL; every INSTANCE gets a deep clone with cloned materials
// (instances highlight/ghost independently, like the original's per-load parse)
const gltfCache = new Map<string, Promise<GLTF>>();
function loadGltf(url: string): Promise<GLTF> {
  let p = gltfCache.get(url);
  if (!p) {
    p = gltfLoader.loadAsync(url);
    gltfCache.set(url, p);
  }
  return p;
}
function cloneWithMaterials(src: THREE.Object3D): THREE.Object3D {
  const c = src.clone(true);
  c.traverse((ch) => {
    const mesh = ch as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
    }
  });
  return c;
}

// rotation about an arbitrary axis (point + dir): T(p) . R . T(-p)
const _R = new THREE.Matrix4();
const _moved = new THREE.Vector3();
function rotAbout(out: THREE.Matrix4, point: THREE.Vector3, dir: THREE.Vector3, angle: number) {
  out.makeRotationAxis(dir, angle);
  _moved.copy(point).applyMatrix4(out);
  out.setPosition(point.x - _moved.x, point.y - _moved.y, point.z - _moved.z);
  return out;
}

export class SceneEngine {
  /** Z-up assembly frame; rotate into three.js Y-up world */
  readonly root = new THREE.Group();
  insts: Inst[] = [];
  rates: (StageRates | Omit<StageRates, "ratio">)[] = [];
  direction = 1;
  theta = 0;
  private nextId = 1;

  constructor() {
    this.root.rotation.x = -Math.PI / 2;
  }

  async build(scene: SceneData): Promise<void> {
    this.dispose();
    this.direction = scene.direction ?? 1;
    this.theta = 0;

    const chain = chainStages(scene.kinematics.stages.map((s) => s.teeth));
    this.rates = scene.kinematics.stages.map((s, i) => s.rates ?? chain.stages[i]);

    const loaded = await Promise.all(
      scene.parts.map(async (p) => {
        if (!p.url) return null;
        try {
          return { p, gltf: await loadGltf(p.url.startsWith("/") ? p.url : `/${p.url}`) };
        } catch {
          return null;
        }
      }),
    );

    for (const item of loaded) {
      if (!item) continue;
      const { p } = item;
      const obj = cloneWithMaterials(item.gltf.scene);
      const a = p.transform;
      // SolidWorks ArrayData rotation is ROW-VECTOR convention -> transpose
      // for three.js column vectors; metres -> mm.
      const M = new THREE.Matrix4().set(
        a[0], a[3], a[6], a[9],
        a[1], a[4], a[7], a[10],
        a[2], a[5], a[8], a[11],
        0, 0, 0, 1,
      );
      obj.applyMatrix4(new THREE.Matrix4().makeScale(1000, 1000, 1000).multiply(M));
      obj.updateMatrix();

      const stageKin = scene.kinematics.stages[p.kin?.stage ?? 0];
      const axis = stageKin?.axis ?? { origin: [0, 0, 0], dir: [0, 0, 1] };
      const base = obj.matrix.clone();
      const inst: Inst = {
        id: this.nextId++,
        stem: p.src.replace(/\.SLDPRT$/i, ""),
        src: p.src,
        kin: p.kin ?? { role: "static", stage: 0 },
        obj,
        base,
        pos0: p.kin?.center
          ? new THREE.Vector3(...p.kin.center).multiplyScalar(1000)
          : new THREE.Vector3().setFromMatrixPosition(base),
        axisOrigin: new THREE.Vector3(...axis.origin).multiplyScalar(1000),
        axisDir: new THREE.Vector3(...axis.dir).normalize(),
        ghost: false,
        hidden: false,
      };
      obj.traverse((ch) => {
        ch.userData.inst = inst;
      });
      if (inst.kin.role !== "static") obj.matrixAutoUpdate = false;
      this.root.add(obj);
      this.insts.push(inst);
    }
  }

  /** advance time + pose every animated instance (port of tick()) */
  private _orbit = new THREE.Matrix4();
  private _spin = new THREE.Matrix4();
  tick(dt: number, rpm: number, playing: boolean) {
    if (playing) this.theta += (dt * rpm * 2 * Math.PI * this.direction) / 60;
    for (const inst of this.insts) {
      const s = this.rates[inst.kin.stage];
      if (!s || inst.kin.role === "static") continue;
      const rate = s[inst.kin.role] ?? 0;
      const ang = rate * this.theta;
      if (inst.kin.role === "planet") {
        // orbit about the stage axis at carrier rate + spin about the
        // planet's own station at planet-minus-carrier rate
        rotAbout(this._orbit, inst.axisOrigin, inst.axisDir, s.carrier * this.theta);
        rotAbout(this._spin, inst.pos0, inst.axisDir, (s.planet - s.carrier) * this.theta);
        inst.obj.matrix.copy(this._orbit).multiply(this._spin).multiply(inst.base);
      } else {
        rotAbout(this._orbit, inst.axisOrigin, inst.axisDir, ang);
        inst.obj.matrix.copy(this._orbit).multiply(inst.base);
      }
      inst.obj.matrixWorldNeedsUpdate = true;
    }
  }

  rateOf(inst: Inst): number {
    const s = this.rates[inst.kin.stage];
    if (!s || inst.kin.role === "static") return 0;
    return s[inst.kin.role] ?? 0;
  }

  setHighlight(insts: Inst[], on: boolean) {
    for (const inst of insts)
      inst.obj.traverse((ch) => {
        const mesh = ch as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats as THREE.MeshStandardMaterial[]) {
          if (!m.emissive) continue;
          if (on) {
            if (!m.userData._e) m.userData._e = m.emissive.clone();
            m.emissive.set(0x2f6bff);
          } else if (m.userData._e) {
            m.emissive.copy(m.userData._e);
            delete m.userData._e;
          }
        }
      });
  }

  // CAD-style ghost: DoubleSide is essential — with translucent front faces
  // you must see the back faces or shells look like they lost faces.
  applyVis(inst: Inst) {
    inst.obj.visible = !inst.hidden;
    inst.obj.traverse((ch) => {
      const mesh = ch as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.renderOrder = inst.ghost ? 10 : 0;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats as THREE.MeshStandardMaterial[]) {
        if (inst.ghost) {
          if (m.userData._o === undefined)
            m.userData._o = { t: m.transparent, o: m.opacity, d: m.depthWrite, s: m.side };
          m.transparent = true;
          m.opacity = 0.25;
          m.depthWrite = false;
          m.side = THREE.DoubleSide;
        } else if (m.userData._o !== undefined) {
          m.transparent = m.userData._o.t;
          m.opacity = m.userData._o.o;
          m.depthWrite = m.userData._o.d;
          m.side = m.userData._o.s;
          delete m.userData._o;
        }
        m.needsUpdate = true;
      }
    });
  }

  bounds(): THREE.Box3 {
    this.root.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.root);
  }

  dispose() {
    for (const inst of this.insts) this.root.remove(inst.obj);
    this.insts = [];
    this.rates = [];
    this.theta = 0;
  }
}
