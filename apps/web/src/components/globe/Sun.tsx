"use client"

import { useRef, useMemo } from "react"
import { useFrame }  from "@react-three/fiber"
import * as THREE    from "three"
import { useSunMaterial } from "./PlanetMaterial"
import React from "react"

const CORONA_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal  = normalize(mat3(modelMatrix) * normal);
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-pos.xyz);
    gl_Position = projectionMatrix * pos;
  }
`

const CORONA_FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 2.8);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.4);
    vec3 inner = vec3(1.00, 0.55, 0.05);
    vec3 outer = vec3(1.00, 0.20, 0.00);
    vec3 col = mix(inner, outer, rim);
    gl_FragColor = vec4(col, rim * 0.7 * pulse);
  }
`

const FLARE_FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 1.4);
    float pulse = 0.6 + 0.4 * sin(uTime * 0.7 + 1.5);
    gl_FragColor = vec4(1.0, 0.35, 0.0, rim * 0.18 * pulse);
  }
`

export function Sun() {
  const meshRef    = useRef<THREE.Mesh>(null!)
  const coronaRef  = useRef<THREE.Mesh>(null!)
  const flareRef   = useRef<THREE.Mesh>(null!)
  const timeRef    = useRef(0)
  const mat        = useSunMaterial(timeRef)

  const coronaMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   CORONA_VERT,
    fragmentShader: CORONA_FRAG,
    uniforms:    { uTime: { value: 0 } },
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false,
  }), [])

  const flareMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   CORONA_VERT,
    fragmentShader: FLARE_FRAG,
    uniforms:    { uTime: { value: 0 } },
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false,
  }), [])

  useFrame((_, dt) => {
    timeRef.current += dt
    mat.uniforms.uTime.value        = timeRef.current
    coronaMat.uniforms.uTime.value  = timeRef.current
    flareMat.uniforms.uTime.value   = timeRef.current
    if (meshRef.current)   meshRef.current.rotation.y   += dt * 0.012
    if (coronaRef.current) coronaRef.current.rotation.y += dt * 0.008
    if (flareRef.current)  flareRef.current.rotation.y  -= dt * 0.005
  })

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={meshRef} material={mat}>
        <sphereGeometry args={[1.5, 128, 128]} />
      </mesh>

      {/* Inner corona glow */}
      <mesh ref={coronaRef} material={coronaMat} scale={[1.12, 1.12, 1.12]}>
        <sphereGeometry args={[1.5, 64, 64]} />
      </mesh>

      {/* Outer diffuse flare */}
      <mesh ref={flareRef} material={flareMat} scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[1.5, 32, 32]} />
      </mesh>

      {/* Point light so the sun actually illuminates the scene */}
      <pointLight
        color="#FF9030"
        intensity={6}
        distance={80}
        decay={1.2}
      />
    </group>
  )
}