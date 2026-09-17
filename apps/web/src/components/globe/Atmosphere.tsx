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

  uniform vec3  innerColor;
  uniform vec3  outerColor;
  uniform float intensity;

  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 3.5);

    vec3 col = mix(innerColor, outerColor, rim) * rim * intensity;
    gl_FragColor = vec4(col, rim * 0.7);
  }
`

export function Atmosphere() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG,
    uniforms: {
      innerColor: { value: new THREE.Color(0x80C8FF) },
      outerColor: { value: new THREE.Color(0x0066FF) },
      intensity:  { value: 1.2 },
    },
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false,
  }), [])

  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
