import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { espacio } from './espacio.js'

const MODELO = '/models/jesko/abs.fbx'
const TEXTURAS = '/models/jesko/textures/'
const LARGO = 4.6 // largo del carro en unidades de la escena
const COLOR_PINTURA = 0x3a3c44 // gris grafito (cámbialo para pintar el carro de otro color)
const COLOR_DETALLE = 0xe8661c // franjas y detalles naranjas

/*
 * Posiciones de cámara y carro por escena (una por sección, en orden).
 *  az   = ángulo de la cámara alrededor del carro (0 = de frente, 180 = por detrás)
 *  el   = altura de la cámara en grados
 *  dist = distancia al carro
 *  sx   = corre el carro en pantalla (negativo → carro a la derecha, positivo → a la izquierda)
 *  sy   = sube el punto de mira (positivo → el carro se ve más abajo)
 *  pos  = dónde está el carro [x, z]; ry = hacia dónde mira (radianes)
 *  luces: faros, freno, reversa (0 a 2)
 *  motor = 1 motor encendido sin avanzar: vibra, quema llanta, mueve la dirección y laten los faros
 *  nebulosa = nebulosas que pasan por el horizonte · carril = cambia de carril, acelera y frena sin detenerse
 *  volante = ángulo fijo de las ruedas delanteras (negativo = a la derecha) · destello = parpadeo corto cada 2,5 s
 *  marcha = 0 quieto · 1 "avanzando" sin moverse de lugar (ruedas, piso y viento se mueven)
 */
const ESCENAS = [
  // 01 Inicio: ruedas delanteras dobladas a la derecha y destello de luces cada 2,5 s
  { az: -50, el: 7, dist: 3.8, sx: -1.0, sy: 0.0, pos: [0, 0], ry: 0, faros: 0.6, freno: 0.25, reversa: 0, marcha: 0, parpadeo: 0, motor: 0, volante: -0.48, destello: 1, nebulosa: 0, carril: 0 },
  // 02 Sobre mí
  { az: 60, el: 7, dist: 3.9, sx: -1.25, sy: -0.05, pos: [0, 5], ry: 0, faros: 1, freno: 0.25, reversa: 0, marcha: 0, parpadeo: 0, motor: 0, volante: 0, destello: 0, nebulosa: 0, carril: 0 },
  // 03 Experiencia: de perfil, motor encendido, levantando la cola
  { az: -90, el: 7, dist: 8.4, sx: -2.35, sy: 0.75, pos: [3, 9], ry: 0.45, faros: 0.45, freno: 0.8, reversa: 0, marcha: 0, parpadeo: 0, motor: 1, volante: 0, destello: 0, nebulosa: 0, carril: 0 },
  // 04 Educación: desde arriba y por detrás, el carro a la izquierda
  { az: -215, el: 14, dist: 5.9, sx: 2.75, sy: -0.45, pos: [5, 13], ry: 0.6, faros: 0.3, freno: 1.2, reversa: 0, marcha: 0, parpadeo: 1, motor: 0, volante: 0, destello: 0, nebulosa: 0, carril: 0 },
  // 05 Proyectos (los ángulos siguientes van "desenrollados" para que la cámara gire por el lado corto)
  { az: -332, el: 8, dist: 4.9, sx: -1.55, sy: 0.15, pos: [5, 16], ry: 0.45, faros: 1.3, freno: 0.25, reversa: 0, marcha: 1, parpadeo: 0, motor: 0, volante: 0, destello: 0, nebulosa: 0, carril: 0 },
  // 06 Habilidades
  { az: -360, el: 5, dist: 4.7, sx: 0, sy: 0.38, pos: [2, 12], ry: -0.15, faros: 0.4, freno: 0.3, reversa: 0, marcha: 0, parpadeo: 1, motor: 0, volante: 0, destello: 0, nebulosa: 1, carril: 0 },
  // 07 Contacto
  { az: -228, el: 6, dist: 7.2, sx: 0, sy: 0.85, pos: [2, 12], ry: -0.15, faros: 1, freno: 0.3, reversa: 0, marcha: 1.3, parpadeo: 0, motor: 0, volante: 0, destello: 0, nebulosa: 0, carril: 1 },
]
const PORTADA = '/portada.png' // imagen opcional detrás del carro en el Inicio (ej. tu cara, fondo transparente)
const VEL_MARCHA = 9 // velocidad "aparente" cuando el carro avanza en su lugar

const lerp = (a, b, t) => a + (b - a) * t
// Derrape de Experiencia: la cola barre media vuelta (±80°) alrededor de la trompa.
const AMPLITUD_DERRAPE = 1.4 // radianes por lado (~80°)
const PERIODO_DERRAPE = 6400 // ms por ciclo completo (izquierda → derecha → izquierda)
const ADELANTO_RUEDAS = 0.45 // radianes de fase: las ruedas cambian de lado ~0,45 s antes de que la cola llegue al tope

/*
 * Derrape continuo y suave (como un péndulo):
 *  - La cola barre media vuelta con una onda seno: frena al llegar a cada extremo y acelera de a poco al volver.
 *  - Las ruedas delanteras apuntan hacia donde va a ir la cola y cambian de lado UN POCO ANTES de que la cola
 *    llegue al tope; así la cola termina de llegar con las ruedas ya giradas y recién después regresa.
 * volante > 0 = ruedas a la izquierda del carro; barrido < 0 = cola hacia la izquierda.
 */
function estadoDerrape(ms) {
  const fase = (ms / PERIODO_DERRAPE) * Math.PI * 2
  const barrido = -Math.sin(fase) * AMPLITUD_DERRAPE
  // La cola se mueve hacia barrido negativo cuando cos(fase) > 0 → ruedas a la izquierda (volante > 0).
  const volante = 0.6 * (Math.tanh(5 * Math.cos(fase + ADELANTO_RUEDAS)) / Math.tanh(5))
  return { volante, barrido }
}
const DURACION_INTRO = 4600 // ms

/*
 * Coreografía de la entrada, en coordenadas de la pose final del carro (z = adelante, x = costado).
 * El carro viene desde el fondo zigzagueando por este camino y en la última curva DERRAPA:
 * la trompa se adelanta hacia dentro de la curva (~40°) mientras el carro se desliza, y se endereza al frenar.
 */
// Camino en coordenadas de pantalla del Inicio: a = hacia la derecha de la pantalla, d = hacia el fondo.
// Aparece al fondo a la derecha, cruza hacia la izquierda, da UNA vuelta en U, vuelve hacia la derecha
// y entra recto a su lugar. El último tramo llega justo en la dirección final del carro (sin corregir de golpe).
const PUNTOS_PANTALLA = [[14, 40], [3, 33.5], [-7, 27.5], [-12.5, 21.5], [-12, 15], [-8, 10], [-4.2, 5.6], [-1.8, 2.1], [0, 0]]
const CAMINO_INTRO = (() => {
  // La cámara del Inicio mira el carro desde su costado derecho-delantero (az -50°):
  // derecha de pantalla ≈ (+x, +z) y fondo ≈ (+x, -z) del carro (medido proyectando en pantalla).
  const der = new THREE.Vector3(1, 0, 1).normalize()
  const fondo = new THREE.Vector3(1, 0, -1).normalize()
  return new THREE.CatmullRomCurve3(
    PUNTOS_PANTALLA.map(([a, d]) => new THREE.Vector3().addScaledVector(der, a).addScaledVector(fondo, d)),
    false, 'centripetal',
  )
})()
const ANG_DERRAPE = 0.18 // la trompa se cruza un poco en la vuelta (~10°), sin trompos

function poseIntro(u) {
  const s = THREE.MathUtils.clamp(1 - Math.pow(1 - THREE.MathUtils.clamp(u, 0, 1), 3.6), 0, 1) // llega muy rápido desde el fondo y frena fuerte para estacionarse
  const p = CAMINO_INTRO.getPointAt(s)
  const t = CAMINO_INTRO.getTangentAt(s)
  let giro = Math.atan2(t.x, t.z)
  // Hacia dónde dobla la curva (para cruzar la trompa hacia dentro)
  const t2 = CAMINO_INTRO.getTangentAt(Math.min(s + 0.02, 1))
  const doblez = Math.sign(Math.atan2(t2.x, t2.z) - giro) || 1
  const w = THREE.MathUtils.clamp((s - 0.3) / 0.35, 0, 1) // solo durante la vuelta en U
  const derrape = Math.sin(Math.PI * w)
  giro += doblez * ANG_DERRAPE * derrape
  // Al final se endereza hasta su pose
  const fin = THREE.MathUtils.smoothstep(s, 0.92, 1)
  giro = lerp(giro, 0, fin)
  return { x: p.x, z: p.z, giro, derrape: derrape * doblez }
}
const suave = (t) => t * t * (3 - 2 * t)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

function escenaEn(t) {
  const n = ESCENAS.length - 1
  const c = Math.min(Math.max(t, 0), n)
  const i = Math.min(Math.floor(c), n - 1)
  const f = suave(c - i)
  const a = ESCENAS[i]
  const b = ESCENAS[i + 1]
  const r = {}
  for (const k of Object.keys(a)) {
    r[k] = Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, b[k][j], f)) : lerp(a[k], b[k], f)
  }
  return r
}

// Convierte los materiales del FBX a materiales físicos (se ven mejor con la luz del entorno).
function material(m, nombre) {
  const n = nombre.toLowerCase()
  const std = new THREE.MeshStandardMaterial({
    map: m.map || null,
    color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
    transparent: m.transparent,
    opacity: m.opacity ?? 1,
    alphaMap: m.alphaMap || null,
    normalMap: m.normalMap || null,
    side: m.side,
    metalness: 0.3,
    roughness: 0.45,
    envMapIntensity: 1,
  })
  if (n.includes('glass') || n.includes('window')) { std.color.set(0x1a1a22); std.metalness = 0.9; std.roughness = 0.05; std.transparent = true; std.opacity = 0.55; std.envMapIntensity = 2 }
  else if (n.includes('tire') || n.includes('tyre') || n.includes('rubber')) { std.metalness = 0; std.roughness = 0.9 }
  // La pintura la pone el juego por código: la textura es clara y se tiñe con el color del carro.
  else if (n.includes('carpaint_orange')) { std.color.set(COLOR_DETALLE); std.metalness = 0.4; std.roughness = 0.35 }
  else if (n.includes('carpaint') || n.includes('paint')) { std.color.set(COLOR_PINTURA); std.metalness = 0.6; std.roughness = 0.4; std.envMapIntensity = 1.4 }
  else if (n.includes('carbon')) { std.metalness = 0.5; std.roughness = 0.35 }
  else if (n.includes('chrome') || n.includes('metal')) { std.metalness = 1; std.roughness = 0.15 }
  return std
}

// Nombre del objeto + el de sus padres (para clasificar piezas).
function ruta(obj) {
  let s = ''
  for (let o = obj; o; o = o.parent) s += ' ' + (o.name || '') + ' ' + (Array.isArray(o.material) ? '' : o.material?.name || '')
  return s.toLowerCase()
}

export default function World3D({ onProgreso, onListo, onError }) {
  const ref = useRef(null)

  useEffect(() => {
    const contenedor = ref.current
    const movil = window.matchMedia('(max-width: 768px)').matches
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---------- Render ----------
    const renderer = new THREE.WebGLRenderer({ antialias: !movil, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, movil ? 1.25 : 1.75))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.shadowMap.enabled = !movil
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    contenedor.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020509)
    scene.fog = new THREE.FogExp2(0x02070d, 0.032)
    const pmrem = new THREE.PMREMGenerator(renderer)
    // Reflejos de estudio solo para el carro (si se aplican a toda la escena, el piso se ve gris).
    const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const camera = new THREE.PerspectiveCamera(movil ? 50 : 38, window.innerWidth / window.innerHeight, 0.1, 600)

    // ---------- Luces del ambiente ----------
    scene.add(new THREE.HemisphereLight(0xc9ecff, 0x02080e, 0.4))
    const luzArriba = new THREE.SpotLight(0xffffff, 85, 40, 0.5, 0.8, 1.6)
    luzArriba.position.set(0, 14, 2)
    luzArriba.castShadow = !movil
    luzArriba.shadow.mapSize.set(1024, 1024)
    scene.add(luzArriba, luzArriba.target)
    const contraluz = new THREE.PointLight(0x2563eb, 5, 30, 1.8)
    contraluz.position.set(-6, 3, -6)
    scene.add(contraluz)
    const rim = new THREE.DirectionalLight(0x3b82f6, 0.45)
    rim.position.set(8, 4, -8)
    const relleno = new THREE.DirectionalLight(0xffffff, 0.6)
    relleno.position.set(6, 5, 10)
    scene.add(rim, relleno)

    // ---------- Piso reflectante con rejilla ----------
    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x030a12, metalness: 0.15, roughness: 0.75 }),
    )
    piso.rotation.x = -Math.PI / 2
    piso.receiveShadow = true
    scene.add(piso)
    const rejilla = new THREE.GridHelper(400, 200, 0x3b82f6, 0x0c2a5e)
    rejilla.material.transparent = true
    rejilla.material.opacity = 0.28
    rejilla.position.y = 0.002
    scene.add(rejilla)

    // ---------- Estrellas ----------
    const total = movil ? 1500 : 3500
    const pos = new Float32Array(total * 3)
    for (let i = 0; i < total; i++) {
      const r = 120 + Math.random() * 160
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 0.95) // solo cielo
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.cos(ph) + 5
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const geoEstrellas = new THREE.BufferGeometry()
    geoEstrellas.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const estrellas = new THREE.Points(geoEstrellas, new THREE.PointsMaterial({ color: 0xd6f1ff, size: 0.7, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 }))
    scene.add(estrellas)

    // ---------- Post-proceso: brillo en las luces ----------
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.45, 0.95)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    // ---------- Carro ----------
    const carro = new THREE.Group() // se mueve y gira con las escenas
    carro.rotation.order = 'YXZ' // primero el rumbo, después el cabeceo (sobre su propio eje)
    const ajuste = new THREE.Group() // corrige escala, orientación y centro del modelo
    carro.add(ajuste)
    scene.add(carro)
    const ruedas = [] // { grupo, eje, radio }
    const luces = { faros: [], traseras: [], freno: [], reversa: [] }
    let cargado = false
    let introInicio = 0

    const manager = new THREE.LoadingManager()
    // Las texturas del FBX apuntan a rutas de la PC del autor: se redirigen a nuestra carpeta.
    manager.setURLModifier((url) => {
      if (url.startsWith('blob:') || url.startsWith('data:')) return url
      const archivo = decodeURIComponent(url).split(/[\\/]/).pop()
      return /\.(png|jpe?g|tga|bmp)$/i.test(archivo) ? TEXTURAS + archivo : url
    })

    const loader = new FBXLoader(manager)
    let cancelado = false
    loader.load(
      MODELO,
      (modelo) => {
        if (cancelado) return
        ajuste.add(modelo)
        // Todas las medidas se toman con el carro en el origen (la intro lo tiene lejos).
        carro.position.set(0, 0, 0)
        carro.rotation.set(0, 0, 0)
        carro.updateMatrixWorld(true)

        // Materiales y clasificación de piezas.
        modelo.traverse((o) => {
          if (!o.isMesh) return
          o.castShadow = true
          o.receiveShadow = true
          const nombre = ruta(o)
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          const nuevos = mats.map((m) => material(m, nombre + ' ' + (m.name || '')))
          nuevos.forEach((m) => { m.envMap = entorno; m.envMapIntensity *= 0.2 })
          o.material = Array.isArray(o.material) ? nuevos : nuevos[0]
          if (nombre.includes('light') || nombre.includes('glow')) {
            const base = Array.isArray(o.material) ? o.material[0] : o.material
            o.material = new THREE.MeshBasicMaterial({
              map: base.map, color: 0x000000, transparent: true, depthWrite: false,
              blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
            })
            o.castShadow = false
            o.receiveShadow = false
            o.userData.luz = nombre
          }
        })

        // Si viene "acostado" (Z arriba), lo paramos.
        let caja = new THREE.Box3().setFromObject(ajuste)
        let tam = caja.getSize(new THREE.Vector3())
        if (tam.y > tam.x && tam.y > tam.z) modelo.rotation.x = -Math.PI / 2

        // Ruedas: buscamos wheelFL/FR/BL/BR.
        const llantas = {}
        modelo.traverse((o) => {
          const m = /^wheel(FL|FR|BL|BR)\d*$/i.exec(o.name || '')
          if (m && !llantas[m[1].toUpperCase()]) llantas[m[1].toUpperCase()] = o
        })
        ajuste.updateMatrixWorld(true)
        const centro = (o) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())

        // Orientación: la trompa del carro mira hacia +Z.
        if (llantas.FL && llantas.BL) {
          const frente = centro(llantas.FL).add(llantas.FR ? centro(llantas.FR) : centro(llantas.FL)).multiplyScalar(0.5)
          const atras = centro(llantas.BL).add(llantas.BR ? centro(llantas.BR) : centro(llantas.BL)).multiplyScalar(0.5)
          const dir = frente.sub(atras)
          ajuste.rotation.y = -Math.atan2(dir.x, dir.z)
        }

        // Escala y centro.
        ajuste.updateMatrixWorld(true)
        caja = new THREE.Box3().setFromObject(ajuste)
        tam = caja.getSize(new THREE.Vector3())
        const escala = LARGO / Math.max(tam.z, tam.x)
        ajuste.scale.setScalar(escala)
        ajuste.updateMatrixWorld(true)
        caja = new THREE.Box3().setFromObject(ajuste)
        const c = caja.getCenter(new THREE.Vector3())
        ajuste.position.set(-c.x, -caja.min.y, -c.z)
        ajuste.updateMatrixWorld(true)
        caja = new THREE.Box3().setFromObject(ajuste)
        tam = caja.getSize(new THREE.Vector3())

        // Cada rueda gira dentro de un grupo puesto en su centro.
        const ejeMundo = llantas.FL && llantas.FR
          ? centro(llantas.FL).sub(centro(llantas.FR)).normalize()
          : new THREE.Vector3(1, 0, 0)
        for (const [clave, llanta] of Object.entries(llantas)) {
          const padre = llanta.parent
          const cMundo = centro(llanta)
          const radio = new THREE.Box3().setFromObject(llanta).getSize(new THREE.Vector3()).y / 2 || 0.35
          const grupo = new THREE.Group()
          padre.add(grupo)
          grupo.position.copy(padre.worldToLocal(cMundo.clone()))
          grupo.updateMatrixWorld(true)
          grupo.attach(llanta)
          const inv = new THREE.Matrix4().copy(padre.matrixWorld).invert()
          const eje = ejeMundo.clone().transformDirection(inv)
          // Las delanteras van dentro de otro grupo que las dobla a izquierda/derecha.
          let direccion = null
          let vertical = null
          if (clave.startsWith('F')) {
            direccion = new THREE.Group()
            padre.add(direccion)
            direccion.position.copy(grupo.position)
            direccion.updateMatrixWorld(true)
            direccion.attach(grupo)
            vertical = new THREE.Vector3(0, 1, 0).transformDirection(inv)
          }
          ruedas.push({ grupo, eje, radio, direccion, vertical, trasera: !clave.startsWith('F') })
        }

        // Luces: se clasifican por nombre y por si están adelante o atrás.
        modelo.traverse((o) => {
          if (!o.isMesh || !o.userData.luz) return
          const n = o.userData.luz
          const z = centro(o).z
          const mat = o.material
          if (n.includes('front_and_back')) { mat.userData.tono = new THREE.Color(0xffffff); luces.faros.push(mat) }
          else if (n.includes('brake')) { mat.userData.tono = new THREE.Color(0xff2a3a); luces.freno.push(mat) }
          else if (n.includes('reverse')) { mat.userData.tono = new THREE.Color(0xffffff); luces.reversa.push(mat) }
          else if (z > 0) { mat.userData.tono = new THREE.Color(0xffffff); luces.faros.push(mat) }
          else { mat.userData.tono = new THREE.Color(0xff2a3a); luces.traseras.push(mat) }
        })


        if (import.meta.env.DEV) window.__mundo = { scene, carro, luces, ruedas, camera }
        cargado = true
        introInicio = performance.now()
        onListo?.()
      },
      (e) => { if (e.total) onProgreso?.(e.loaded / e.total) },
      (err) => { console.error('No se pudo cargar el carro:', err); onError?.(); cargado = false },
    )

    // ---------- Viento: rayas de luz que pasan al lado del carro cuando "avanza" ----------
    const RAYAS = movil ? 40 : 90
    const rayasPos = new Float32Array(RAYAS * 6)
    const rayas = []
    for (let i = 0; i < RAYAS; i++) {
      const lado = Math.random() < 0.5 ? -1 : 1
      rayas.push({ x: lado * (1.4 + Math.random() * 5), y: 0.05 + Math.random() * 2.2, z: (Math.random() * 2 - 1) * 30, l: 1.5 + Math.random() * 3 })
    }
    const geoRayas = new THREE.BufferGeometry()
    geoRayas.setAttribute('position', new THREE.BufferAttribute(rayasPos, 3))
    const matRayas = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const viento = new THREE.LineSegments(geoRayas, matRayas)
    viento.frustumCulled = false
    carro.add(viento)

    // ---------- Humo de llanta quemada (ruedas traseras, con motor encendido) ----------
    const lienzo = document.createElement('canvas')
    lienzo.width = lienzo.height = 64
    const g2 = lienzo.getContext('2d')
    const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.45, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g2.fillStyle = grad
    g2.fillRect(0, 0, 64, 64)
    const texHumo = new THREE.CanvasTexture(lienzo)
    const HUMO = movil ? 26 : 60
    const humo = []
    for (let i = 0; i < HUMO; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHumo, color: 0x9fb4cc, transparent: true, opacity: 0, depthWrite: false }))
      sp.visible = false
      scene.add(sp)
      humo.push({ sp, vida: 0, dur: 1, vel: new THREE.Vector3() })
    }
    let siguienteHumo = 0
    const posRueda = new THREE.Vector3()

    // ---------- Nebulosas que pasan por el horizonte (Habilidades) ----------
    const lienzoNeb = document.createElement('canvas')
    lienzoNeb.width = lienzoNeb.height = 128
    const gN = lienzoNeb.getContext('2d')
    for (let i = 0; i < 7; i++) { // nube irregular: varias manchas suaves superpuestas
      const x = 40 + Math.random() * 48, y = 44 + Math.random() * 40, r = 26 + Math.random() * 30
      const gr = gN.createRadialGradient(x, y, 0, x, y, r)
      gr.addColorStop(0, 'rgba(255,255,255,0.55)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      gN.fillStyle = gr
      gN.fillRect(0, 0, 128, 128)
    }
    const texNeb = new THREE.CanvasTexture(lienzoNeb)
    const COLORES_NEB = [0x2563eb, 0x0ea5e9, 0x14b8a6, 0x3b82f6, 0x1d4ed8, 0x22d3ee]
    const nebulosas = Array.from({ length: movil ? 5 : 9 }, (_, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texNeb, color: COLORES_NEB[i % COLORES_NEB.length], transparent: true, opacity: 0,
        depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      }))
      const ancho = 22 + Math.random() * 26
      sp.scale.set(ancho, ancho * (0.18 + Math.random() * 0.12), 1)
      sp.visible = false
      scene.add(sp)
      return { sp, x: (Math.random() * 2 - 1) * 70, alto: 0.6 + Math.random() * 2.6, vel: 14 + Math.random() * 16, prof: 55 + Math.random() * 30 }
    })
    const vistaDer = new THREE.Vector3()
    const vistaFondo = new THREE.Vector3()

    // ---------- Polvo de luz: partículas que flotan alrededor del carro en todas las escenas ----------
    const POLVO = movil ? 140 : 320
    const polvoPos = new Float32Array(POLVO * 3)
    const polvoVel = new Float32Array(POLVO)
    for (let i = 0; i < POLVO; i++) {
      polvoPos[i * 3] = (Math.random() * 2 - 1) * 11
      polvoPos[i * 3 + 1] = Math.random() * 4.5
      polvoPos[i * 3 + 2] = (Math.random() * 2 - 1) * 11
      polvoVel[i] = 0.08 + Math.random() * 0.25
    }
    const geoPolvo = new THREE.BufferGeometry()
    geoPolvo.setAttribute('position', new THREE.BufferAttribute(polvoPos, 3))
    const polvo = new THREE.Points(geoPolvo, new THREE.PointsMaterial({
      color: 0x7dd3fc, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    polvo.frustumCulled = false
    scene.add(polvo)

    // ---------- Portada opcional detrás del carro (public/portada.png) ----------
    let portada = null
    new THREE.TextureLoader().load(PORTADA, (tex) => {
      if (cancelado) return
      tex.colorSpace = THREE.SRGBColorSpace
      const proporcion = tex.image.width / tex.image.height
      portada = new THREE.Mesh(
        new THREE.PlaneGeometry(7 * proporcion, 7),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }),
      )
      scene.add(portada)
    }, undefined, () => { /* sin portada: no pasa nada */ })

    // ---------- Animación ----------
    const objetivoPos = new THREE.Vector3()
    const objetivoMira = new THREE.Vector3()
    const derecha = new THREE.Vector3()
    const derecha2 = new THREE.Vector3()
    const adelante = new THREE.Vector3()
    const base = new THREE.Vector3()
    const atras = new THREE.Vector3()
    const posAnterior = new THREE.Vector3()
    const camMira0 = new THREE.Vector3(0, 1, 0)
    let primera = true
    let ultimo = performance.now()
    let raf = 0
    let actual = null // parámetros que se ven ahora (cámara, carro, luces): persiguen a la escena objetivo
    let recorrido = 0 // distancia virtual recorrida en marcha
    let rumbo = 0 // hacia dónde apunta la trompa (radianes)
    let direccion = 0 // ángulo de las ruedas delanteras

    const fijarLuces = (lista, nivel) => lista.forEach((m) => { m.color.copy(m.userData.tono).multiplyScalar(Math.min(nivel, 1.6)) })
    const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)) // diferencia de ángulos por el lado corto

    const cuadro = (ahora) => {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05)
      ultimo = ahora

      // Transición directa: si saltas de la escena 1 a la 4, va de 1 a 4 sin pasar por la 2 y la 3
      // (pasar por todas era lo que hacía "volverse loca" a la cámara). Se suaviza cada parámetro.
      const objetivo = escenaEn(espacio.t)
      if (!actual || reducir) actual = { ...objetivo, pos: [...objetivo.pos] }
      else {
        const k = 1 - Math.pow(0.12, dt) // ~1 s para llegar casi del todo
        for (const c of Object.keys(objetivo)) {
          if (c === 'pos') actual.pos = actual.pos.map((v, j) => lerp(v, objetivo.pos[j], k))
          else actual[c] = lerp(actual[c], objetivo[c], k)
        }
      }
      const e = actual

      // Intro: el carro aparece desde el fondo zigzagueando, derrapa dando una vuelta completa
      // y queda en su pose. Las luces se encienden cuando se detiene.
      let intro = 1
      if (cargado && !reducir) intro = THREE.MathUtils.clamp((ahora - introInicio) / DURACION_INTRO, 0, 1)
      if (!cargado) intro = 0
      const llegada = easeOut(intro)
      const destX = e.pos[0], destZ = e.pos[1]
      adelante.set(Math.sin(e.ry), 0, Math.cos(e.ry))
      const enIntro = intro < 1
      // 0 mientras llega; sube a 1 en el medio segundo después de estacionarse.
      const yaEstacionado = reducir || !cargado ? 1 : THREE.MathUtils.clamp((ahora - introInicio - DURACION_INTRO) / 500, 0, 1)
      let derrape = 0
      if (enIntro) {
        const pose = poseIntro(intro)
        derecha2.set(Math.cos(e.ry), 0, -Math.sin(e.ry))
        carro.position.set(destX, 0, destZ).addScaledVector(adelante, pose.z).addScaledVector(derecha2, pose.x)
        derrape = pose.derrape
      } else {
        carro.position.set(destX, 0, destZ)
        if (e.carril > 0.01) {
          // Zigzag entre carriles con dos ondas desfasadas (no se ve repetitivo) y un leve avance/retroceso al acelerar.
          const tt = ahora / 1000
          const lateral = (Math.sin(tt * 0.55) * 1.7 + Math.sin(tt * 0.23 + 1.3) * 0.7) * e.carril
          const empuje = Math.sin(tt * 0.31) * 0.9 * e.carril
          derecha2.set(Math.cos(e.ry), 0, -Math.sin(e.ry))
          carro.position.addScaledVector(derecha2, lateral).addScaledVector(adelante, empuje)
        }
      }

      // Rumbo: mientras se desplaza, la trompa apunta hacia donde va (o hacia atrás si va en reversa);
      // quieto, vuelve al ángulo de la escena. Así el carro "dobla" en las transiciones.
      const vel = carro.position.clone().sub(posAnterior).divideScalar(Math.max(dt, 1e-4))
      const rapidez = primera ? 0 : Math.hypot(vel.x, vel.z)
      let rumboDeseado = e.ry
      if (e.carril > 0.01 && intro >= 1) {
        // La "velocidad hacia adelante" en marcha es VEL_MARCHA: el giro sale del movimiento lateral.
        const lateralVel = vel.x * Math.cos(e.ry) - vel.z * Math.sin(e.ry)
        rumboDeseado = e.ry + Math.atan2(lateralVel, VEL_MARCHA * 0.55) * e.carril
      } else if (rapidez > 0.6 && intro >= 1 && e.motor < 0.01) {
        const haciaVel = Math.atan2(vel.x, vel.z)
        const reversa = Math.abs(angDif(haciaVel, e.ry)) > Math.PI / 2
        const mov = reversa ? haciaVel + Math.PI : haciaVel
        rumboDeseado = e.ry + angDif(mov, e.ry) * THREE.MathUtils.clamp(rapidez / 4, 0, 1)
      }
      let giroRumbo = angDif(rumboDeseado, rumbo) * (1 - Math.pow(0.12, dt))
      if (enIntro) {
        // Durante la intro el rumbo lo dicta la coreografía (zigzag + trompo).
        const objetivoIntro = e.ry + poseIntro(intro).giro
        giroRumbo = primera ? 0 : angDif(objetivoIntro, rumbo) * (1 - Math.pow(0.0005, dt))
        rumbo = primera ? objetivoIntro : rumbo + giroRumbo
      } else {
        rumbo = primera ? e.ry : rumbo + giroRumbo
      }
      carro.rotation.y = rumbo
      // Motor encendido (Experiencia): derrape anclado en la trompa. Las delanteras se doblan y la cola barre
      // hacia ese mismo lado girando alrededor del eje delantero (la trompa queda fija, como ancla).
      if (e.motor > 0.01) {
        // Primero se doblan las ruedas y después barre la cola (ver estadoDerrape).
        const barrido = estadoDerrape(ahora).barrido * e.motor
        const ejeDelantero = LARGO * 0.32
        const fwd0x = Math.sin(rumbo), fwd0z = Math.cos(rumbo)
        const fwd1x = Math.sin(rumbo + barrido), fwd1z = Math.cos(rumbo + barrido)
        // pivote = punto del eje delantero; el centro del carro gira a su alrededor
        carro.position.x += ejeDelantero * (fwd0x - fwd1x)
        carro.position.z += ejeDelantero * (fwd0z - fwd1z)
        carro.rotation.y = rumbo + barrido
      }
      // Motor encendido: el carro vibra un poquito (motor en ralentí).
      carro.position.y = e.motor * 0.007 * Math.sin(ahora * 0.09)
      carro.rotation.z = e.motor * 0.0035 * Math.sin(ahora * 0.071)

      // Ruedas delanteras: se doblan según cuánto está girando el carro.
      const dirDeseada = THREE.MathUtils.clamp((giroRumbo / Math.max(dt, 1e-4)) * 1.1, -0.62, 0.62)
      // En el derrape las delanteras hacen contravolante.
      direccion = lerp(direccion, dirDeseada + e.volante * yaEstacionado - derrape * 0.55, 1 - Math.pow(0.004, dt))
      // Volante del derrape: se dobla rápido hasta el tope y se queda ahí (sin suavizado, para que vaya ANTES que la cola).
      const volanteDerrape = e.motor * estadoDerrape(ahora).volante
      const direccionFinal = direccion + volanteDerrape

      // Ruedas: giran según lo que avanza el carro + la marcha "en su lugar".
      adelante.set(Math.sin(rumbo), 0, Math.cos(rumbo))
      const acelera = 1 + Math.sin(ahora / 1000 * 0.31 + 0.8) * 0.45 * e.carril
      const marcha = e.marcha * VEL_MARCHA * acelera * dt
      recorrido += marcha
      const desplazo = carro.position.clone().sub(posAnterior)
      // En la intro las ruedas giran con todo lo recorrido (también de lado, al derrapar).
      const avance = (primera ? 0 : enIntro ? desplazo.length() : desplazo.dot(adelante)) + marcha
      posAnterior.copy(carro.position)
      for (const r of ruedas) {
        // Se limita el giro por cuadro: muy rápido, el ojo lo ve al revés (efecto estroboscópico).
        // Con motor encendido las traseras giran solas (quemando llanta) aunque el carro no avance.
        const quema = r.trasera ? e.motor * 0.26 : 0
        // En Contacto las ruedas giran más lento que el avance para que se vean girar (la velocidad la dan viento y piso)
        const giroReal = (avance * (1 - 0.3 * e.carril)) / r.radio + quema
        r.grupo.rotateOnAxis(r.eje, THREE.MathUtils.clamp(giroReal, -0.45, 0.45))
        if (r.direccion) r.direccion.quaternion.setFromAxisAngle(r.vertical, direccionFinal)
      }

      // Humo: con motor encendido salen bocanadas de las ruedas traseras.
      if (e.motor > 0.3 && intro >= 1) {
        siguienteHumo -= dt
        while (siguienteHumo <= 0) {
          siguienteHumo += 0.045
          const traseras = ruedas.filter((r) => r.trasera)
          const libre = humo.find((h) => h.vida <= 0)
          if (!libre || !traseras.length) break
          const r = traseras[(Math.random() * traseras.length) | 0]
          r.grupo.getWorldPosition(posRueda)
          libre.sp.position.set(posRueda.x, 0.12, posRueda.z)
          libre.vel.set(-adelante.x * (0.6 + Math.random()), 0.35 + Math.random() * 0.4, -adelante.z * (0.6 + Math.random()))
          libre.vel.x += (Math.random() - 0.5) * 0.5
          libre.vel.z += (Math.random() - 0.5) * 0.5
          libre.dur = 1.4 + Math.random() * 0.9
          libre.vida = libre.dur
          libre.sp.visible = true
        }
      }
      for (const h of humo) {
        if (h.vida <= 0) continue
        h.vida -= dt
        const k = 1 - h.vida / h.dur // 0 → 1
        h.sp.position.addScaledVector(h.vel, dt)
        h.vel.multiplyScalar(1 - dt * 0.8)
        h.sp.scale.setScalar(0.3 + k * 1.8)
        h.sp.material.opacity = Math.sin(Math.PI * k) * 0.3 * e.motor
        if (h.vida <= 0) h.sp.visible = false
      }

      // Nebulosas: cruzan el horizonte detrás del carro, rápido, de izquierda a derecha.
      if (e.nebulosa > 0.01) {
        vistaFondo.subVectors(camMira0, camera.position).setY(0).normalize()
        vistaDer.set(-vistaFondo.z, 0, vistaFondo.x)
        for (const n of nebulosas) {
          n.x += n.vel * dt
          if (n.x > 75) n.x -= 150
          n.sp.position.copy(camera.position).addScaledVector(vistaFondo, n.prof).addScaledVector(vistaDer, n.x)
          n.sp.position.y = n.alto
          n.sp.material.opacity = e.nebulosa * 0.34 * THREE.MathUtils.smoothstep(75 - Math.abs(n.x), 0, 25)
          n.sp.visible = true
        }
      } else {
        for (const n of nebulosas) n.sp.visible = false
      }

      // Piso y viento van hacia atrás: ilusión de que el carro avanza sin moverse de lugar.
      const celda = 2
      rejilla.position.x = -((((adelante.x * recorrido) % celda) + celda) % celda)
      rejilla.position.z = -((((adelante.z * recorrido) % celda) + celda) % celda)
      matRayas.opacity = e.marcha * 0.55
      if (e.marcha > 0.01) {
        for (let i = 0; i < RAYAS; i++) {
          const ry = rayas[i]
          ry.z -= marcha * (2.2 + 4.6 * e.carril)
          if (ry.z < -30) ry.z += 60
          rayasPos.set([ry.x, ry.y, ry.z, ry.x, ry.y, ry.z + ry.l], i * 6)
        }
        geoRayas.attributes.position.needsUpdate = true
      }

      // Luces: se encienden al final de la intro; en Habilidades parpadean cada 2 s como intermitentes.
      const intermitente = (ahora % 2000) < 1000 ? 1 : 0.06
      const fase = ahora % 2500
      const destello = fase < 110 || (fase > 220 && fase < 330) ? 0.05 : 1
      const enc = (intro < 0.96 ? 0 : intro < 0.972 ? 1 : intro < 0.985 ? 0.15 : 1) * lerp(1, intermitente, e.parpadeo) * lerp(1, destello, e.destello)
      fijarLuces(luces.faros, e.faros * enc * (1 - e.motor * 0.45 * (0.5 + 0.5 * Math.sin(ahora / 230))))
      fijarLuces(luces.traseras, (0.5 + e.freno * 0.5) * enc)
      fijarLuces(luces.freno, e.freno * enc)
      fijarLuces(luces.reversa, e.reversa * enc)

      // Cámara alrededor del carro (se calcula con los parámetros ya suavizados: no atraviesa el carro).
      const az = THREE.MathUtils.degToRad(e.az) + (enIntro ? e.ry : rumbo) // en la intro la cámara queda fija
      const el = THREE.MathUtils.degToRad(e.el)
      base.set(destX, 0, destZ)
      const dist = e.dist * (movil ? 1.35 : 1) // en celular la pantalla es angosta: un poco más lejos para que entre el carro
      objetivoPos.set(
        base.x + Math.sin(az) * Math.cos(el) * dist,
        0.9 + Math.sin(el) * dist,
        base.z + Math.cos(az) * Math.cos(el) * dist,
      )
      // En celular el contenido ocupa todo el ancho: el carro se queda al centro.
      const sx = movil ? 0 : e.sx
      derecha.subVectors(base, objetivoPos).cross(THREE.Object3D.DEFAULT_UP).normalize()
      objetivoMira.copy(base).addScaledVector(derecha, sx)
      objetivoMira.y = 0.7 + e.sy + (movil ? 0.5 : 0)
      camera.position.copy(objetivoPos)
      camera.lookAt(objetivoMira)
      camMira0.copy(objetivoMira)
      primera = false

      // Portada: detrás del carro, mirando a la cámara, solo en el Inicio.
      if (portada) {
        atras.subVectors(base, objetivoPos).setY(0).normalize()
        portada.position.copy(base).addScaledVector(atras, 5).setY(3.2)
        portada.lookAt(objetivoPos.x, 3.2, objetivoPos.z)
        portada.material.opacity = THREE.MathUtils.clamp(1 - espacio.t * 1.5, 0, 1) * llegada
        portada.visible = portada.material.opacity > 0.01
      }

      // Polvo: sube lento, se mece y acompaña al carro
      polvo.position.set(destX, 0, destZ)
      for (let i = 0; i < POLVO; i++) {
        const y = polvoPos[i * 3 + 1] + polvoVel[i] * dt
        polvoPos[i * 3 + 1] = y > 4.5 ? 0 : y
        polvoPos[i * 3] += Math.sin(ahora * 0.0006 + i) * 0.002
      }
      geoPolvo.attributes.position.needsUpdate = true

      luzArriba.position.set(destX, 14, destZ + 2)
      luzArriba.target.position.set(destX, 0, destZ)
      estrellas.rotation.y += dt * 0.004

      composer.render()
      raf = requestAnimationFrame(cuadro)
    }
    raf = requestAnimationFrame(cuadro)

    const alCambiar = () => {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
    }
    window.addEventListener('resize', alCambiar)

    return () => {
      cancelado = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', alCambiar)
      composer.dispose()
      entorno.dispose()
      pmrem.dispose()
      renderer.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.() })
      })
      contenedor.removeChild(renderer.domElement)
    }
  }, [onProgreso, onListo, onError])

  return <div ref={ref} className="world3d" aria-hidden="true" />
}
