import { OrbitControls, Sky } from '@react-three/drei'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { sampleGerstnerWaves, type Wave } from '../lib/waves'

const vertexShader = `
  uniform float uTime;
  uniform vec4 uWaves[3];
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;
  const float PI = 3.14159265359;
  const float G = 9.80665;

  void main() {
    vec3 p = position;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);

    for (int i = 0; i < 3; i++) {
      vec4 wave = uWaves[i];
      float k = 2.0 * PI / max(wave.z, 0.01);
      float c = sqrt(G / k);
      vec2 d = vec2(cos(wave.x), sin(wave.x));
      float f = k * (dot(d, p.xz) - c * uTime);
      float a = wave.y / k;
      float s = sin(f);
      float co = cos(f);

      p.x += d.x * a * co;
      p.y += a * s;
      p.z += d.y * a * co;
      tangent += vec3(-wave.y * d.x * d.x * s, wave.y * d.x * co, -wave.y * d.x * d.y * s);
      binormal += vec3(-wave.y * d.x * d.y * s, wave.y * d.y * co, -wave.y * d.y * d.y * s);
    }

    vNormal = normalize(cross(binormal, tangent));
    vWorldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    vWaveHeight = p.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunDirection;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  void main() {
    vec3 normal = normalize(vNormal);
    float rippleA = sin(vWorldPosition.x * 1.35 + vWorldPosition.z * 0.55 - uTime * 1.8);
    float rippleB = sin(vWorldPosition.z * 2.1 - vWorldPosition.x * 0.42 + uTime * 1.15);
    normal = normalize(normal + vec3(rippleA * 0.045, 0.0, rippleB * 0.04));
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDirection, normal), 0.0), 4.0);
    float diffuse = max(dot(normal, normalize(uSunDirection)), 0.0);
    float distanceFade = smoothstep(12.0, 115.0, length(cameraPosition - vWorldPosition));
    vec3 reflectedSky = mix(vec3(0.17, 0.34, 0.43), vec3(0.79, 0.88, 0.9), fresnel);
    vec3 water = mix(uShallowColor, uDeepColor, distanceFade * 0.72);
    water = mix(water, reflectedSky, fresnel * 0.74 + diffuse * 0.08);
    vec3 halfVector = normalize(viewDirection + normalize(uSunDirection));
    float specular = pow(max(dot(normal, halfVector), 0.0), 180.0);
    float foam = smoothstep(0.28, 1.3, vWaveHeight) * smoothstep(0.08, 0.42, 1.0 - normal.y);
    gl_FragColor = vec4(mix(water + specular * 0.95, vec3(0.84, 0.93, 0.93), foam * 0.58), 1.0);
  }
`

function WaterSurface({ waves }: { waves: Wave[] }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => new THREE.PlaneGeometry(180, 180, 220, 220).rotateX(-Math.PI / 2), [])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaves: { value: waves.map((wave) => new THREE.Vector4((wave.direction * Math.PI) / 180, wave.steepness, wave.wavelength, 0)) },
    uDeepColor: { value: new THREE.Color('#05243a') },
    uShallowColor: { value: new THREE.Color('#0d7892') },
    uSunDirection: { value: new THREE.Vector3(-1, 1, 0.35) },
  }), [])

  useEffect(() => {
    uniforms.uWaves.value = waves.map((wave) => new THREE.Vector4((wave.direction * Math.PI) / 180, wave.steepness, wave.wavelength, 0))
  }, [uniforms, waves])

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh geometry={geometry}>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  )
}

function Buoy({ waves }: { waves: Wave[] }) {
  const buoy = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!buoy.current) return
    const position = sampleGerstnerWaves(0, 0, clock.getElapsedTime(), waves)
    buoy.current.position.set(position.x, position.y + 1.2, position.z)
    buoy.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.8) * 0.08
    buoy.current.rotation.x = Math.cos(clock.getElapsedTime() * 0.7) * 0.06
  })

  return (
    <group ref={buoy}>
      <mesh>
        <cylinderGeometry args={[0.7, 0.95, 1.3, 24]} />
        <meshStandardMaterial color="#f8aa35" roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fff2cf" emissive="#ffb13d" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function Ship({ waves }: { waves: Wave[] }) {
  const vessel = useRef<THREE.Group>(null)
  const model = useLoader(FBXLoader, new URL('../assets/models/ship.fbx', import.meta.url).href)
  const ship = useMemo(() => model.clone(true), [model])

  useFrame(({ clock }) => {
    if (!vessel.current) return
    const time = clock.getElapsedTime()
    const position = sampleGerstnerWaves(-8, 3, time, waves)
    vessel.current.position.set(position.x, position.y + 2.5, position.z)
    vessel.current.rotation.z = Math.sin(time * 0.7) * 0.045
    vessel.current.rotation.x = Math.cos(time * 0.6) * 0.025
  })

  return <primitive ref={vessel} object={ship} scale={0.2} />
}

function Scene({ waves }: { waves: Wave[] }) {
  return (
    <Canvas camera={{ position: [42, 25, 42], fov: 48 }} dpr={[1, 1.5]} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
      <color attach="background" args={['#9abfc9']} />
      <fog attach="fog" args={['#9abfc9', 48, 155]} />
      <hemisphereLight args={['#dff4ff', '#09324b', 2.5]} />
      <directionalLight position={[-30, 45, 20]} intensity={3.2} color="#fff1ce" />
      <Sky sunPosition={[-30, 45, 20]} turbidity={7} rayleigh={1.2} mieCoefficient={0.007} />
      <WaterSurface waves={waves} />
      <Ship waves={waves} />
      <Buoy waves={waves} />
      <OrbitControls minDistance={15} maxDistance={95} maxPolarAngle={Math.PI / 2.04} target={[0, 0, 0]} />
    </Canvas>
  )
}

export default Scene
