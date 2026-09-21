"use client"

import { useRef, useMemo, Suspense } from "react"
import { useFrame }      from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE        from "three"
import { PLANET_MAP }    from "@/lib/planets"
import { usePlanetMaterial } from "./PlanetMaterial"
import { Sun } from "./Sun"

const ATM_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal  = normalize(mat3(modelMatrix) * normal);
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-pos.xyz);
    gl_Position = projectionMatrix * pos;
  }
`
const ATM_FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform vec3 color;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 4.2);
    gl_FragColor = vec4(color, rim * 0.55);
  }
`

function PlanetSphere({ id }: { id: string }) {
  const planet  = PLANET_MAP[id]
  const meshRef = useRef<THREE.Mesh>(null!)
  const mat     = usePlanetMaterial(id)

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.05
  })

  if (!planet) return null

  return (
    <mesh
      ref={meshRef}
      material={mat}
      rotation={[planet.axialTilt * Math.PI / 180, 0, 0]}
    >
      <sphereGeometry args={[planet.threeRadius, 96, 96]} />
    </mesh>
  )
}

function Atmosphere({ id }: { id: string }) {
  const planet = PLANET_MAP[id]
  if (!planet?.atmosphere) return null

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   ATM_VERT,
    fragmentShader: ATM_FRAG,
    uniforms: { color: { value: new THREE.Color(planet.color) } },
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    depthWrite:  false,
  }), [planet])

  return (
    <mesh scale={[1.05, 1.05, 1.05]}>
      <sphereGeometry args={[planet.threeRadius, 32, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function Rings({ id }: { id: string }) {
  const planet = PLANET_MAP[id]
  if (!planet?.hasRings) return null

  const inner = planet.threeRadius * 1.35
  const outer = planet.threeRadius * (id === "saturn" ? 2.5 : 1.8)

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color:       new THREE.Color(planet.ringColor ?? "#C8B87A"),
    transparent: true,
    opacity:     id === "saturn" ? 0.65 : 0.35,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  }), [planet, id])

  return (
    <mesh rotation={[Math.PI / (id === "saturn" ? 2.3 : 2.8), 0, 0]} material={mat}>
      <ringGeometry args={[inner, outer, 128]} />
    </mesh>
  )
}

function Moons({ id }: { id: string }) {
  const planet = PLANET_MAP[id]
  if (!planet || planet.moons === 0) return null

  const count    = Math.min(planet.moons, id === "saturn" ? 6 : id === "jupiter" ? 4 : 2)
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.25
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const dist  = planet.threeRadius * (1.9 + i * 0.55)
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * dist,
              Math.sin(angle * 0.3) * planet.threeRadius * 0.25,
              Math.sin(angle) * dist,
            ]}
          >
            <sphereGeometry args={[planet.threeRadius * 0.10, 12, 12]} />
            <meshPhongMaterial color="#8899AA" />
          </mesh>
        )
      })}
    </group>
  )
}

function MissionDots({ id }: { id: string }) {
  const planet = PLANET_MAP[id]
  const active = planet?.missions.filter(m => m.active) ?? []
  if (active.length === 0) return null

  const groupRef = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.12
  })

  return (
    <group ref={groupRef}>
      {active.map((m, i) => {
        const angle = (i / active.length) * Math.PI * 2
        const dist  = planet!.threeRadius * (2.6 + i * 0.35)
        return (
          <mesh
            key={m.name}
            position={[
              Math.cos(angle) * dist,
              Math.sin(angle * 1.3) * planet!.threeRadius * 0.4,
              Math.sin(angle) * dist,
            ]}
          >
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshBasicMaterial color="#00E5A0" />
          </mesh>
        )
      })}
    </group>
  )
}

// ONLY Three.js objects - no HTML elements
export function PlanetScene({ planetId }: { planetId: string }) {
  const planet = PLANET_MAP[planetId]

  return (
    <>
      <Stars radius={300} depth={60} count={8000} factor={4} saturation={0} fade />
      <ambientLight intensity={planetId === "sun" ? 0.6 : 0.12} />
        {planetId !== "sun" && (
        <directionalLight position={[8, 4, 6]} intensity={1.8} color="#FFF5E0" />
        )}
      <directionalLight position={[8, 4, 6]} intensity={1.8} color="#FFF5E0" />
      <Suspense fallback={null}>
        {planetId === "sun" && <Sun />}
        {planetId !== "sun" && (
        <>
            <PlanetSphere id={planetId} />
            <Atmosphere   id={planetId} />
            <Rings        id={planetId} />
            <Moons        id={planetId} />
            <MissionDots  id={planetId} />
        </>
        )}
        <PlanetSphere id={planetId} />
        <Atmosphere   id={planetId} />
        <Rings        id={planetId} />
        <Moons        id={planetId} />
        <MissionDots  id={planetId} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={planet ? planet.threeRadius * 1.4 : 1.5}
        maxDistance={25}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}