import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './components/Icon.jsx'
import World3D from './components/World3D.jsx'
import { espacio } from './components/espacio.js'
import Velocimetro from './components/Velocimetro.jsx'
import FormContacto from './components/FormContacto.jsx'
import { useIdioma } from './i18n.jsx'
import './App.css'

const ESCENAS = [
  { id: 'inicio' }, { id: 'sobre-mi' }, { id: 'experiencia' }, { id: 'educacion' },
  { id: 'proyectos' }, { id: 'habilidades' }, { id: 'contacto' },
]

const num = (i) => String(i + 1).padStart(2, '0')

/*
 * Motor del "viaje": en cada cuadro calcula
 *  - espacio.t: en qué escena va la cámara 3D (0 = Inicio, 1 = Sobre mí…, con decimales entre una y otra)
 *  - p de cada sección: p > 0 todavía viene, p = 0 está frente a ti, p < 0 ya pasó.
 *    El contenido entra de lado (según su escena) y se desvanece al salir.
 */
function useViaje(setActiva, setProgreso) {
  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let ultimoY = window.scrollY

    const cuadro = () => {
      const vh = window.innerHeight
      const y = window.scrollY
      espacio.impulso += Math.abs(y - ultimoY) / 9000
      ultimoY = y

      const max = document.documentElement.scrollHeight - vh
      setProgreso(max > 0 ? y / max : 0)

      let mejor = null
      let mejorDist = Infinity
      const secciones = document.querySelectorAll('.scene')
      let t = 0
      secciones.forEach((sec, i) => {
        const r = sec.getBoundingClientRect()
        // Cámara: pasa a la escena i mientras esa sección sube desde abajo hasta arriba de la pantalla.
        if (i > 0) t += Math.min(Math.max((vh - r.top) / vh, 0), 1)

        const entra = r.top / vh
        const sale = (r.bottom - vh) / vh
        const p = entra > 0 ? entra : sale < 0 ? sale : 0

        const dist = Math.abs(r.top + Math.min(r.height, vh) / 2 - vh / 2)
        if (r.top < vh * 0.6 && r.bottom > vh * 0.4 && dist < mejorDist) { mejorDist = dist; mejor = sec.id }

        if (reducir) return
        const a = Math.min(Math.abs(p), 1.2)
        // En celular no hay entrada lateral (cortaba el contenido por los costados): solo fundido vertical.
        const lado = window.innerWidth <= 768 ? 0 : sec.classList.contains('scene--right') ? 1 : sec.classList.contains('scene--left') ? -1 : 0
        const inner = sec.querySelector('.scene-inner')
        if (inner) {
          inner.style.transform = `translate3d(${lado * a * 140}px, ${p * 70}px, 0) scale(${1 - a * 0.06})`
          inner.style.opacity = String(Math.max(0, 1 - a * 1.1))
        }
      })
      espacio.t = t
      if (mejor) setActiva(mejor)
      raf = requestAnimationFrame(cuadro)
    }
    raf = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(raf)
  }, [setActiva, setProgreso])
}

function Glitch({ as: Tag = 'h2', texto, className = '' }) {
  return <Tag className={`glitch ${className}`} data-text={texto}>{texto}</Tag>
}

function Encabezado({ n, etiqueta, texto }) {
  return (
    <div className="scene-head">
      <span className="scene-tag"><b>{n}</b> // {etiqueta}</span>
      <Glitch texto={texto} />
    </div>
  )
}

/*
 * Rutas limpias: /sobre-mi, /experiencia, /contacto… (sin "#").
 * - Los enlaces internos (#seccion) se interceptan: bajan suave y cambian la URL a /seccion.
 * - Al bajar con la ruedita, la URL se actualiza sola según la sección visible.
 * - Al abrir /contacto directamente, la página va a esa sección.
 */
const rutaDe = (id) => (id === 'inicio' ? '/' : '/' + id)
function useRutas(activa) {
  const rutaInicialLista = useRef(false)
  useEffect(() => {
    const id = decodeURIComponent(window.location.pathname.replace(/^\/+|\/+$/g, '')) || window.location.hash.slice(1)
    if (id && id !== 'inicio' && ESCENAS.some((e) => e.id === id)) {
      // Espera a que la página termine de acomodarse (Experiencia cambia de alto al montar)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
        rutaInicialLista.current = true
      }, 400)
    } else {
      rutaInicialLista.current = true
    }
    if (window.location.hash) window.history.replaceState(null, '', rutaDe(id || 'inicio'))

    const alClic = (ev) => {
      const a = ev.target.closest?.('a[href^="#"]')
      if (!a) return
      const destino = a.getAttribute('href').slice(1)
      const el = document.getElementById(destino)
      if (!el) return
      ev.preventDefault()
      el.scrollIntoView({ behavior: 'smooth' })
      window.history.pushState(null, '', rutaDe(destino))
    }
    const alVolver = () => {
      const id2 = window.location.pathname.replace(/^\/+/, '') || 'inicio'
      document.getElementById(id2)?.scrollIntoView({ behavior: 'smooth' })
    }
    document.addEventListener('click', alClic)
    window.addEventListener('popstate', alVolver)
    return () => { document.removeEventListener('click', alClic); window.removeEventListener('popstate', alVolver) }
  }, [])

  useEffect(() => {
    const ruta = rutaDe(activa)
    if (rutaInicialLista.current && activa && window.location.pathname !== ruta) window.history.replaceState(null, '', ruta)
  }, [activa])
}

/* ---------- Interfaz fija (HUD) ---------- */

function TopBar() {
  const { datos, idioma, setIdioma, t } = useIdioma()
  const { perfil } = datos
  const c = perfil.contacto
  return (
    <header className="topbar">
      <div className="topbar-right">
        <button type="button" className="topbar-idioma" onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')} aria-label={t('ui.idioma')}>
          <span className={idioma === 'es' ? 'is-on' : ''}>ES</span><span className="topbar-idioma-sep">/</span><span className={idioma === 'en' ? 'is-on' : ''}>EN</span>
        </button>
        <a href={c.github} target="_blank" rel="noreferrer" className="topbar-icon" aria-label="GitHub"><Icon name="github" size={18} /></a>
        <a href={c.linkedin} target="_blank" rel="noreferrer" className="topbar-icon" aria-label="LinkedIn"><Icon name="linkedin" size={18} /></a>
        <a href={`mailto:${c.email}`} className="topbar-icon" aria-label="Correo"><Icon name="mail" size={18} /></a>
        <a href={perfil.cv} className="btn btn-primary btn-sm" download>
          <Icon name="download" size={16} /> <span>CV</span>
        </a>
      </div>
    </header>
  )
}

function SideNav({ activa, progreso }) {
  const { t } = useIdioma()
  return (
    <nav className="sidenav" aria-label="Secciones">
      <div className="sidenav-track"><span style={{ '--prog': progreso }} /></div>
      <ul>
        {ESCENAS.map((e, i) => (
          <li key={e.id}>
            <a href={`#${e.id}`} className={activa === e.id ? 'is-active' : ''} aria-label={t(`nav.${e.id}`)}>
              <span className="sidenav-label">{t(`nav.${e.id}`)}</span>
              <span className="sidenav-num">{num(i)}</span>
              <span className="sidenav-dot" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Readout({ activa }) {
  const { t } = useIdioma()
  const i = Math.max(0, ESCENAS.findIndex((e) => e.id === activa))
  return (
    <div className="readout" aria-hidden="true">
      <span>LIMA · 12.04°S · 77.04°W</span>
      <span className="readout-sec">{t('ui.sector')} <b>{num(i)}</b> / {num(ESCENAS.length - 1)}</span>
    </div>
  )
}

/* ---------- Escenas ---------- */

function Inicio() {
  const { datos: { perfil }, t } = useIdioma()
  return (
    <section id="inicio" className="scene scene-hero">
      <div className="scene-inner hero-left">
        <Glitch as="h1" texto={perfil.nombreCorto} className="hero-title hero-in hero-in-2" />
        <p className="hero-kicker hero-in hero-in-3">
          {perfil.alias}
        </p>
        <p className="hero-desc hero-in hero-in-4">
          <span className="desc-larga">{perfil.resumen}</span>
          <span className="desc-corta">{perfil.resumenCorto}</span>
        </p>
        <a href="#sobre-mi" className="hero-down hero-in hero-in-5" aria-label={t('ui.bajar')}>
          <Icon name="arrowDown" size={22} />
        </a>
      </div>
    </section>
  )
}

function SobreMi() {
  const { datos: { perfil }, t } = useIdioma()
  return (
    <section id="sobre-mi" className="scene scene--left">
      <div className="scene-inner container">
        <Encabezado n="02" etiqueta={t('sobre.tag')} texto={t('sobre.titulo')} />
        <div className="about-grid">
          <div className="about-text panel">
            <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
            {perfil.sobreMi.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="about-stats">
            {perfil.datos.map((d) => (
              <div key={d.texto} className="panel stat">
                <strong className="grad">{d.valor}</strong>
                <span>{d.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/*
 * Experiencia: la sección se "fija" en pantalla y, mientras bajas con la ruedita, las tarjetas
 * se desplazan de izquierda a derecha. Cuando llegan al final, la página sigue bajando.
 * El alto de la sección = alto de pantalla + lo que tiene que recorrer la fila de tarjetas.
 */
function Experiencia() {
  const { datos: { experiencia }, t } = useIdioma()
  const seccion = useRef(null)
  const fila = useRef(null)
  const total = experiencia.length
  const [alto, setAlto] = useState(null)

  useEffect(() => {
    // Cada tarjeta "cuesta" 70% de pantalla de scroll.
    const medir = () => setAlto(window.matchMedia('(max-width: 768px)').matches ? null : window.innerHeight * (1 + (total - 1) * 0.7))
    medir()
    window.addEventListener('resize', medir)

    let raf = 0
    const mover = () => {
      const s = seccion.current
      const f = fila.current
      if (s && f && alto) {
        const r = s.getBoundingClientRect()
        const recorrido = s.offsetHeight - window.innerHeight
        const avance = recorrido > 0 ? Math.min(Math.max(-r.top / recorrido, 0), 1) : 0
        const activa = avance * (total - 1) // 0 = primera tarjeta al frente, 1 = la segunda…
        const items = f.querySelectorAll('.exp-item')
        const paso = items[0] ? items[0].offsetWidth + 40 : 0
        f.firstElementChild.style.transform = `translate3d(${-activa * paso}px, 0, 0)`
        items.forEach((it, i) => {
          const d = i - activa // <0 ya pasó, 0 al frente, >0 vienen detrás
          const escala = d < 0 ? 1 - Math.min(-d, 1) * 0.1 : 1 - Math.min(d, 2.5) * 0.06
          it.style.transform = `scale(${escala})`
          it.style.opacity = String(d < 0 ? Math.max(0, 1 + d * 1.3) : 1)
        })
        f.parentElement.style.setProperty('--avance', avance)
      }
      raf = requestAnimationFrame(mover)
    }
    raf = requestAnimationFrame(mover)
    return () => { window.removeEventListener('resize', medir); cancelAnimationFrame(raf) }
  }, [alto, total])

  return (
    <section id="experiencia" ref={seccion} className="scene scene-exp" style={alto ? { height: alto } : undefined}>
      <div className="scene-inner exp-sticky">
        <Encabezado n="03" etiqueta={t('exp.tag')} texto={t('exp.titulo')} />
        <div className="exp-row" ref={fila}>
          <ol className="exp-track">
            {experiencia.map((e) => (
              <li key={e.empresa} className="exp-item">
                <span className={`timeline-dot ${e.actual ? 'is-current' : ''}`} />
                <article className="panel exp-card">
                  <header className="exp-head">
                    <div>
                      <h3>{e.puesto}</h3>
                      <p className="exp-company"><Icon name="briefcase" size={16} /> {e.empresa}</p>
                    </div>
                    <span className={`exp-period ${e.actual ? 'is-current' : ''}`}>{e.periodo}</span>
                  </header>
                  <ul className="exp-list">{e.logros.map((l, i) => <li key={i}>{l}</li>)}</ul>
                  <div className="tags">{e.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                </article>
              </li>
            ))}
          </ol>
        </div>
        <div className="exp-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  )
}

function Educacion() {
  const { datos: { educacion }, t } = useIdioma()
  return (
    <section id="educacion" className="scene scene--right">
      <div className="scene-inner">
        <Encabezado n="04" etiqueta={t('edu.tag')} texto={t('edu.titulo')} />
        <div className="edu-list">
          {educacion.map((ed, i) => (
            <article key={ed.lugar} className="panel edu-card">
              <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
              <span className="edu-num">{num(i)}</span>
              <div>
                <span className="edu-tag"><Icon name="cap" size={16} /> {ed.enCurso ? t('edu.curso') : t('edu.completo')}</span>
                <h4>{ed.titulo}</h4>
                <p>{ed.lugar}</p>
                <span className="edu-periodo">{ed.periodo}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Proyectos() {
  const { datos: { proyectos }, t } = useIdioma()
  return (
    <section id="proyectos" className="scene scene--left">
      <div className="scene-inner">
        <Encabezado n="05" etiqueta={t('proy.tag')} texto={t('proy.titulo')} />
        {/* Lista inclinada en perspectiva; si hay muchos proyectos, la página simplemente sigue bajando. */}
        <div className="projects-list">
          {proyectos.map((p, i) => (
            <article key={p.nombre} className={`panel project-card accent-${p.color}`}>
              <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
              <div className="project-media">
                {p.imagen
                  ? <img src={p.imagen} alt={`${t('proy.captura')} ${p.nombre}`} loading="lazy" />
                  : <span className="project-media-empty"><Icon name="code" size={26} />{t('proy.imagen')}</span>}
                <span className="project-num">{num(i)}</span>
              </div>
              <div className="project-body">
                <div className="project-top">
                  <span className="project-type">{p.tipo}</span>
                  <div className="project-links">
                    {p.codigo && <a href={p.codigo} target="_blank" rel="noreferrer" aria-label={t('proy.codigo')}><Icon name="github" size={18} /></a>}
                    {p.demo && <a href={p.demo} target="_blank" rel="noreferrer" aria-label={t('proy.sitio')}><Icon name="external" size={18} /></a>}
                  </div>
                </div>
                <h3>{p.nombre}</h3>
                <p>{p.descripcion}</p>
                <div className="tags">{p.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// Logos de devicon (CDN). Lo que no tenga logo se muestra con un punto de color.
const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/'
const LOGOS = {
  Angular: 'angular/angular-original', React: 'react/react-original', TypeScript: 'typescript/typescript-original',
  JavaScript: 'javascript/javascript-original', RxJS: 'rxjs/rxjs-original', HTML5: 'html5/html5-original',
  CSS3: 'css3/css3-original', 'Tailwind CSS': 'tailwindcss/tailwindcss-original', Java: 'java/java-original',
  'Spring Boot': 'spring/spring-original', Python: 'python/python-original', FastAPI: 'fastapi/fastapi-original',
  MySQL: 'mysql/mysql-original', 'SQL Server': 'microsoftsqlserver/microsoftsqlserver-original', Git: 'git/git-original',
  GitHub: 'github/github-original', 'GitHub Actions': 'githubactions/githubactions-original', Postman: 'postman/postman-original',
  Insomnia: 'insomnia/insomnia-original', Windows: 'windows11/windows11-original', 'Node.js': 'nodejs/nodejs-original',
}
// Logos que no están en devicon (de Simple Icons, en blanco).
const LOGOS_EXTRA = { Railway: 'https://cdn.simpleicons.org/railway/ffffff' }

/*
 * Reparte las skills en dos arcos (como un arcoíris) sobre y a los lados del carro.
 * Devuelve la posición de cada una en % de la pantalla: el centro del arco queda detrás del carro,
 * y los arcos solo usan la mitad de arriba, así ninguna queda encima del carro.
 */
function posicionesArco(total) {
  const exterior = Math.ceil(total * 0.58)
  const interior = total - exterior
  const arco = (n, rx, ry, desde, hasta) => Array.from({ length: n }, (_, i) => {
    const a = THREE_RAD * (desde + ((hasta - desde) * (n === 1 ? 0.5 : i / (n - 1))))
    return { x: 50 + Math.cos(a) * rx, y: 70 - Math.sin(a) * ry }
  })
  return [...arco(exterior, 37, 52, 190, -10), ...arco(interior, 26, 36, 178, 2)].map((p) => ({ ...p, x: p.x - 2 }))
}
const THREE_RAD = Math.PI / 180

function Habilidades() {
  const { datos: { habilidades }, t } = useIdioma()
  const items = habilidades.flatMap((h) => h.items.map((nombre) => ({ nombre, grupo: h.grupo })))
  const pos = posicionesArco(items.length)
  return (
    <section id="habilidades" className="scene scene-skills">
      <div className="scene-inner skills-stage">
        <div className="skills-head">
          <span className="scene-tag"><b>06</b> // {t('hab.tag')}</span>
          <Glitch texto={t('hab.titulo')} />
        </div>
        <ul className="skills-orbit" aria-label={t('hab.aria')}>
          {items.map((it, i) => (
            <li key={it.nombre} className="skill-float"
              style={{ '--x': `${pos[i].x}%`, '--y': `${pos[i].y}%`, '--d': `${(i % 7) * -0.7}s`, '--t': `${5 + (i % 4)}s` }}
              title={it.grupo}>
              {LOGOS_EXTRA[it.nombre]
                ? <img src={LOGOS_EXTRA[it.nombre]} alt="" loading="lazy" />
                : LOGOS[it.nombre]
                ? <img src={`${DEVICON}${LOGOS[it.nombre]}.svg`} alt="" loading="lazy" className={it.nombre === 'GitHub' ? 'is-dark' : ''} />
                : <span className="skill-dot" />}
              <span>{it.nombre}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Contacto() {
  const { datos: { perfil }, t } = useIdioma()
  const c = perfil.contacto
  const canales = [
    { icon: 'mail', titulo: t('con.correo'), texto: c.email, href: `mailto:${c.email}` },
    { icon: 'whatsapp', titulo: 'WhatsApp', texto: c.whatsappTexto, href: `https://wa.me/${c.whatsapp}` },
    { icon: 'linkedin', titulo: 'LinkedIn', texto: t('con.perfil'), href: c.linkedin },
    { icon: 'github', titulo: 'GitHub', texto: c.github.replace('https://', ''), href: c.github },
  ]
  return (
    <section id="contacto" className="scene">
      <div className="scene-inner container">
        <div className="contact-box panel">
          <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
          <span className="scene-tag"><b>07</b> // {t('con.tag')}</span>
          <Glitch texto={t('con.titulo')} />
          <p>{t('con.texto')}</p>
          <div className="contact-grid">
            {canales.map((ch) => (
              <a key={ch.icon} href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer" className="contact-item">
                <span className="contact-icon"><Icon name={ch.icon} size={22} /></span>
                <span className="contact-info"><strong>{ch.titulo}</strong><span>{ch.texto}</span></span>
              </a>
            ))}
          </div>
          <FormContacto destino={c.email} t={t} />
        </div>
      </div>
      <footer className="footer">
        <span>© {ANIO} {perfil.nombre}</span>
        <span className="footer-end">{t('pie.fin')}</span>
      </footer>
    </section>
  )
}

const ANIO = new Date().getFullYear()

export default function App() {
  const [activa, setActiva] = useState('inicio')
  const [progreso, setProgreso] = useState(0)
  const [carga, setCarga] = useState(0)
  const [listo, setListo] = useState(false)
  useViaje(setActiva, setProgreso)
  useRutas(activa)

  const onProgreso = useCallback((v) => setCarga(v), [])
  const onListo = useCallback(() => { setCarga(1); setListo(true) }, [])
  const { t } = useIdioma()

  return (
    <>
      <World3D onProgreso={onProgreso} onListo={onListo} onError={onListo} />
      <div className="vignette" aria-hidden="true" />
      <div className={`loader ${listo ? 'is-done' : ''}`} aria-hidden={listo}>
        <Velocimetro carga={carga} listo={listo} titulo={t('carga.titulo')} tituloListo={t('carga.listo')} />
      </div>
      <TopBar />
      <SideNav activa={activa} progreso={progreso} />
      <Readout activa={activa} />
      <main className={listo ? '' : 'is-loading'}>
        <Inicio />
        <SobreMi />
        <Experiencia />
        <Educacion />
        <Proyectos />
        <Habilidades />
        <Contacto />
      </main>
    </>
  )
}
