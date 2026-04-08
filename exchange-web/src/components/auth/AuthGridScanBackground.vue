<script setup lang="ts">
/**
 * Grid Scan 背景：移植自 React Bits（MIT），不含摄像头/人脸追踪。
 * @see https://reactbits.dev/backgrounds/grid-scan
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BloomEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from 'postprocessing'
import * as THREE from 'three'
import { GRID_SCAN_FRAG, GRID_SCAN_VERT } from '@/utils/auth/gridScanShaders'
import { smoothDampFloat, smoothDampVec2 } from '@/utils/auth/gridScanSmoothDamp'

const LINE_THICKNESS = 1
const LINES_COLOR = '#392e4e'
const SCAN_COLOR = '#FF9FFC'
const SCAN_OPACITY = 0.4
const GRID_SCALE = 0.1
const LINE_JITTER = 0.1
const SCAN_DIRECTION = 2
const ENABLE_POST = true
const BLOOM_INTENSITY = 0
const BLOOM_THRESHOLD = 0
const BLOOM_SMOOTHING = 0
const CA = 0.002
const NOISE = 0.01
const SCAN_GLOW = 0.5
const SCAN_SOFTNESS = 2
const SCAN_PHASE_TAPER = 0.9
const SCAN_DURATION = 2
const SCAN_DELAY = 2
const SENSITIVITY = 0.55

const rootRef = ref<HTMLElement | null>(null)

function srgbColor(hex: string): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear()
}

let dispose: (() => void) | null = null

onMounted(() => {
  const el = rootRef.value
  if (!el) return

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }

  const MAX_SCANS = 8

  const lookTarget = new THREE.Vector2(0, 0)
  const lookCurrent = new THREE.Vector2(0, 0)
  const lookVel = new THREE.Vector2(0, 0)

  let tiltTarget = 0
  let yawTarget = 0
  let tiltCurrent = 0
  let yawCurrent = 0
  const tiltVel = { v: 0 }
  const yawVel = { v: 0 }

  const s = THREE.MathUtils.clamp(SENSITIVITY, 0, 1)
  const skewScale = THREE.MathUtils.lerp(0.06, 0.2, s)
  const tiltScale = THREE.MathUtils.lerp(0.12, 0.3, s)
  const yawScale = THREE.MathUtils.lerp(0.1, 0.28, s)
  const smoothTime = THREE.MathUtils.lerp(0.45, 0.12, s)
  const maxSpeed = Infinity
  const yBoost = THREE.MathUtils.lerp(1.2, 1.6, s)

  /* 面板叠在网格之上，用视口坐标驱动视差，避免“只在空白处有效” */
  const onWinMove = (e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = -(e.clientY / window.innerHeight) * 2 + 1
    lookTarget.set(nx, ny)
  }
  window.addEventListener('mousemove', onWinMove, { passive: true })

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.autoClear = false
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.style.pointerEvents = 'none'
  el.appendChild(renderer.domElement)

  const material = new THREE.ShaderMaterial({
    uniforms: {
      iResolution: {
        value: new THREE.Vector3(
          el.clientWidth,
          el.clientHeight,
          renderer.getPixelRatio()
        ),
      },
      iTime: { value: 0 },
      uSkew: { value: new THREE.Vector2(0, 0) },
      uTilt: { value: 0 },
      uYaw: { value: 0 },
      uLineThickness: { value: LINE_THICKNESS },
      uLinesColor: { value: srgbColor(LINES_COLOR) },
      uScanColor: { value: srgbColor(SCAN_COLOR) },
      uGridScale: { value: GRID_SCALE },
      uLineStyle: { value: 0 },
      uLineJitter: { value: Math.max(0, Math.min(1, LINE_JITTER)) },
      uScanOpacity: { value: SCAN_OPACITY },
      uNoise: { value: NOISE },
      uBloomOpacity: { value: BLOOM_INTENSITY },
      uScanGlow: { value: SCAN_GLOW },
      uScanSoftness: { value: SCAN_SOFTNESS },
      uPhaseTaper: { value: SCAN_PHASE_TAPER },
      uScanDuration: { value: SCAN_DURATION },
      uScanDelay: { value: SCAN_DELAY },
      uScanDirection: { value: SCAN_DIRECTION },
      uScanStarts: { value: new Array(MAX_SCANS).fill(0) },
      uScanCount: { value: 0 },
    },
    vertexShader: GRID_SCAN_VERT,
    fragmentShader: GRID_SCAN_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  scene.add(quad)

  let composer: EffectComposer | null = null
  if (ENABLE_POST) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new BloomEffect({
      intensity: 1.0,
      luminanceThreshold: BLOOM_THRESHOLD,
      luminanceSmoothing: BLOOM_SMOOTHING,
    })
    bloom.blendMode.opacity.value = Math.max(0, BLOOM_INTENSITY)
    const chroma = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(CA, CA),
      radialModulation: true,
      modulationOffset: 0,
    })
    const effectPass = new EffectPass(camera, bloom, chroma)
    effectPass.renderToScreen = true
    composer.addPass(effectPass)
  }

  const onResize = () => {
    renderer.setSize(el.clientWidth, el.clientHeight)
    material.uniforms.iResolution.value.set(
      el.clientWidth,
      el.clientHeight,
      renderer.getPixelRatio()
    )
    if (composer) composer.setSize(el.clientWidth, el.clientHeight)
  }
  window.addEventListener('resize', onResize)

  let raf = 0
  let last = performance.now()
  const tick = () => {
    const now = performance.now()
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000))
    last = now

    lookCurrent.copy(
      smoothDampVec2(lookCurrent, lookTarget, lookVel, smoothTime, maxSpeed, dt)
    )

    const tiltSm = smoothDampFloat(
      tiltCurrent,
      tiltTarget,
      tiltVel,
      smoothTime,
      maxSpeed,
      dt
    )
    tiltCurrent = tiltSm.value
    tiltVel.v = tiltSm.v

    const yawSm = smoothDampFloat(
      yawCurrent,
      yawTarget,
      yawVel,
      smoothTime,
      maxSpeed,
      dt
    )
    yawCurrent = yawSm.value
    yawVel.v = yawSm.v

    const skew = new THREE.Vector2(
      lookCurrent.x * skewScale,
      -lookCurrent.y * yBoost * skewScale
    )
    material.uniforms.uSkew.value.set(skew.x, skew.y)
    material.uniforms.uTilt.value = tiltCurrent * tiltScale
    material.uniforms.uYaw.value = THREE.MathUtils.clamp(
      yawCurrent * yawScale,
      -0.6,
      0.6
    )

    material.uniforms.iTime.value = now / 1000
    renderer.clear(true, true, true)
    if (composer) composer.render(dt)
    else renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  dispose = () => {
    window.removeEventListener('mousemove', onWinMove)
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(raf)
    material.dispose()
    ;(quad.geometry as THREE.BufferGeometry).dispose()
    if (composer) {
      composer.dispose()
      composer = null
    }
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement.parentNode === el) {
      el.removeChild(renderer.domElement)
    }
  }
})

onBeforeUnmount(() => {
  dispose?.()
  dispose = null
})
</script>

<template>
  <div ref="rootRef" class="auth-grid-scan" aria-hidden="true" />
</template>

<style scoped lang="scss">
.auth-grid-scan {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
