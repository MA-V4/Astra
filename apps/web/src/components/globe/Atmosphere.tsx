"use client"

import { useMemo } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal  = normalize(mat3(modelMatrix) * normal);
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-pos.xyz);
    gl_Position = projectionMatrix * pos;
  }
`

const FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 5.0);
    vec3 col = mix(vec3(0.1, 0.3, 0.6), vec3(0.2, 0.5, 1.0), rim);
    gl_FragColor = vec4(col, rim * 0.4);
  }
`

export function Atmosphere() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false,
  }), [])

  return (
    <mesh scale={[1.04, 1.04, 1.04]}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}