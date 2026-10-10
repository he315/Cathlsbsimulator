import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Html } from "@react-three/drei";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { smoothPolyline } from "../../utils/math";
import { add, scale } from "../../utils/math";
import { v3, COLORS, engColor, vesselColor } from "./helpers";
import type { Vec3 } from "../../types";

function Vessels() {
  const model = useSimulatorStore((s) => s.model);
  const filled = useSimulatorStore((s) => s.contrastFilled);
  const opacity = useSimulatorStore((s) => s.contrastOpacity);
  const overlays = useSimulatorStore((s) => s.overlays);

  return (
    <>
      {model.vessels.map((v) => {
        const pts = smoothPolyline(v.points, 6).map(v3);
        const isFilled = filled.includes(v.id) && opacity > 0.02;
        const base = vesselColor(v.id);
        return (
          <group key={v.id}>
            {overlays.transparent && (
              <Line points={pts} color={base} lineWidth={1.4} transparent opacity={0.28} />
            )}
            {isFilled && (
              <Line
                points={pts}
                color={COLORS.contrast}
                lineWidth={3.2}
                transparent
                opacity={Math.min(1, opacity + 0.15)}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

function Ostia() {
  const model = useSimulatorStore((s) => s.model);
  const overlays = useSimulatorStore((s) => s.overlays);
  if (!overlays.ostia) return null;
  const os = [
    { p: model.lm.pos, c: COLORS.left, label: "LM" },
    { p: model.rca.pos, c: COLORS.right, label: "RCA" },
  ];
  if (model.leftOstium2) os.push({ p: model.leftOstium2.pos, c: COLORS.left, label: "LCx" });
  return (
    <>
      {os.map((o, i) => (
        <group key={i} position={v3(o.p)}>
          <mesh>
            <sphereGeometry args={[1.4, 16, 16]} />
            <meshStandardMaterial color={o.c} emissive={o.c} emissiveIntensity={0.4} />
          </mesh>
          {overlays.labels && (
            <Html center distanceFactor={90} style={{ pointerEvents: "none" }}>
              <div className="text-[12px] px-1 rounded bg-base-900/80 border border-line text-ink-soft">
                {o.label}
              </div>
            </Html>
          )}
        </group>
      ))}
    </>
  );
}

function Cusps() {
  const model = useSimulatorStore((s) => s.model);
  const overlays = useSimulatorStore((s) => s.overlays);
  if (!overlays.cusps) return null;
  return (
    <>
      {model.cusps.map((c) => (
        <group key={c.id} position={v3(c.pos)}>
          <mesh>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color={COLORS.safe} transparent opacity={0.5} />
          </mesh>
          {overlays.labels && (
            <Html center distanceFactor={110} style={{ pointerEvents: "none" }}>
              <div className="text-[12px] text-ink-faint">{c.id}</div>
            </Html>
          )}
        </group>
      ))}
    </>
  );
}

function Root() {
  const model = useSimulatorStore((s) => s.model);
  const overlays = useSimulatorStore((s) => s.overlays);
  const h = model.sinusTopY;
  return (
    <>
      {/* Aortic root */}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[model.sinusRadius, model.sinusRadius * 0.92, h, 40, 1, true]} />
        <meshStandardMaterial
          color={COLORS.accent}
          transparent
          opacity={0.08}
          side={2}
        />
      </mesh>
      {/* Ascending aorta */}
      <mesh position={[0, h + 12, 0]}>
        <cylinderGeometry args={[model.sinusRadius * 0.7, model.sinusRadius * 0.82, 24, 32, 1, true]} />
        <meshStandardMaterial color={COLORS.accent} transparent opacity={0.06} side={2} />
      </mesh>
      {/* Valve plane */}
      {overlays.valvePlane && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[model.sinusRadius * 1.02, 40]} />
          <meshBasicMaterial color={COLORS.danger} transparent opacity={0.16} side={2} />
        </mesh>
      )}
      {/* LV danger zone */}
      <mesh position={[0, -12, 0]}>
        <coneGeometry args={[model.sinusRadius * 0.9, 22, 28, 1, true]} />
        <meshBasicMaterial color={COLORS.danger} transparent opacity={0.05} side={2} />
      </mesh>
    </>
  );
}

function Catheter() {
  const model = useSimulatorStore((s) => s.model);
  const tip = useSimulatorStore((s) => s.tip);
  const eng = useSimulatorStore((s) => s.engagement);
  const controls = useSimulatorStore((s) => s.controls);
  const color = engColor(eng);

  const entry: Vec3 = { x: 0, y: model.sinusTopY + 24, z: 0 };
  const mid: Vec3 = { x: tip.pos.x * 0.25, y: tip.height + 8, z: tip.pos.z * 0.25 };
  const shaft = [entry, mid, tip.pos].map(v3);
  const wireEnd = add(tip.pos, scale(tip.dir, controls.wireInsertion));

  return (
    <>
      <Line points={shaft} color={color} lineWidth={3.4} />
      <mesh position={v3(tip.pos)}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      {controls.wireInsertion > 0.1 && (
        <Line points={[tip.pos, wireEnd].map(v3)} color={COLORS.safe} lineWidth={1.6} />
      )}
    </>
  );
}

export default function AnatomyScene() {
  const tilt = useSimulatorStore((s) => s.model.aortaTiltRad);
  return (
    <Canvas camera={{ position: [46, 26, 58], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#070b11"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[30, 50, 40]} intensity={0.8} />
      <directionalLight position={[-40, 10, -30]} intensity={0.3} />
      <group rotation={[0, 0, tilt]}>
        <Root />
        <Vessels />
        <Ostia />
        <Cusps />
        <Catheter />
      </group>
      <OrbitControls makeDefault enablePan={false} minDistance={30} maxDistance={140} target={[0, 8, 0]} />
    </Canvas>
  );
}
