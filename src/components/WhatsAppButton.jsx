const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER
const DEFAULT_MESSAGE = 'Hola! Quisiera más información sobre las clases de español 🙂'

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.31.652 4.47 1.78 6.31L4 29l7.86-1.75A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.7a9.63 9.63 0 0 1-4.93-1.35l-.354-.21-4.664 1.04 1.06-4.53-.232-.37A9.66 9.66 0 0 1 5.3 15c0-5.906 4.8-10.7 10.704-10.7 5.905 0 10.7 4.794 10.7 10.7 0 5.906-4.795 10.7-10.7 10.7Zm5.86-8.01c-.32-.16-1.9-.94-2.194-1.047-.294-.107-.508-.16-.722.16-.213.32-.828 1.047-1.016 1.26-.187.214-.373.24-.693.08-.32-.16-1.352-.498-2.575-1.588-.952-.85-1.595-1.9-1.782-2.22-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.722-1.74-.99-2.383-.26-.626-.526-.54-.722-.55l-.615-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.666 0 1.573 1.147 3.092 1.307 3.306.16.213 2.257 3.446 5.468 4.833.764.33 1.36.527 1.826.674.767.244 1.465.21 2.017.127.615-.092 1.9-.777 2.168-1.527.267-.75.267-1.393.187-1.527-.08-.133-.293-.213-.613-.373Z" />
    </svg>
  )
}

export default function WhatsAppButton() {
  if (!WHATSAPP_NUMBER) return null

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed z-30 bottom-5 right-5 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-soft-lg flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-300 animate-fadeIn"
    >
      <WhatsAppIcon className="w-7 h-7 md:w-8 md:h-8" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
    </a>
  )
}
