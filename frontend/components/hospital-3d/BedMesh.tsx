"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HospitalBed } from "../../types/hospital-3d";
import { STATUS_CONFIG } from "../../lib/hospital-3d-data";

interface BedMeshProps {
  bed: HospitalBed;
  isSelected: boolean;
  isFilteredOut: boolean;
  onSelect: (bed: HospitalBed) => void;
  onHover: (bedId: string | null) => void;
}

export const BedMesh: React.FC<BedMeshProps> = ({
  bed,
  isSelected,
  isFilteredOut,
  onSelect,
  onHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const statusConfig = STATUS_CONFIG[bed.status];
  const statusColor = new THREE.Color(statusConfig.color);

  // Subtle pulsing animation on beacon when selected or critical
  useFrame(({ clock }) => {
    if (beaconRef.current) {
      if (isSelected) {
        const scale = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.25;
        beaconRef.current.scale.set(scale, scale, scale);
      } else if (bed.status === "critical") {
        const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        beaconRef.current.scale.set(scale, scale, scale);
      }
    }
  });

  const baseOpacity = isFilteredOut ? 0.15 : hovered ? 1 : 0.88;

  return (
    <group
      ref={groupRef}
      position={bed.position}
      rotation={[0, bed.rotation || 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(bed);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(bed.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Invisible collider gives every bed a reliable, forgiving pointer target. */}
      <mesh
        position={[0, 0.4, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(bed);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          onHover(bed.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[2, 1.1, 1.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Selection Glow Cylinder */}
      {isSelected && (
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 1.2, 16]} />
          <meshBasicMaterial
            color="#38D9F5"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Bed Base Frame (Metallic Grey/Navy) */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.2, 0.9]} />
        <meshStandardMaterial
          color={isSelected ? "#1E3A5F" : hovered ? "#1A3252" : "#0F2035"}
          roughness={0.4}
          metalness={0.7}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* Mattress (Medical White/Silver) */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.14, 0.82]} />
        <meshStandardMaterial
          color={hovered ? "#FFFFFF" : "#E2E8F0"}
          roughness={0.7}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* Pillow */}
      <mesh position={[-0.65, 0.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.08, 0.65]} />
        <meshStandardMaterial
          color="#F8FAFC"
          roughness={0.9}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* Headboard */}
      <mesh position={[-0.88, 0.45, 0]} castShadow>
        <boxGeometry args={[0.08, 0.55, 0.9]} />
        <meshStandardMaterial
          color="#162A45"
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* Footboard */}
      <mesh position={[0.88, 0.3, 0]} castShadow>
        <boxGeometry args={[0.06, 0.3, 0.9]} />
        <meshStandardMaterial
          color="#162A45"
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* Medical Telemetry / IV Pole Stand */}
      <mesh position={[-0.8, 0.75, 0.52]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Status Beacon / Monitor Beacon at head of bed */}
      <mesh ref={beaconRef} position={[-0.8, 1.25, 0.52]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Small Point Light from Status Beacon */}
      {(hovered || isSelected || bed.status === "critical") && (
        <pointLight
          position={[-0.8, 1.25, 0.52]}
          color={statusColor}
          intensity={isSelected ? 1.5 : 0.8}
          distance={2.5}
        />
      )}

      {/* Hover Tooltip Ring */}
      {hovered && !isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.15, 24]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};
