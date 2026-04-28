import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Float } from "@react-three/drei";
import * as THREE from "three";

function Block({ position, score, index, total, isLatest }) {
  const ref = useRef();
  const [hov, setHov] = useState(false);

  const color = score >= 90 ? "#f59e0b" : score >= 75 ? "#7c3aed" : score >= 60 ? "#06b6d4" : score >= 40 ? "#10b981" : "#2a2e3a";
  const sc = hov ? 1.4 : isLatest ? 1.1 : 0.6 + (index / total) * 0.4;

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.005;
  });

  return (
    <group position={position}>
      <mesh ref={ref} scale={sc} onPointerOver={() => setHov(true)} onPointerOut={() => setHov(false)}>
        <icosahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color} emissive={color}
          emissiveIntensity={hov ? 1.2 : isLatest ? 0.6 : 0.1}
          transparent opacity={hov ? 0.95 : 0.5 + (index / total) * 0.5}
          roughness={0.2} metalness={0.8}
        />
      </mesh>
      {(hov || isLatest) && (
        <pointLight color={color} intensity={hov ? 1.5 : 0.4} distance={hov ? 3 : 1.5} />
      )}
    </group>
  );
}

function ChainSpiral({ sessions }) {
  const groupRef = useRef();
  useFrame((s) => { if (groupRef.current) groupRef.current.rotation.y += 0.0008; });

  const points = useMemo(() => {
    return sessions.map((s, i) => {
      const t = i / Math.max(sessions.length - 1, 1);
      const angle = t * Math.PI * 2 * Math.max(sessions.length / 3, 1);
      const radius = 0.3 + t * 2.2;
      const height = t * 3.5 - 1.75;
      return [radius * Math.cos(angle), height, radius * Math.sin(angle)];
    });
  }, [sessions]);

  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return c.getPoints(points.length * 30).map(p => [p.x, p.y, p.z]);
  }, [points]);

  return (
    <group ref={groupRef}>
      {curve && <Line points={curve} color="#7c3aed" lineWidth={1.5} transparent opacity={0.15} />}
      {sessions.map((s, i) => (
        <Block key={s.id || i} position={points[i]} score={s.score} index={i} total={sessions.length} isLatest={i === sessions.length - 1} />
      ))}
      <mesh position={[0, -1.75, 0]}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial color="#2a2e3a" emissive="#7c3aed" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function GridFloor() {
  const lines = useMemo(() => {
    const l = [];
    for (let i = -5; i <= 5; i++) {
      l.push([[-5, -2.2, i], [5, -2.2, i]]);
      l.push([[i, -2.2, -5], [i, -2.2, 5]]);
    }
    return l;
  }, []);
  return <>{lines.map((p, i) => <Line key={i} points={p} color="#7c3aed" lineWidth={0.3} transparent opacity={0.04} />)}</>;
}

function FloatingHex() {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.1;
    ref.current.rotation.z = Math.cos(s.clock.elapsedTime * 0.2) * 0.05;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={ref}>
        {[2.5, 2.0, 1.5].map((r, i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 6, 0]}>
            <torusGeometry args={[r, 0.008, 6, 6]} />
            <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.3 - i * 0.08} transparent opacity={0.12 - i * 0.03} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export default function ChainViz3D({ sessions = [], height = 400, showHex = false }) {
  const hasSessions = sessions.length > 0;
  const demo = useMemo(() => {
    if (hasSessions) return sessions;
    return Array.from({ length: 12 }, (_, i) => ({
      id: "d" + i, score: 25 + Math.floor(Math.random() * 70),
      degrees_delta: 80 + Math.random() * 250, session_hash: "0".repeat(64)
    }));
  }, [sessions, hasSessions]);

  return (
    <div style={{ width: "100%", height, position: "relative", borderRadius: 14, overflow: "hidden", background: "radial-gradient(ellipse at center, rgba(124,58,237,0.03), transparent 70%)" }}>
      <Canvas camera={{ position: [3.5, 2, 4.5], fov: 40 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#7c3aed" />
        <pointLight position={[-4, -2, -4]} intensity={0.15} color="#06b6d4" />
        <pointLight position={[0, 3, 0]} intensity={0.1} color="#f59e0b" />
        <ChainSpiral sessions={demo} />
        <GridFloor />
        {showHex && <FloatingHex />}
        <OrbitControls enableDamping dampingFactor={0.04} enablePan={false} minDistance={2} maxDistance={12} autoRotate={!hasSessions} autoRotateSpeed={0.4} />
      </Canvas>
      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>
        <span className="m" style={{ fontSize: 9, color: "rgba(124,58,237,0.3)", letterSpacing: "0.12em" }}>
          {hasSessions ? sessions.length + " BLOCKS SEALED" : "DEMO CHAIN"} // DRAG TO ROTATE // SCROLL TO ZOOM
        </span>
      </div>
    </div>
  );
}