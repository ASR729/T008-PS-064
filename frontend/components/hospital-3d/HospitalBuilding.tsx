"use client";

import React from "react";
import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  BedStatus,
} from "../../types/hospital-3d";
import { FloorMesh } from "./FloorMesh";

interface HospitalBuildingProps {
  floors: HospitalFloor[];
  allBeds: HospitalBed[];
  isExplodedView: boolean;
  selectedFloorId: string | null;
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

export const HospitalBuilding: React.FC<HospitalBuildingProps> = ({
  floors,
  allBeds,
  isExplodedView,
  selectedFloorId,
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
  const roofElevation = isExplodedView ? 12.6 * 1.9 + 3.4 : 12.6 + 3.4;

  return (
    <group position={[0, 0, 0]}>
      {/* GROUND PODIUM & SITE BASE */}
      <group position={[0, -0.4, 0]}>
        {/* Main Base Foundation */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[44, 0.6, 34]} />
          <meshStandardMaterial
            color="#050C16"
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>

        {/* Outer Perimeter Glowing Grid */}
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[42, 32]} />
          <meshBasicMaterial color="#0B1A2D" />
        </mesh>

        {/* Entrance Forecourt / Ambulance Bay */}
        <mesh position={[0, 0.32, 13]}>
          <boxGeometry args={[16, 0.05, 4]} />
          <meshStandardMaterial color="#0F243E" roughness={0.6} />
        </mesh>

        {/* Ambulance Bay Markings */}
        <mesh position={[-4, 0.35, 13]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 16]} />
          <meshBasicMaterial color="#F06474" />
        </mesh>
        <mesh position={[4, 0.35, 13]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 16]} />
          <meshBasicMaterial color="#F06474" />
        </mesh>

        {/* Entrance Canopy */}
        <group position={[0, 1.6, 11.5]}>
          <mesh castShadow>
            <boxGeometry args={[12, 0.25, 3.5]} />
            <meshStandardMaterial
              color="#10253F"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.15, 1.6]}>
            <boxGeometry args={[11.8, 0.05, 0.1]} />
            <meshBasicMaterial color="#38D9F5" />
          </mesh>
          {/* Canopy Pillars */}
          <mesh position={[-5.5, -0.8, 1.5]}>
            <cylinderGeometry args={[0.1, 0.1, 1.6, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} />
          </mesh>
          <mesh position={[5.5, -0.8, 1.5]}>
            <cylinderGeometry args={[0.1, 0.1, 1.6, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* RENDER ALL HOSPITAL FLOORS */}
      {floors.map((floor) => {
        const floorBeds = allBeds.filter((b) => b.floorId === floor.id);
        const isFloorSelected = selectedFloorId === floor.id;
        const hasFloorSelection = selectedFloorId !== null;

        return (
          <FloorMesh
            key={floor.id}
            floor={floor}
            beds={floorBeds}
            isExplodedView={isExplodedView}
            isFloorSelected={isFloorSelected}
            hasFloorSelection={hasFloorSelection}
            selectedWardId={selectedWardId}
            selectedBedId={selectedBedId}
            hoveredWardId={hoveredWardId}
            statusFilter={statusFilter}
            onSelectFloor={onSelectFloor}
            onSelectWard={onSelectWard}
            onSelectBed={onSelectBed}
            onHoverWard={onHoverWard}
            onHoverBed={onHoverBed}
          />
        );
      })}

      {/* ROOF STRUCTURE & HELIPAD */}
      <group position={[0, roofElevation, 0]}>
        {/* Roof Slab */}
        <mesh receiveShadow castShadow position={[0, 0, 0]}>
          <boxGeometry args={[30, 0.4, 20]} />
          <meshStandardMaterial
            color="#091524"
            roughness={0.6}
            metalness={0.4}
          />
        </mesh>

        {/* Roof Perimeter Safety Railing Line */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[29.8, 0.3, 19.8]} />
          <meshBasicMaterial color="#38D9F5" wireframe transparent opacity={0.3} />
        </mesh>

        {/* EMERGENCY HELIPAD */}
        <group position={[-6, 0.22, 0]}>
          {/* Landing Pad Circle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[5.2, 32]} />
            <meshStandardMaterial color="#0D1E33" roughness={0.7} />
          </mesh>
          {/* Yellow Outer Safety Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[4.8, 5.0, 32]} />
            <meshBasicMaterial color="#F5B942" />
          </mesh>
          {/* Inner Circle Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[3.2, 3.4, 32]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
          </mesh>
          {/* Helipad 'H' Marking (Procedural using thin boxes) */}
          <mesh position={[-0.9, 0.02, 0]}>
            <boxGeometry args={[0.3, 0.02, 2.8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.9, 0.02, 0]}>
            <boxGeometry args={[0.3, 0.02, 2.8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[1.5, 0.02, 0.3]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>

          {/* 4 Perimeter Helipad Amber Beacons */}
          <pointLight position={[4.6, 0.4, 0]} color="#F5B942" intensity={0.4} distance={3} />
          <pointLight position={[-4.6, 0.4, 0]} color="#F5B942" intensity={0.4} distance={3} />
          <pointLight position={[0, 0.4, 4.6]} color="#F5B942" intensity={0.4} distance={3} />
          <pointLight position={[0, 0.4, -4.6]} color="#F5B942" intensity={0.4} distance={3} />
        </group>

        {/* MECHANICAL HVAC & ELEVATOR PENTHOUSE */}
        <group position={[8, 1.2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[8, 2.0, 9]} />
            <meshStandardMaterial
              color="#10253F"
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
          {/* HVAC Vents */}
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 0.5, 16]} />
            <meshStandardMaterial color="#1E385B" metalness={0.8} />
          </mesh>
          <mesh position={[2.4, 1.1, 2]}>
            <boxGeometry args={[1.6, 0.6, 1.6]} />
            <meshStandardMaterial color="#1E385B" metalness={0.8} />
          </mesh>

          {/* Glowing Medical Cross Emblem on Penthouse Facade */}
          <group position={[0, 0.2, 4.52]}>
            <mesh>
              <boxGeometry args={[0.35, 1.2, 0.04]} />
              <meshBasicMaterial color="#22C58B" />
            </mesh>
            <mesh>
              <boxGeometry args={[1.2, 0.35, 0.04]} />
              <meshBasicMaterial color="#22C58B" />
            </mesh>
            <pointLight position={[0, 0, 0.2]} color="#22C58B" intensity={1.2} distance={4} />
          </group>
        </group>
      </group>

      {/* CORNER STRUCTURAL COLUMNS (Only in standard view for architectural realism) */}
      {!isExplodedView && selectedFloorId === null && (
        <group>
          {/* 4 Corner Structural Glass/Titanium Columns */}
          {[
            [-14.8, -9.8],
            [14.8, -9.8],
            [14.8, 9.8],
            [-14.8, 9.8],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, 8, z]}>
              <boxGeometry args={[0.6, 16, 0.6]} />
              <meshStandardMaterial
                color="#0E2138"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
