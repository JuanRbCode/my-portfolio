import { useEffect, useRef } from 'react'
import { espacio } from './espacio.js'

const COLORES = ['255,255,255', '216,200,255', '196,181,253', '167,139,250', '147,197,253']

// Fondo de espacio: partículas en 3D que vienen hacia la cámara.
export default function SpaceCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = 1, estrellas = [], raf = 0
    let velocidad = 0
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    const nueva = (z = Math.random()) => ({
      x: (Math.random() * 2 - 1) * 1.6,
      y: (Math.random() * 2 - 1) * 1.6,
      z,
      pz: z,
      c: COLORES[(Math.random() * COLORES.length) | 0],
      s: Math.random() * 1.2 + 0.4,
    })

    const ajustar = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const total = Math.min(1100, Math.round((w * h) / 1800))
      estrellas = Array.from({ length: total }, () => nueva())
    }

    const dibujar = (paso) => {
      ctx.fillStyle = '#04020a'
      ctx.fillRect(0, 0, w, h)

      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      const cx = w / 2 + mouse.x * 40
      const cy = h / 2 + mouse.y * 40
      const fov = Math.max(w, h) * 0.5

      for (const e of estrellas) {
        e.pz = e.z
        e.z -= paso
        if (e.z <= 0.02) { Object.assign(e, nueva(1)); e.pz = 1; continue }

        const sx = cx + (e.x / e.z) * fov
        const sy = cy + (e.y / e.z) * fov
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) { Object.assign(e, nueva(1)); e.pz = 1; continue }

        const cerca = 1 - e.z
        const alfa = Math.min(1, cerca * 1.3)
        const r = e.s * (0.3 + cerca * 1.8)

        if (velocidad > 0.004) {
          // Estela: línea desde la posición anterior (efecto warp).
          const px = cx + (e.x / e.pz) * fov
          const py = cy + (e.y / e.pz) * fov
          ctx.strokeStyle = `rgba(${e.c},${alfa * 0.85})`
          ctx.lineWidth = r
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(sx, sy)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${e.c},${alfa})`
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const bucle = () => {
      // Velocidad base + impulso del scroll (se suaviza para que no salte).
      const objetivo = 0.0009 + Math.min(espacio.impulso, 0.045)
      velocidad += (objetivo - velocidad) * 0.08
      espacio.impulso *= 0.9
      dibujar(velocidad)
      raf = requestAnimationFrame(bucle)
    }

    const onMouse = (ev) => {
      mouse.tx = ev.clientX / window.innerWidth - 0.5
      mouse.ty = ev.clientY / window.innerHeight - 0.5
    }

    ajustar()
    window.addEventListener('resize', ajustar)
    if (reducir) {
      dibujar(0)
    } else {
      window.addEventListener('mousemove', onMouse, { passive: true })
      raf = requestAnimationFrame(bucle)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', ajustar)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={ref} className="space-canvas" aria-hidden="true" />
}
