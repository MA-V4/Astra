"use client"

import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

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

function buildTerminator(sun: THREE.Vector3, radius = 1.002, segments = 256): THREE.BufferGeometry {
  const up  = Math.abs(sun.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const u   = new THREE.Vector3().crossVectors(sun, up).normalize()
  const v   = new THREE.Vector3().crossVectors(sun, u).normalize()
  const pos = new Float32Array((segments + 1) * 3)
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pos[i * 3]     = (u.x * Math.cos(a) + v.x * Math.sin(a)) * radius
    pos[i * 3 + 1] = (u.y * Math.cos(a) + v.y * Math.sin(a)) * radius
    pos[i * 3 + 2] = (u.z * Math.cos(a) + v.z * Math.sin(a)) * radius
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  return geo
}

export function Terminator() {
  const sunRef = useRef(sunDirection())

  useEffect(() => {
    const id = setInterval(() => { sunRef.current = sunDirection() }, 60_000)
    return () => clearInterval(id)
  }, [])

  const lineObj = useMemo(() => {
    const geo = buildTerminator(sunRef.current)
    const mat = new THREE.LineBasicMaterial({
      color: 0xFFEFAA, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [])

  useFrame(() => {
    const geo = buildTerminator(sunRef.current)
    lineObj.geometry.dispose()
    lineObj.geometry = geo
  })

  return <primitive object={lineObj} />
}