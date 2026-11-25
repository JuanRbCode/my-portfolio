// =====================================================================
//  VERSIÓN EN INGLÉS de los datos. Solo cambian los textos: enlaces,
//  fotos y contacto se toman de perfil.js (no hace falta repetirlos).
// =====================================================================
import * as es from './perfil.js'

export const perfil = {
  ...es.perfil,
  rol: 'Full Stack Developer',
  ubicacion: 'Lima, Peru',
  resumenCorto: 'Full Stack Developer. I build complete web systems with Java, Spring Boot and Angular.',
  resumen:
    'Full Stack Developer. I build end-to-end web systems with Java, Spring Boot and Angular: ' +
    'fast, responsive interfaces, solid REST APIs and clean code that scales. ' +
    "Currently building Comunicación Futura's ERP.",
  sobreMi: [
    'I started in technical support and help desk, and it left me something I use every day: understanding the real problem behind a request, explaining it without jargon and solving it fast.',
    'Today I build Angular interfaces that work just as well on a phone as on a laptop, and REST APIs with Spring Boot. I like organized code: reusable components, global styles and zero duplication.',
    'I keep learning all the time and use AI tools to be more productive. I am looking for a team where I can keep growing and contribute from day one.',
  ],
  datos: [
    { valor: '6+', texto: 'ERP modules redesigned' },
    { valor: '3', texto: 'personal projects published' },
    { valor: 'Full', texto: 'Stack: frontend and backend' },
  ],
}

export const experiencia = [
  {
    ...es.experiencia[0],
    puesto: 'Full Stack Developer',
    periodo: 'Jul 2026 – Present',
    logros: [
      "Redesigned in Angular the Work Orders, Purchase Orders, Direct Cost, Finance, Warehouse and Requests modules of the company's ERP.",
      'Refactored the Human Resources frontend (staff, attendance, approvers and contracts) and made it work on phones and laptops.',
      'Standardized global styles and reusable components (modals, alerts, tables, filters and KPIs) and removed Bootstrap from several modules.',
      'Contributed to the Spring Boot backend with services, DTOs and REST endpoints for profiles, employees, clients and themes.',
    ],
  },
  {
    ...es.experiencia[1],
    puesto: 'Web Development Intern',
    periodo: 'Nov 2024 – Jan 2025',
    logros: [
      'Delivered full stack features for internal projects with Java + Spring Boot on the backend and Angular on the frontend.',
      'Connected frontend and backend through REST APIs, tested with Postman and Insomnia.',
      "Fixed code issues and managed the team's version control with Git and GitHub.",
    ],
  },
  {
    ...es.experiencia[2],
    puesto: 'IT Support',
    periodo: 'Feb 2023 – Aug 2023',
    logros: [
      'Diagnosed and fixed hardware and software failures, reducing equipment downtime.',
      'Assisted clients as Technical Support and Help Desk; installed and configured operating systems and software.',
      'Performed preventive and corrective maintenance, component replacement and PC assembly.',
    ],
  },
]

export const proyectos = [
  {
    ...es.proyectos[0],
    tipo: 'Desktop app · Open source',
    descripcion:
      'Windows app that downloads and batch-converts audio and video, with an installer and update notifications. Includes its own Angular website and automated releases with GitHub Actions.',
  },
  {
    ...es.proyectos[1],
    tipo: 'Full stack platform · Security',
    descripcion:
      'Real-time ecosystem to track and run remote commands on lost or stolen devices: React web dashboard, JWT authentication with MySQL, high-availability server and an Android app.',
  },
  {
    ...es.proyectos[2],
    tipo: 'Web automation · Computer vision',
    descripcion:
      'Platform that extracts links from QR images with OpenCV and runs automated browser flows with Playwright, exposed through a FastAPI API and an Angular frontend.',
  },
  {
    ...es.proyectos[3],
    tipo: 'Work project · Management system',
    descripcion:
      'Enterprise management system with work orders, purchasing, costs, finance, warehouse and HR modules. I designed its global style system, reusable components and responsive views.',
    tags: ['Angular', 'Spring Boot', 'MySQL', 'Pure CSS'],
  },
]

export const habilidades = [
  { ...es.habilidades[0] },
  { ...es.habilidades[1] },
  { ...es.habilidades[2], grupo: 'Databases' },
  { ...es.habilidades[3], grupo: 'Tools' },
]

export const educacion = [
  { ...es.educacion[0], titulo: 'Systems Engineering', lugar: 'Universidad Peruana de Ciencias Aplicadas (UPC)', periodo: 'In progress' },
  { ...es.educacion[1], titulo: 'Technical Degree in Computing and IT', periodo: '2022 – 2024 · Degree awarded in March 2026' },
]
