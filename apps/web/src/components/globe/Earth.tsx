"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// SUN POSITION
// Approximates the sun direction vector in world space based on UTC.
// Sun longitude ~ -(UTC hours * 15°), latitude varies ±23.5° over the year.
function sunDirection(): THREE.Vector3 {
  const now   = new Date()
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60
  const doy   = Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000)

  const sunLon = -(hours * 15) * (Math.PI / 180)
  const sunLat = 23.5 * Math.sin((doy / 365) * 2 * Math.PI - Math.PI / 2) * (Math.PI / 180)

  return new THREE.Vector3(
    Math.cos(sunLat) * Math.cos(sunLon),
    Math.sin(sunLat),
    Math.cos(sunLat) * Math.sin(sunLon),
  ).normalize()
}

// DAY/NIGHT VERTEX SHADER
const VERT_SHADER = /* glsl */`
  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vWorldPos;

  void main() {
    vUv       = uv;
    vNormal   = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// DAY/NIGHT FRAGMENT SHADER
// Blends between day (Blue Marble) and night (city lights) textures
// based on dot product with the sun direction.
const FRAG_SHADER = /* glsl */`
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3      sunDir;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float cosAngle    = dot(vNormal, normalize(sunDir));
    float blendFactor = smoothstep(-0.1, 0.2, cosAngle);

    vec4 dayColor   = texture2D(dayTexture,   vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);

    // Darken the day side slightly at the terminator
    vec3 ambientDay  = dayColor.rgb * max(cosAngle * 1.2 + 0.15, 0.15);
    vec3 ambientNight = nightColor.rgb * 0.9;

    gl_FragColor = vec4(mix(ambientNight, ambientDay, blendFactor), 1.0);
  }
`

// Texture loader with error fallback
function loadTexture(url: string): THREE.Texture {
  const tex = new THREE.TextureLoader().load(url, undefined, undefined, (err) => {
    console.warn(`Texture load failed: ${url}`, err)
  })
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function Earth() {
  const meshRef    = useRef<THREE.Mesh>(null!)
  const sunDirRef  = useRef(sunDirection())

  // Update sun direction every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      sunDirRef.current = sunDirection()
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const shaderMaterial = useMemo(() => {
    // Public domain NASA textures via cdn.jsdelivr.net (three-globe package)
    const DAY_URL   = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
    const NIGHT_URL = "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"

    return new THREE.ShaderMaterial({
      vertexShader:   VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      uniforms: {
        dayTexture:   { value: loadTexture(DAY_URL)   },
        nightTexture: { value: loadTexture(NIGHT_URL) },
        sunDir:       { value: sunDirRef.current      },
      },
    })
  }, [])

  // Update sun uniform each frame
  useFrame(() => {
    if (shaderMaterial.uniforms.sunDir) {
      shaderMaterial.uniforms.sunDir.value = sunDirRef.current
    }
  })

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 64, 64), [])

  return <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />
}
