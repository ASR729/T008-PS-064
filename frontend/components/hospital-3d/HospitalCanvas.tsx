"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  BedStatus,
  CameraViewPreset,
} from "../../types/hospital-3d";
import { HospitalBuilding } from "./HospitalBuilding";
import { CameraController } from "./CameraController";
import { SceneControls } from "./SceneControls";
import { WebGLFallbackView } from "./WebGLFallbackView";
import { Activity } from "lucide-react";

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(
      "[3D Hospital] WebGL initialization prevented or context lost. Rendering accessible schematic floorplan fallback.",
      error
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface HospitalCanvasProps {
  floors: HospitalFloor[];
  allBeds: HospitalBed[];
  selectedFloorId: string | null;
  selectedWardId: string | null;
  selectedBedId: string | null;
  statusFilter: BedStatus | "all";
  onSelectFloor: (floorId: string | null) => void;
  onSelectWard: (ward: HospitalWard | null) => void;
  onSelectBed: (bed: HospitalBed | null) => void;
  onSetStatusFilter: (status: BedStatus | "all") => void;
  onClearSelection: () => void;
}

export const HospitalCanvas: React.FC<HospitalCanvasProps> = ({
  floors,
  allBeds,
  selectedFloorId,
  selectedWardId,
  selectedBedId,
  statusFilter,
  onSelectFloor,
  onSelectWard,
  onSelectBed,
  onSetStatusFilter,
  onClearSelection,
}) => {
  const [isExplodedView, setIsExplodedView] = useState(false);
  const [viewPreset, setViewPreset] = useState<CameraViewPreset>("isometric");
  const [hoveredWardId, setHoveredWardId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.85);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.15);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    setViewPreset("isometric");
    setResetTrigger((prev) => prev + 1);
  };

  const selectedFloor =
    floors.find((f) => f.id === selectedFloorId) || null;

  // Render placeholder during SSR / hydration
  if (!mounted) {
    return (
      <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[720px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#06101E] via-[#09172B] to-[#050C16] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-8 h-8 text-[#38D9F5] animate-pulse mb-3" />
        <span className="text-xs font-semibold text-[#F3F7FC] tracking-wider uppercase">
          Initializing 3D Hospital Engine
        </span>
        <span className="text-[11px] text-[#7E90A8] mt-1">
          Building procedural floors and bed geometry...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[720px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#06101E] via-[#09172B] to-[#050C16] border border-white/10 shadow-2xl select-none">
      {/* 3D Scene Interactive Overlay Controls */}
      <SceneControls
        floors={floors}
        selectedFloorId={selectedFloorId}
        selectedWardId={selectedWardId}
        selectedBedId={selectedBedId}
        isExplodedView={isExplodedView}
        viewPreset={viewPreset}
        statusFilter={statusFilter}
        onToggleExplodedView={() => setIsExplodedView((prev) => !prev)}
        onSetViewPreset={setViewPreset}
        onSelectFloor={onSelectFloor}
        onSetStatusFilter={onSetStatusFilter}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetCamera={handleResetCamera}
        onClearSelection={onClearSelection}
      />

      {/* R3F WebGL Canvas with Error Boundary Protection */}
      <CanvasErrorBoundary
        fallback={
          <WebGLFallbackView
            floors={floors}
            allBeds={allBeds}
            selectedFloorId={selectedFloorId}
            selectedWardId={selectedWardId}
            selectedBedId={selectedBedId}
            statusFilter={statusFilter}
            onSelectFloor={onSelectFloor}
            onSelectWard={onSelectWard}
            onSelectBed={onSelectBed}
            onSetStatusFilter={onSetStatusFilter}
          />
        }
      >
        <Canvas
          camera={{
            position: [28, 26, 32],
            fov: 42,
            near: 0.1,
            far: 1000,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 2]}
          shadows
        >
          <Suspense fallback={null}>
            {/* Ambient Lighting */}
            <ambientLight intensity={0.65} color="#C4DBF6" />

            {/* Key Directional Sun Light */}
            <directionalLight
              position={[30, 45, 25]}
              intensity={1.2}
              color="#FFFFFF"
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-near={0.5}
              shadow-camera-far={120}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
            />

            {/* Cyan Fill Light from Opposite Side */}
            <directionalLight
              position={[-25, 20, -20]}
              intensity={0.5}
              color="#38D9F5"
            />

            {/* Soft Violet Upward Bounce Light */}
            <pointLight
              position={[0, -2, 0]}
              intensity={0.4}
              color="#9B87FF"
              distance={50}
            />

            {/* 3D Modular Hospital Building */}
            <HospitalBuilding
              floors={floors}
              allBeds={allBeds}
              isExplodedView={isExplodedView}
              selectedFloorId={selectedFloorId}
              selectedWardId={selectedWardId}
              selectedBedId={selectedBedId}
              hoveredWardId={hoveredWardId}
              statusFilter={statusFilter}
              onSelectFloor={(floorId) => {
                onSelectFloor(selectedFloorId === floorId ? null : floorId);
              }}
              onSelectWard={(ward) => {
                onSelectWard(selectedWardId === ward.id ? null : ward);
              }}
              onSelectBed={onSelectBed}
              onHoverWard={setHoveredWardId}
              onHoverBed={() => {}}
            />

            {/* Smooth Camera Controller */}
            <CameraController
              viewPreset={viewPreset}
              selectedFloor={selectedFloor}
              isExplodedView={isExplodedView}
              controlsRef={controlsRef}
              resetTrigger={resetTrigger}
            />

            {/* Orbit Controls with Sensible Medical Inspection Limits */}
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.06}
              maxPolarAngle={Math.PI / 2 - 0.04} // Do not navigate underground
              minPolarAngle={0.1}
              minDistance={8}
              maxDistance={75}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* On-screen Navigation Guide Hint */}
      <div className="hidden lg:flex items-center gap-4 absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#0B1728]/80 backdrop-blur-md border border-white/10 text-[11px] text-[#7E90A8] pointer-events-none shadow-lg">
        <span className="flex items-center gap-1.5 text-[#B6C4D5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38D9F5]" />
          Drag to Orbit
        </span>
        <span>•</span>
        <span>Right-Click or Two-Finger to Pan</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
        <span>•</span>
        <span className="text-[#38D9F5]">Click any Bed to Inspect</span>
      </div>
    </div>
  );
};
