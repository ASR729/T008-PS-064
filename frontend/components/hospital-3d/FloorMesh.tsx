"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  BedStatus,
} from "../../types/hospital-3d";
import { BedMesh } from "./BedMesh";

interface FloorMeshProps {
  floor: HospitalFloor;
  beds: HospitalBed[];
  isExplodedView: boolean;
  isFloorSelected: boolean;
  hasFloorSelection: boolean; // whether ANY floor is selected
  selectedWardId: string | null;
  selectedBedId: string | null;
  hoveredWardId: string | null;
  statusFilter: BedStatus | "all";
  onSelectFloor: (floorId: string) => void;
  onSelectWard: (ward: HospitalWard) => void;
  onSelectBed: (bed: HospitalBed) => void;
  onHoverWard: (wardId: string | null) => void;
  onHoverBed: (bedId: string | null) => void;
}

export const FloorMesh: React.FC<FloorMeshProps> = ({
  floor,
  beds,
  isExplodedView,
  isFloorSelected,
  hasFloorSelection,
  selectedWardId,
  selectedBedId,
  hoveredWardId,
  statusFilter,
  onSelectFloor,
  onSelectWard,
  onSelectBed,
  onHoverWard,
  onHoverBed,
}) => {
  // Compute Y elevation based on exploded state
  const yPosition = isExplodedView ? floor.elevation * 1.9 : floor.elevation;

  // Dimming logic if another floor is selected
  const isDimmed = hasFloorSelection && !isFloorSelected;
  const slabOpacity = isDimmed ? 0.12 : isFloorSelected ? 0.95 : 0.85;

  const floorWidth = floor.dimensions.width;
  const floorDepth = floor.dimensions.depth;

  // Memoize perimeter line coordinates
  const perimeterPoints = useMemo(() => {
    const hw = floorWidth / 2;
    const hd = floorDepth / 2;
    return [
      new THREE.Vector3(-hw, 0.22, -hd),
      new THREE.Vector3(hw, 0.22, -hd),
      new THREE.Vector3(hw, 0.22, hd),
      new THREE.Vector3(-hw, 0.22, hd),
      new THREE.Vector3(-hw, 0.22, -hd),
    ];
  }, [floorWidth, floorDepth]);

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(perimeterPoints);
    return geom;
  }, [perimeterPoints]);

  return (
    <group position={[0, yPosition, 0]}>
      {/* Main Floor Slab */}
      <mesh
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectFloor(floor.id);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[floorWidth, 0.4, floorDepth]} />
        <meshStandardMaterial
          color={isFloorSelected ? "#14253D" : "#0A1728"}
          roughness={0.5}
          metalness={0.4}
          transparent
          opacity={slabOpacity}
        />
      </mesh>

      {/* Illuminated Edge Trim */}
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
              color: isFloorSelected
                ? "#38D9F5"
                : isDimmed
                ? "#1E3A5F"
                : "#22C7A9",
              linewidth: 2,
              transparent: true,
              opacity: isDimmed ? 0.2 : 0.85,
            })
          )
        }
      />

      {/* Central Corridor Pathway */}
      {!isDimmed && (
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, floorDepth - 2]} />
          <meshBasicMaterial color="#142A45" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Render Wards and Zone Boundaries */}
      {floor.wards.map((ward) => {
        const isWardSelected = selectedWardId === ward.id;
        const isWardHovered = hoveredWardId === ward.id;
        const wardColor = new THREE.Color(ward.color);

        const padWidth = ward.bounds.width;
        const padDepth = ward.bounds.depth;
        const padX = ward.bounds.x + padWidth / 2;
        const padZ = ward.bounds.z + padDepth / 2;

        return (
          <group key={ward.id}>
            {/* Ward Floor Zone Tint */}
            <mesh
              position={[padX, 0.21, padZ]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectWard(ward);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHoverWard(ward.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                onHoverWard(null);
                document.body.style.cursor = "auto";
              }}
            >
              <planeGeometry args={[padWidth, padDepth]} />
              <meshBasicMaterial
                color={wardColor}
                transparent
                opacity={
                  isWardSelected
                    ? 0.22
                    : isWardHovered
                    ? 0.16
                    : isDimmed
                    ? 0.03
                    : 0.08
                }
              />
            </mesh>

            {/* Ward Boundary Outline */}
            <mesh position={[padX, 0.23, padZ]}>
              <boxGeometry args={[padWidth, 0.04, padDepth]} />
              <meshBasicMaterial
                color={
                  isWardSelected
                    ? "#38D9F5"
                    : isWardHovered
                    ? "#FFFFFF"
                    : wardColor
                }
                wireframe
                transparent
                opacity={
                  isWardSelected
                    ? 0.9
                    : isWardHovered
                    ? 0.8
                    : isDimmed
                    ? 0.15
                    : 0.45
                }
              />
            </mesh>

            {/* Central Nursing Station for this Ward / Floor */}
            {!isDimmed && (
              <group position={ward.nursingStationPosition}>
                {/* Station Desk */}
                <mesh position={[0, 0.5, 0]} castShadow>
                  <cylinderGeometry
                    args={[1.2, 1.4, 0.7, 16, 1, false, 0, Math.PI * 1.5]}
                  />
                  <meshStandardMaterial
                    color="#142C4B"
                    roughness={0.3}
                    metalness={0.7}
                  />
                </mesh>
                {/* Monitor Console */}
                <mesh position={[0, 0.95, 0]}>
                  <boxGeometry args={[0.8, 0.25, 0.1]} />
                  <meshBasicMaterial color="#38D9F5" />
                </mesh>
                {/* Central Point Beacon */}
                <pointLight
                  position={[0, 1.2, 0]}
                  color="#38D9F5"
                  intensity={0.6}
                  distance={3}
                />
              </group>
            )}
          </group>
        );
      })}

      {/* Render All Beds on this Floor */}
      {beds.map((bed) => {
        const isSelected = selectedBedId === bed.id;
        const isFilteredOut =
          statusFilter !== "all" && bed.status !== statusFilter;

        return (
          <BedMesh
            key={bed.id}
            bed={bed}
            isSelected={isSelected}
            isFilteredOut={isDimmed || isFilteredOut}
            onSelect={onSelectBed}
            onHover={onHoverBed}
          />
        );
      })}

      {/* Floor Label Marker on Corner */}
      <group position={[-floorWidth / 2 - 1.2, 0.6, floorDepth / 2]}>
        {/* Plaque Mesh */}
        <mesh>
          <boxGeometry args={[0.2, 0.6, 2.8]} />
          <meshBasicMaterial
            color={isFloorSelected ? "#38D9F5" : "#10233B"}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
};
