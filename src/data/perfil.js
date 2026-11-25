// =====================================================================
//  TODOS TUS DATOS ESTÁN AQUÍ. Edita este archivo para cambiar textos,
//  enlaces o proyectos. No hace falta tocar el resto del código.
// =====================================================================

export const perfil = {
  nombre: 'Juan Pedro Rodríguez Bacilio',
  nombreCorto: 'Juan Rodríguez',
  iniciales: 'JR',
  rol: 'Full Stack Developer',
  stackPrincipal: ['Java', 'Spring Boot', 'Angular'],
  ubicacion: 'Lima, Perú',
  disponible: true, // muestra la etiqueta "Disponible para trabajar"

  // FOTO: pon tu foto en  public/foto.jpg  (cuadrada, mín. 600x600).
  // Mientras no exista, se muestran las iniciales.
  foto: '/foto.jpg',

  // CV: copia tu PDF a  public/CV-Juan-Rodriguez.pdf  para que funcione el botón.
  cv: '/CV-Juan-Rodriguez.pdf',

  // Versión corta del resumen para celular
  alias: 'JuanRbCode', // aparece bajo el nombre en el Inicio
  // Versión corta del resumen para celular
  resumenCorto: 'Desarrollador Full Stack. Construyo sistemas web completos con Java, Spring Boot y Angular.',
  resumen:
    'Desarrollador Full Stack. Construyo sistemas web de punta a punta con Java, Spring Boot y Angular: ' +
    'interfaces rápidas y responsive, APIs REST sólidas y código ordenado que escala. ' +
    'Hoy desarrollo el ERP de Comunicación Futura.',
  sobreMi: [
    'Empecé en soporte técnico y Help Desk, y eso me dejó algo que uso todos los días: entender el problema real del usuario, explicarlo sin tecnicismos y resolverlo rápido.',
    'Hoy construyo interfaces en Angular que funcionan igual de bien en celular que en laptop, y APIs REST con Spring Boot. Me gusta ordenar el código: componentes reutilizables, estilos globales y cero duplicados.',
    'Aprendo constantemente y uso herramientas de IA para ser más productivo. Busco un equipo donde seguir creciendo y aportar desde el primer día.',
  ],
  datos: [
    { valor: '6+', texto: 'módulos de ERP rediseñados' },
    { valor: '3', texto: 'proyectos propios publicados' },
    { valor: 'Full', texto: 'Stack: frontend y backend' },
  ],

  contacto: {
    email: 'juanrbrodriguezxcontact@gmail.com',
    whatsapp: '51900879777', // solo números, con código de país
    whatsappTexto: '+51 900 879 777',
    linkedin: 'https://www.linkedin.com/in/TU-USUARIO', // <-- cambia por tu enlace
    github: 'https://github.com/JuanRbCode',
  },
}

export const experiencia = [
  {
    puesto: 'Desarrollador Full Stack',
    empresa: 'Comunicación Futura (Comfutura)',
    periodo: 'Jul 2026 – Actualidad',
    actual: true,
    logros: [
      'Rediseñé en Angular los módulos de Órdenes de Trabajo, Órdenes de Compra, Costo Directo, Finanzas, Almacén y Requerimientos del ERP de la empresa.',
      'Refactoricé el frontend de Recursos Humanos (personal, asistencia, aprobadores y contratos) y lo adapté a móviles y laptops.',
      'Estandaricé estilos globales y componentes reutilizables (modales, alertas, tablas, filtros y KPI) y retiré Bootstrap de varios módulos.',
      'Contribuí al backend en Spring Boot con servicios, DTO y endpoints REST de perfiles, trabajadores, clientes y temas.',
    ],
    tags: ['Angular', 'TypeScript', 'Spring Boot', 'MySQL', 'CSS'],
  },
  {
    puesto: 'Practicante de Desarrollo Web',
    empresa: 'Consultora de Tecnología e Innovación SAC',
    periodo: 'Nov 2024 – Ene 2025',
    logros: [
      'Entregué funcionalidades Full Stack para proyectos internos con Java + Spring Boot en el backend y Angular en el frontend.',
      'Integré frontend y backend consumiendo REST APIs, validadas con Postman e Insomnia.',
      'Resolví incidencias de código y gestioné el control de versiones del equipo con Git y GitHub.',
    ],
    tags: ['Java', 'Spring Boot', 'Angular', 'Git'],
  },
  {
    puesto: 'Soporte Técnico',
    empresa: 'BigData Corporation',
    periodo: 'Feb 2023 – Ago 2023',
    logros: [
      'Diagnostiqué y corregí fallas de hardware y software, reduciendo los tiempos de inactividad de los equipos.',
      'Atendí clientes como Technical Support y Help Desk; instalé y configuré sistemas operativos y software.',
      'Realicé mantenimiento preventivo y correctivo, reemplazo de componentes y armado de computadoras.',
    ],
    tags: ['Help Desk', 'Windows', 'Hardware'],
  },
]

// Para cada proyecto: deja el enlace en '' si no quieres mostrar ese botón.
export const proyectos = [
  {
    nombre: 'Zaynix',
    tipo: 'App de escritorio · Código abierto',
    descripcion:
      'Aplicación para Windows que descarga y convierte audio y video por lotes, con instalador y aviso de nuevas versiones. Incluye su sitio web en Angular y publicación automática con GitHub Actions.',
    tags: ['Python', 'Flet', 'FFmpeg', 'Angular', 'Node.js', 'GitHub Actions'],
    imagen: '', // <-- captura, ej. '/proyectos/zaynix.png' (guárdala en public/proyectos/)
    demo: '', // <-- enlace al sitio web
    codigo: '', // <-- enlace al repositorio
    color: 'violet',
  },
  {
    nombre: 'Argos',
    tipo: 'Plataforma full stack · Seguridad',
    descripcion:
      'Ecosistema para monitorear y ejecutar comandos remotos sobre equipos perdidos o robados en tiempo real: panel web en React, autenticación JWT con MySQL, servidor de alta disponibilidad y app Android.',
    tags: ['React', 'JavaScript', 'MySQL', 'JWT', 'Android'],
    imagen: '',
    demo: '',
    codigo: '',
    color: 'blue',
  },
  {
    nombre: 'Survey Flow',
    tipo: 'Automatización web · Visión artificial',
    descripcion:
      'Plataforma que extrae enlaces de imágenes QR con OpenCV y ejecuta flujos de navegador automatizados con Playwright, expuesta con una API en FastAPI y un frontend en Angular.',
    tags: ['Angular', 'TypeScript', 'Python', 'FastAPI', 'OpenCV', 'Playwright'],
    imagen: '',
    demo: '',
    codigo: '',
    color: 'cyan',
  },
  {
    nombre: 'ERP Comfutura',
    tipo: 'Proyecto laboral · Sistema de gestión',
    descripcion:
      'Sistema de gestión empresarial con módulos de órdenes de trabajo, compras, costos, finanzas, almacén y RRHH. Diseñé su sistema de estilos globales, componentes reutilizables y vistas responsive.',
    tags: ['Angular', 'Spring Boot', 'MySQL', 'CSS puro'],
    imagen: '',
    demo: '',
    codigo: '', // privado
    color: 'pink',
  },
]

export const habilidades = [
  { grupo: 'Frontend', items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'RxJS', 'HTML5', 'CSS3', 'Tailwind CSS'] },
  { grupo: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI'] },
  { grupo: 'Bases de datos', items: ['MySQL', 'SQL Server'] },
  { grupo: 'Herramientas', items: ['Git', 'GitHub', 'GitHub Actions', 'Railway', 'Postman', 'Insomnia', 'Windows'] },
]

export const educacion = [
  {
    titulo: 'Ingeniería de Sistemas',
    lugar: 'Universidad Peruana de Ciencias Aplicadas (UPC)',
    periodo: 'En curso',
    enCurso: true,
  },
  {
    titulo: 'Bachiller Técnico en Computación e Informática',
    lugar: 'CIBERTEC',
    periodo: '2022 – 2024 · Grado otorgado en marzo de 2026',
  },
]
