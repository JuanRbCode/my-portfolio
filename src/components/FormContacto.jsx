import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

/*
 * Botón "Enviar mensaje" que abre un modal con el formulario.
 * El envío es real, con FormSubmit (https://formsubmit.co), sin cuenta ni servidor:
 *  - llega a `destino` y con copia (cc) a `copia`.
 *  - La PRIMERA vez que se use, FormSubmit manda un correo a `destino` para ACTIVAR el formulario:
 *    haz clic en "Activate Form" una sola vez y desde ahí llegan todos los mensajes.
 */
export default function FormContacto({ destino, copia, t }) {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState('libre') // libre | enviando | ok | error
  const [aviso, setAviso] = useState('')

  // Escape cierra el modal y bloquea el scroll de la página mientras está abierto
  useEffect(() => {
    if (!abierto && estado === 'libre') return undefined
    const tecla = (e) => { if (e.key === 'Escape') { setAbierto(false); setEstado('libre') } }
    window.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = '' }
  }, [abierto, estado])

  const enviar = async (ev) => {
    ev.preventDefault()
    const formulario = ev.currentTarget
    const f = new FormData(formulario)
    if (f.get('_honey')) return // bot
    const email = String(f.get('email') || '').trim()
    const mensaje = String(f.get('mensaje') || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mensaje.length < 3) {
      setAviso('form.invalido')
      return
    }
    setAviso('')
    setEstado('enviando')
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${destino}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nombre: String(f.get('nombre') || '').trim() || '(sin nombre)',
          email,
          mensaje,
          _subject: 'Nuevo mensaje desde tu portafolio',
          _cc: copia || undefined,
          _replyto: email,
          _template: 'table',
          _captcha: 'false',
        }),
      })
      const datos = await r.json().catch(() => ({}))
      if (!r.ok || String(datos.success) === 'false') throw new Error(datos.message || 'error')
      formulario.reset()
      setAbierto(false)
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  const cerrarTodo = () => { setAbierto(false); setEstado('libre') }

  return (
    <>
      <button type="button" className="btn btn-primary contacto-cta" onClick={() => setAbierto(true)}>
        <Icon name="send" size={18} /> {t('form.abrir')}
      </button>

      {abierto && (
        <div className="alerta-fondo" role="dialog" aria-modal="true" aria-label={t('form.titulo')}>
          <form className="form-modal panel" onSubmit={enviar} noValidate>
            <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
            <button type="button" className="form-cerrar" onClick={() => setAbierto(false)} aria-label={t('form.cerrar')}>
              <Icon name="close" size={18} />
            </button>
            <span className="scene-tag"><b>//</b> {t('form.etiqueta')}</span>
            <h3 className="form-titulo">{t('form.titulo')}</h3>
            <p className="form-sub">{t('form.sub')}</p>
            <input type="text" name="_honey" className="form-trampa" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="form-fila">
              <input name="nombre" type="text" placeholder={t('form.nombre')} autoComplete="name" maxLength={80} />
              <input name="email" type="email" placeholder={t('form.email')} autoComplete="email" required maxLength={120} />
            </div>
            <textarea name="mensaje" placeholder={t('form.mensaje')} rows={5} required maxLength={3000} autoFocus />
            {aviso && <p className="form-aviso">{t(aviso)}</p>}
            <button type="submit" className="btn btn-primary form-enviar" disabled={estado === 'enviando'}>
              <Icon name="send" size={17} /> {estado === 'enviando' ? t('form.enviando') : t('form.enviar')}
            </button>
          </form>
        </div>
      )}

      {(estado === 'ok' || estado === 'error') && (
        <div className="alerta-fondo" role="dialog" aria-modal="true" onClick={cerrarTodo}>
          <div className={`alerta panel ${estado === 'ok' ? 'is-ok' : 'is-error'}`} onClick={(e) => e.stopPropagation()}>
            <span className="corner" /><span className="corner" /><span className="corner" /><span className="corner" />
            <span className="alerta-icono"><Icon name={estado === 'ok' ? 'check' : 'close'} size={30} /></span>
            <h3 className="glitch" data-text={estado === 'ok' ? t('form.okTitulo') : t('form.errTitulo')}>
              {estado === 'ok' ? t('form.okTitulo') : t('form.errTitulo')}
            </h3>
            <p>{estado === 'ok' ? t('form.okTexto') : t('form.errTexto')}</p>
            <button type="button" className="btn btn-primary" onClick={() => (estado === 'error' ? (setEstado('libre'), setAbierto(true)) : cerrarTodo())}>
              {estado === 'error' ? t('form.reintentar') : t('form.cerrar')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
