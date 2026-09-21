import { useMemo } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv        = uv;
    vNormal    = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const NOISE = /* glsl */`
  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0,0.0)), f.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    mat2 r = mat2(0.8660, 0.5, -0.5, 0.8660);
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p  = r * p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
`

const LIGHT = `(max(dot(vNormal, normalize(vec3(1.0, 0.5, 1.0))), 0.0) * 0.85 + 0.12)`

const MERCURY_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  void main() {
    float n       = fbm(vUv * 7.0);
    float crater  = fbm(vUv * 22.0) * fbm(vUv * 13.0);
    float large   = fbm(vUv * 4.0);
    vec3 col      = mix(vec3(0.30,0.28,0.25), vec3(0.57,0.54,0.49), n);
    col = mix(col, vec3(0.20,0.18,0.16), crater * 0.72);
    col = mix(col, vec3(0.44,0.41,0.37), large * 0.25);
    gl_FragColor  = vec4(col * ${LIGHT}, 1.0);
  }
`

const VENUS_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  void main() {
    vec2 q = vec2(fbm(vUv * 3.0), fbm(vUv * 3.0 + vec2(1.7, 9.2)));
    vec2 r = vec2(fbm(vUv * 3.0 + q * 4.0), fbm(vUv * 3.0 + q * 4.0 + vec2(8.3, 2.8)));
    float f = fbm(vUv * 2.0 + r * 2.5);
    vec3 col = mix(vec3(0.62,0.42,0.10), vec3(0.88,0.70,0.28), f);
    col = mix(col, vec3(0.96,0.87,0.58), f * f * 0.7);
    gl_FragColor = vec4(col * (${LIGHT} + 0.14), 1.0);
  }
`

const MARS_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  void main() {
    float terrain = fbm(vUv * 4.0);
    float detail  = fbm(vUv * 11.0);
    float fine    = fbm(vUv * 28.0);
    vec3 col = mix(vec3(0.68,0.24,0.07), vec3(0.82,0.42,0.18), terrain);
    col = mix(col, vec3(0.44,0.11,0.04), detail * 0.38);
    col += vec3(fine * 0.04);
    float lat   = abs(vUv.y * 2.0 - 1.0);
    float polar = smoothstep(0.78, 0.96, lat);
    col = mix(col, vec3(0.88,0.90,0.93), polar);
    gl_FragColor = vec4(col * (${LIGHT} * 1.2 + 0.04), 1.0);
  }
`

const JUPITER_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  const float PI = 3.14159265;
  void main() {
    float turb = fbm(vUv * vec2(2.0, 9.0)) * 0.11;
    float b1 = sin((vUv.y + turb) * PI * 22.0);
    float b2 = sin((vUv.y + turb * 1.4) * PI * 11.0);
    float b3 = sin((vUv.y + turb * 0.8) * PI * 38.0) * 0.28;
    vec3 col = mix(vec3(0.56,0.32,0.11), vec3(0.92,0.82,0.62), smoothstep(-0.2,0.5,b1));
    col = mix(col, vec3(0.95,0.88,0.72), smoothstep(0.5,1.0,b2) * 0.45);
    col = mix(col, vec3(0.42,0.22,0.07), smoothstep(0.6,1.0,b3));
    vec2 sp = (vUv - vec2(0.32,0.40)) * vec2(5.2,10.5);
    float sw = fbm(sp * 0.45 + vec2(length(sp)*2.0, 0.0)) * 0.38;
    float sm = smoothstep(1.3, 0.15, length(sp) + sw);
    col = mix(col, vec3(0.72,0.20,0.09), sm * 0.78);
    col = mix(col, vec3(0.86,0.44,0.20), sm * sm * 0.35);
    gl_FragColor = vec4(col * (${LIGHT} + 0.09), 1.0);
  }
`

const SATURN_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  const float PI = 3.14159265;
  void main() {
    float turb = fbm(vUv * vec2(1.5, 6.0)) * 0.07;
    float b1 = sin((vUv.y + turb) * PI * 15.0);
    float b2 = sin((vUv.y + turb) * PI * 7.0);
    float b3 = fbm(vUv * vec2(3.0, 1.0)) * 0.12;
    vec3 col = mix(vec3(0.68,0.54,0.26), vec3(0.90,0.80,0.48), smoothstep(-0.3,0.5,b1));
    col = mix(col, vec3(0.96,0.90,0.70), smoothstep(0.4,0.9,b2) * 0.38);
    col += vec3(b3 * 0.06, b3 * 0.04, -b3 * 0.02);
    gl_FragColor = vec4(col * (${LIGHT} + 0.13), 1.0);
  }
`

const URANUS_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  const float PI = 3.14159265;
  void main() {
    float haze  = fbm(vUv * 3.0) * 0.14;
    float band  = sin(vUv.y * PI * 9.0 + haze) * 0.06;
    float wisp  = fbm(vUv * 8.0) * 0.07;
    vec3 col = mix(vec3(0.42,0.82,0.86), vec3(0.60,0.92,0.94), haze);
    col = mix(col, vec3(0.26,0.65,0.70), max(band, 0.0));
    col += vec3(-wisp*0.04, wisp*0.03, wisp*0.05);
    gl_FragColor = vec4(col * (${LIGHT} + 0.20), 1.0);
  }
`

const NEPTUNE_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv; varying vec3 vNormal;
  const float PI = 3.14159265;
  void main() {
    float storm = fbm(vUv * 5.0);
    float swirl = fbm(vUv * 8.0 + vec2(storm * 2.0, 0.0));
    float band  = sin(vUv.y * PI * 13.0 + storm * 1.8) * 0.10;
    vec3 col = mix(vec3(0.07,0.16,0.60), vec3(0.18,0.34,0.80), storm);
    col = mix(col, vec3(0.34,0.56,0.92), swirl * 0.38);
    col = mix(col, vec3(0.04,0.09,0.38), max(band, 0.0));
    vec2 ds = (vUv - vec2(0.24,0.43)) * vec2(6.2,10.5);
    float dspot = smoothstep(1.0, 0.05, length(ds));
    col = mix(col, vec3(0.03,0.06,0.28), dspot * 0.65);
    gl_FragColor = vec4(col * (${LIGHT} + 0.11), 1.0);
  }


  

`

const FRAG_SHADERS: Record<string, string> = {
  mercury: MERCURY_FRAG,
  venus:   VENUS_FRAG,
  mars:    MARS_FRAG,
  jupiter: JUPITER_FRAG,
  saturn:  SATURN_FRAG,
  uranus:  URANUS_FRAG,
  neptune: NEPTUNE_FRAG,
}

export function usePlanetMaterial(planetId: string): THREE.ShaderMaterial {
  return useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG_SHADERS[planetId] ?? MERCURY_FRAG,
  }), [planetId])
}

const SUN_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv      = uv;
    vNormal  = normalize(mat3(modelMatrix) * normal);
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-pos.xyz);
    gl_Position = projectionMatrix * pos;
  }
`

const SUN_FRAG = /* glsl */`
  ${NOISE}
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform float uTime;

  void main() {
    // Animated convection cells
    vec2 uv1 = vUv * 4.0 + vec2(uTime * 0.012, uTime * 0.008);
    vec2 uv2 = vUv * 9.0 - vec2(uTime * 0.018, uTime * 0.006);
    vec2 uv3 = vUv * 18.0 + vec2(uTime * 0.022, -uTime * 0.014);

    float f1 = fbm(uv1);
    float f2 = fbm(uv2 + vec2(f1 * 2.0, 0.0));
    float f3 = fbm(uv3 + vec2(f2 * 1.5, f1 * 1.0));

    float surface = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;

    // Solar granulation - bright hotspots
    float granule = fbm(vUv * 35.0 + vec2(uTime * 0.005));
    surface += granule * 0.12;

    // Sunspot regions - dark circular depressions
    float spot1 = smoothstep(0.18, 0.0, length(vUv - vec2(0.28, 0.52)) - fbm(vUv * 6.0) * 0.06);
    float spot2 = smoothstep(0.12, 0.0, length(vUv - vec2(0.68, 0.35)) - fbm(vUv * 8.0) * 0.04);
    float spot3 = smoothstep(0.09, 0.0, length(vUv - vec2(0.44, 0.71)) - fbm(vUv * 7.0) * 0.03);
    float spots = max(spot1, max(spot2, spot3));

    // Color gradient: dark orange core → bright yellow → white-hot peak
    vec3 dark   = vec3(0.70, 0.15, 0.00);
    vec3 mid    = vec3(1.00, 0.45, 0.00);
    vec3 bright = vec3(1.00, 0.82, 0.20);
    vec3 hot    = vec3(1.00, 0.97, 0.80);

    vec3 col = mix(dark, mid, smoothstep(0.0, 0.4, surface));
    col = mix(col, bright, smoothstep(0.35, 0.65, surface));
    col = mix(col, hot,    smoothstep(0.60, 1.00, surface));

    // Sunspots darken the surface
    col = mix(col, vec3(0.12, 0.04, 0.00), spots * 0.85);

    // Limb darkening - edges of sun are cooler/darker
    float limb = dot(vNormal, vViewDir);
    col *= 0.5 + 0.5 * pow(max(limb, 0.0), 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function useSunMaterial(timeRef: React.MutableRefObject<number>): THREE.ShaderMaterial {
  return useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   SUN_VERT,
    fragmentShader: SUN_FRAG,
    uniforms: {
      uTime: { value: 0 },
    },
  }), [])
}