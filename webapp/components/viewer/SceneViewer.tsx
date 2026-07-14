"use client";
// R3F viewport for a kinematic scene. Owns the Canvas + frame loop; all scene
// state lives in the SceneEngine, which the parent drives (selection,
// visibility) via onReady.
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SceneEngine, type Inst } from "./engine";
import type { SceneData } from "@/lib/scene";

export interface ViewerProps {
  scene: SceneData;
  playing: boolean;
  rpm: number;
  reversed: boolean;
  onReady?: (engine: SceneEngine, insts: Inst[]) => void;
  onPick?: (inst: Inst | null) => void;
}

function isShown(o: THREE.Object3D | null): boolean {
  for (let n = o; n; n = n.parent) if (n.visible === false) return false;
  return true;
}

function Rig({ scene, playing, rpm, reversed, onReady, onPick }: ViewerProps) {
  const engine = useMemo(() => new SceneEngine(), []);
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const [built, setBuilt] = useState(0);
  const baseDirection = useRef(1);

  useEffect(() => {
    let alive = true;
    engine.build(scene).then(() => {
      if (!alive) return;
      baseDirection.current = engine.direction;
      // frame the assembly
      const box = engine.bounds();
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const r = Math.max(size.x, size.y, size.z) || 100;
      camera.position.set(c.x + r * 0.9, c.y + r * 0.55, c.z + r * 0.95);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.near = r / 500;
        camera.far = r * 500;
        camera.updateProjectionMatrix();
      }
      controls.current?.target.copy(c);
      controls.current?.update();
      setBuilt((n) => n + 1);
      onReady?.(engine, engine.insts);
    });
    return () => {
      alive = false;
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, engine]);

  useEffect(() => {
    engine.direction = baseDirection.current * (reversed ? -1 : 1);
  }, [engine, reversed, built]);

  useFrame((_, dt) => engine.tick(Math.min(dt, 0.1), rpm, playing));

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return; // drag, not click
    e.stopPropagation();
    const hit = e.intersections.find(
      (h) => h.object.userData.inst && isShown(h.object),
    );
    onPick?.(hit ? (hit.object.userData.inst as Inst) : null);
  };

  return (
    <>
      <hemisphereLight args={[0xffffff, 0x60656f, 1.2]} />
      <directionalLight position={[1, 1.2, 1]} intensity={1.3} />
      <directionalLight position={[-1, 0.4, -1]} intensity={0.5} />
      <directionalLight position={[0.2, -1, -0.3]} intensity={0.7} />
      <primitive
        object={engine.root}
        onClick={handleClick}
        onPointerMissed={() => onPick?.(null)}
      />
      <OrbitControls ref={controls} makeDefault enableDamping />
    </>
  );
}

export default function SceneViewer(props: ViewerProps) {
  return (
    <Canvas
      camera={{ fov: 45, position: [150, 100, 160] }}
      gl={{ antialias: true }}
      style={{ background: "#15171c" }}
    >
      <Rig {...props} />
    </Canvas>
  );
}
