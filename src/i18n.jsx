import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as datosEs from './data/perfil.js'
import * as datosEn from './data/perfil.en.js'

// Textos fijos de la interfaz (los datos del perfil están en data/perfil.js y data/perfil.en.js).
const TEXTOS = {
  es: {
    'nav.inicio': 'Inicio', 'nav.sobre-mi': 'Sobre mí', 'nav.experiencia': 'Experiencia', 'nav.educacion': 'Educación',
    'nav.proyectos': 'Proyectos', 'nav.habilidades': 'Habilidades', 'nav.contacto': 'Contacto',
    'ui.bajar': 'Bajar a la siguiente sección', 'ui.sector': 'SECTOR', 'ui.idioma': 'Cambiar idioma',
    'sobre.tag': 'Sobre mí', 'sobre.titulo': 'Del soporte técnico al código',
    'exp.tag': 'Trayectoria', 'exp.titulo': 'Experiencia',
    'edu.tag': 'Formación', 'edu.titulo': 'Educación', 'edu.curso': 'En curso', 'edu.completo': 'Completado',
    'proy.tag': 'Portafolio', 'proy.titulo': 'Proyectos', 'proy.imagen': 'Imagen del proyecto', 'proy.captura': 'Captura de',
    'proy.codigo': 'Código', 'proy.sitio': 'Ver sitio',
    'hab.tag': 'Stack', 'hab.titulo': 'Habilidades', 'hab.aria': 'Habilidades técnicas',
    'con.tag': 'Contacto', 'con.titulo': '¿Trabajamos juntos?',
    'con.texto': 'Estoy buscando nuevas oportunidades como desarrollador. Escríbeme y te respondo lo antes posible.',
    'con.correo': 'Correo', 'con.perfil': 'Ver perfil',
    'form.titulo': 'Envíame un mensaje', 'form.nombre': 'Tu nombre', 'form.email': 'Tu correo',
    'form.mensaje': 'Cuéntame sobre el puesto o el proyecto…', 'form.enviar': 'Enviar mensaje', 'form.enviando': 'Enviando…',
    'form.okTitulo': '¡Mensaje enviado!', 'form.okTexto': 'Gracias por escribirme. Te responderé lo antes posible a tu correo.',
    'form.errTitulo': 'No se pudo enviar', 'form.errTexto': 'Revisa tu conexión o escríbeme directo a mi correo.',
    'form.cerrar': 'Cerrar', 'form.invalido': 'Escribe un correo válido y un mensaje.',
    'pie.fin': 'Fin de la transmisión_',
    'carga.titulo': 'Encendiendo motor', 'carga.listo': 'Listo para arrancar',
  },
  en: {
    'nav.inicio': 'Home', 'nav.sobre-mi': 'About', 'nav.experiencia': 'Experience', 'nav.educacion': 'Education',
    'nav.proyectos': 'Projects', 'nav.habilidades': 'Skills', 'nav.contacto': 'Contact',
    'ui.bajar': 'Scroll to the next section', 'ui.sector': 'SECTOR', 'ui.idioma': 'Change language',
    'sobre.tag': 'About me', 'sobre.titulo': 'From tech support to code',
    'exp.tag': 'Career', 'exp.titulo': 'Experience',
    'edu.tag': 'Background', 'edu.titulo': 'Education', 'edu.curso': 'In progress', 'edu.completo': 'Completed',
    'proy.tag': 'Portfolio', 'proy.titulo': 'Projects', 'proy.imagen': 'Project image', 'proy.captura': 'Screenshot of',
    'proy.codigo': 'Code', 'proy.sitio': 'Visit site',
    'hab.tag': 'Stack', 'hab.titulo': 'Skills', 'hab.aria': 'Technical skills',
    'con.tag': 'Contact', 'con.titulo': "Let's work together?",
    'con.texto': "I'm looking for new opportunities as a developer. Write to me and I'll get back to you as soon as possible.",
    'con.correo': 'Email', 'con.perfil': 'View profile',
    'form.titulo': 'Send me a message', 'form.nombre': 'Your name', 'form.email': 'Your email',
    'form.mensaje': 'Tell me about the role or the project…', 'form.enviar': 'Send message', 'form.enviando': 'Sending…',
    'form.okTitulo': 'Message sent!', 'form.okTexto': "Thanks for reaching out. I'll reply to your email as soon as possible.",
    'form.errTitulo': "Couldn't send it", 'form.errTexto': 'Check your connection or email me directly.',
    'form.cerrar': 'Close', 'form.invalido': 'Please enter a valid email and a message.',
    'pie.fin': 'End of transmission_',
    'carga.titulo': 'Starting engine', 'carga.listo': 'Ready to go',
  },
}

const IdiomaContext = createContext(null)

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    try {
      const guardado = localStorage.getItem('idioma')
      if (guardado === 'es' || guardado === 'en') return guardado
    } catch { /* sin localStorage */ }
    return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = idioma
    try { localStorage.setItem('idioma', idioma) } catch { /* sin localStorage */ }
  }, [idioma])

  const valor = useMemo(() => ({
    idioma,
    setIdioma,
    t: (clave) => TEXTOS[idioma][clave] ?? TEXTOS.es[clave] ?? clave,
    datos: idioma === 'en' ? datosEn : datosEs,
  }), [idioma])

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useIdioma = () => useContext(IdiomaContext)
