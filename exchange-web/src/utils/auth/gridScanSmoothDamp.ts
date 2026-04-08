import * as THREE from 'three'

/** Smooth damp helpers adapted from React Bits GridScan (three.js animation). */

export function smoothDampVec2(
  current: THREE.Vector2,
  target: THREE.Vector2,
  currentVelocity: THREE.Vector2,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): THREE.Vector2 {
  const out = current.clone()
  const st = Math.max(0.0001, smoothTime)
  const omega = 2 / st
  const x = omega * deltaTime
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

  const change = current.clone().sub(target)
  const originalTo = target.clone()

  const maxChange = maxSpeed * st
  if (change.length() > maxChange) change.setLength(maxChange)

  const nextTarget = current.clone().sub(change)
  const temp = currentVelocity.clone().addScaledVector(change, omega).multiplyScalar(deltaTime)
  currentVelocity.sub(temp.clone().multiplyScalar(omega))
  currentVelocity.multiplyScalar(exp)

  out.copy(nextTarget.clone().add(change.add(temp).multiplyScalar(exp)))

  const origMinusCurrent = originalTo.clone().sub(current)
  const outMinusOrig = out.clone().sub(originalTo)
  if (origMinusCurrent.dot(outMinusOrig) > 0) {
    out.copy(originalTo)
    currentVelocity.set(0, 0)
  }
  return out
}

export function smoothDampFloat(
  current: number,
  target: number,
  velRef: { v: number },
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): { value: number; v: number } {
  const st = Math.max(0.0001, smoothTime)
  const omega = 2 / st
  const x = omega * deltaTime
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

  let change = current - target
  const originalTo = target

  const maxChange = maxSpeed * st
  change = Math.sign(change) * Math.min(Math.abs(change), maxChange)

  const adjTarget = current - change
  const temp = (velRef.v + omega * change) * deltaTime
  velRef.v = (velRef.v - omega * temp) * exp

  let out = adjTarget + (change + temp) * exp

  const origMinusCurrent = originalTo - current
  const outMinusOrig = out - originalTo
  if (origMinusCurrent * outMinusOrig > 0) {
    out = originalTo
    velRef.v = 0
  }
  return { value: out, v: velRef.v }
}
