import { useEffect, useRef, useState } from 'react'

/*
 * Consola que se escribe sola (estilo terminal) cuando aparece en pantalla.
 * Cada línea tiene un tipo (prompt, comando, salida, código…) para pintarla de su color.
 */
const VEL_ESCRITURA = 18 // ms por carácter
const PAUSA_LINEA = 140 // ms entre líneas

export default function Terminal({ lineas, usuario = 'juan@portfolio', ruta = '~/fullstack', firma, rol, estado = 'ONLINE' }) {
  const caja = useRef(null)
  const [visible, setVisible] = useState(false)
  const [linea, setLinea] = useState(0) // línea que se está escribiendo
  const [car, setCar] = useState(0) // caracteres escritos de esa línea

  // Empieza a escribir cuando entra en pantalla (y vuelve a empezar si cambia el idioma)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.35 })
    if (caja.current) io.observe(caja.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => { setLinea(0); setCar(0) }, [lineas])

  useEffect(() => {
    if (!visible || linea >= lineas.length) return undefined
    const texto = lineas[linea].texto
    const id = car < texto.length
      ? setTimeout(() => setCar(car + Math.max(1, Math.round(texto.length / 60))), VEL_ESCRITURA)
      : setTimeout(() => { setLinea(linea + 1); setCar(0) }, PAUSA_LINEA)
    return () => clearTimeout(id)
  }, [visible, linea, car, lineas])

  const terminado = linea >= lineas.length

  return (
    <div className="terminal panel" ref={caja}>
      <div className="terminal-barra">
        <span className="terminal-luces"><i /><i /><i /></span>
        <span className="terminal-titulo">{usuario}: {ruta}</span>
        <span className="terminal-pausa" aria-hidden="true">||</span>
      </div>
      <div className="terminal-cuerpo">
        <p className="t-prompt"><b>{usuario}</b> <span>{ruta}</span></p>
        {lineas.map((l, i) => {
          if (i > linea) return null
          const texto = i === linea ? l.texto.slice(0, car) : l.texto
          return <p key={i} className={`t-${l.tipo}`}>{texto}{i === linea && !terminado && <span className="t-cursor" />}</p>
        })}
        {terminado && (
          <>
            <div className="terminal-firma">
              <div><strong>{firma}</strong><span>{rol}</span></div>
              <span className="terminal-estado"><i /> {estado}</span>
            </div>
            <p className="t-comando">$ <span className="t-cursor" /></p>
          </>
        )}
      </div>
    </div>
  )
}
