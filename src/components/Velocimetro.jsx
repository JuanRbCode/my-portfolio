import { useEffect, useRef, useState } from 'react'

/*
 * Pantalla de carga: velocímetro analógico + digital.
 * La aguja y los números siguen el progreso real de carga del modelo 3D (0 → 1),
 * suavizados para que la aguja no salte.
 */
const VEL_MAX = 320 // km/h al 100 %
const ANG_INI = -130 // grados (abajo a la izquierda)
const ANG_FIN = 130 // grados (abajo a la derecha)
const R = 108 // radio del dial
const CX = 140
const CY = 140

const polar = (ang, r) => {
  const a = ((ang - 90) * Math.PI) / 180
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r]
}
const arco = (desde, hasta, r) => {
  const [x1, y1] = polar(desde, r)
  const [x2, y2] = polar(hasta, r)
  const grande = hasta - desde > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2}`
}

const MARCAS = Array.from({ length: VEL_MAX / 10 + 1 }, (_, i) => i * 10)

export default function Velocimetro({ carga, listo, titulo, tituloListo }) {
  const [v, setV] = useState(0) // valor mostrado (0 → 1), suavizado
  const objetivo = useRef(0)
  useEffect(() => { objetivo.current = listo ? 1 : carga }, [carga, listo])

  useEffect(() => {
    let raf = 0
    const paso = () => {
      setV((actual) => {
        const d = objetivo.current - actual
        return Math.abs(d) < 0.001 ? objetivo.current : actual + d * 0.08
      })
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ang = ANG_INI + (ANG_FIN - ANG_INI) * v
  const kmh = Math.round(v * VEL_MAX)
  const segmentos = 14
  const encendidos = Math.round(v * segmentos)

  return (
    <div className="velo" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <svg viewBox="0 0 280 280" className="velo-dial" aria-hidden="true">
        <defs>
          <linearGradient id="veloGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="85%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <filter id="veloBrillo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Aros exteriores */}
        <circle cx={CX} cy={CY} r="134" className="velo-aro" />
        <circle cx={CX} cy={CY} r="126" className="velo-aro velo-aro-2" />

        {/* Pista y arco encendido */}
        <path d={arco(ANG_INI, ANG_FIN, R)} className="velo-pista" />
        {v > 0.002 && <path d={arco(ANG_INI, ang, R)} className="velo-activo" filter="url(#veloBrillo)" />}
        {/* Zona roja */}
        <path d={arco(ANG_INI + (ANG_FIN - ANG_INI) * 0.84, ANG_FIN, R + 9)} className="velo-roja" />

        {/* Marcas y números */}
        {MARCAS.map((m) => {
          const a = ANG_INI + ((ANG_FIN - ANG_INI) * m) / VEL_MAX
          const mayor = m % 40 === 0
          const [x1, y1] = polar(a, R - 6)
          const [x2, y2] = polar(a, R - (mayor ? 20 : 12))
          const [tx, ty] = polar(a, R - 34)
          const pasada = m <= kmh
          return (
            <g key={m}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={`velo-marca ${mayor ? 'is-mayor' : ''} ${pasada ? 'is-on' : ''}`} />
              {mayor && <text x={tx} y={ty} className={`velo-num ${pasada ? 'is-on' : ''}`}>{m}</text>}
            </g>
          )
        })}

        {/* Aguja */}
        <g transform={`rotate(${ang} ${CX} ${CY})`} filter="url(#veloBrillo)">
          <path d={`M ${CX - 3} ${CY + 14} L ${CX} ${CY - R + 12} L ${CX + 3} ${CY + 14} Z`} className="velo-aguja" />
        </g>
        <circle cx={CX} cy={CY} r="13" className="velo-eje" />
        <circle cx={CX} cy={CY} r="5" className="velo-eje-luz" />
      </svg>

      {/* Lectura digital */}
      <div className="velo-digital">
        <span className="velo-kmh">{String(kmh).padStart(3, '0')}</span>
        <span className="velo-unidad">KM/H</span>
      </div>

      {/* Barra de RPM segmentada */}
      <div className="velo-rpm" aria-hidden="true">
        {Array.from({ length: segmentos }, (_, i) => (
          <span key={i} className={`${i < encendidos ? 'is-on' : ''} ${i >= segmentos - 3 ? 'is-alta' : ''}`} />
        ))}
      </div>
      <div className="velo-pie">
        <span className="velo-titulo">{listo ? tituloListo : titulo}</span>
        <span className="velo-pct">{Math.round(v * 100)}%</span>
      </div>
    </div>
  )
}
