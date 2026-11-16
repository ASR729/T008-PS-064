"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CameraViewPreset, HospitalFloor } from "../../types/hospital-3d";

interface CameraControllerProps {
  viewPreset: CameraViewPreset;
  selectedFloor: HospitalFloor | null;
  isExplodedView: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  resetTrigger: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  viewPreset,
  selectedFloor,
  isExplodedView,
  controlsRef,
  resetTrigger,
}) => {
  const { camera } = useThree();
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(28, 26, 32));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 6, 0));
  const isTransitioningRef = useRef<boolean>(true);

  // Compute desired camera position and lookAt
  useEffect(() => {
    isTransitioningRef.current = true;

    if (selectedFloor) {
      const elevation = isExplodedView
        ? selectedFloor.elevation * 1.9
        : selectedFloor.elevation;
      targetLookAtRef.current.set(0, elevation, 0);
      targetPosRef.current.set(18, elevation + 12, 22);
      return;
    }

    const yCenter = isExplodedView ? 10 : 6;
    targetLookAtRef.current.set(0, yCenter, 0);

    switch (viewPreset) {
      case "front":
        targetPosRef.current.set(0, yCenter + 6, 38);
        break;
      case "top":
        targetPosRef.current.set(0, 45, 0.05);
        break;
      case "side":
        targetPosRef.current.set(40, yCenter + 6, 0);
        break;
      case "isometric":
      default:
        targetPosRef.current.set(28, yCenter + 18, 32);
        break;
    }
  }, [viewPreset, selectedFloor, isExplodedView, resetTrigger]);

  useFrame(() => {
    if (!isTransitioningRef.current) return;

    // Smooth lerp camera position
    camera.position.lerp(targetPosRef.current, 0.08);

    // Smooth lerp OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAtRef.current, 0.08);
      controlsRef.current.update();
    }

    // Stop lerp when close enough
    if (camera.position.distanceTo(targetPosRef.current) < 0.1) {
      isTransitioningRef.current = false;
    }
  });

  return null;
};
