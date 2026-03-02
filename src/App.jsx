import React, { useState, useEffect } from "react"
import {
  Menu,
  X,
  ArrowRight,
  PlayCircle,
  Star,
  Brain,
  Heart,
  Mic,
  Check,
  Instagram,
  Twitter,
  Youtube,
  Clock,
  Video,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

// --- DATA & CONFIGURATION ---

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "CEO Tech Startup",
    result: "Negociar con confianza",
    text: "Con este método, no solo aprendí gramática, aprendí a pensar como una latina. La calma y estructura de las clases me dieron la seguridad que necesitaba.",
    stars: 5,
  },
  {
    name: "Marcus Thorne",
    role: "Escritor Freelance",
    result: "Superé mi miedo a hablar",
    text: "La 'Auditoría de Fluidez' fue reveladora. No sentí presión, sino un acompañamiento genuino para desbloquear mi español.",
    stars: 5,
  },
  {
    name: "Elena Rossi",
    role: "Arquitecta",
    result: "Feedback preciso",
    text: "Lo que más valoro es la corrección detallada pero amable. Siento que crezco en cada sesión sin el estrés de las academias tradicionales.",
    stars: 5,
  },
]

// Updated to match the new "Planes" section while keeping the ID structure for modal
const SERVICES = [
  {
    id: "trial",
    title: "Auditoría de Fluidez",
    price: 0, // "Demo Gratis" usually implies free, or we can keep it low price. Design says "Demo Gratis". Let's make it 0 or keep original 19? Design says "Demo Gratis". I'll set to 0.
    value: 50,
    description: "Un diagnóstico tranquilo y profundo de tu nivel actual.",
    features: ["Diagnóstico de Nivel", "Roadmap Personalizado"],
    hidden: true, // Helper to not show in the main pricing grid
  },
  {
    id: "basic",
    title: "Básico",
    subtitle: "Para curiosos",
    price: 29,
    period: "/mes",
    features: ["Acceso a lecciones", "Ejercicios PDF", "Comunidad Discord"],
    cardBg: "bg-white",
    btnStyle: "border-2 border-black hover:bg-gray-100",
  },
  {
    id: "pro",
    title: "Pro",
    subtitle: "Inmersión Total",
    price: 59,
    period: "/mes",
    features: ["Todo lo del plan Básico", "2 Sesiones en vivo/semana", "Certificado final", "Corrección de tareas"],
    popular: true,
    cardBg: "bg-secondary text-white",
    btnStyle: "bg-primary text-black border-2 border-black hover:bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-none",
    iconColor: "text-primary",
  },
  {
    id: "mentorship",
    title: "Mentoría",
    subtitle: "Personalizado 1 a 1",
    price: 99,
    period: "/mes",
    features: ["Todo lo del plan PRO", "1 Sesión individual/semana", "Plan de estudio a medida", "Whatsapp directo"],
    cardBg: "bg-white",
    btnStyle: "border-2 border-black hover:bg-gray-100",
  },
]

// --- COMPONENTS ---

const Header = ({ onBook }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-secondary/95 backdrop-blur-md shadow-soft py-3" : "bg-secondary py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center text-white">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group relative z-50">
          <img 
             src="/español.png" 
             alt="Español Con Sentido Logo" 
             className="h-10 md:h-12 w-auto object-contain transition-transform hover:scale-105 filter brightness-0 invert"
          />
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-grotesk text-sm font-medium tracking-wide">
          <a href="#sobre-mi" className="hover:text-primary transition-colors">Sobre mi</a>
          <a href="#clases" className="hover:text-primary transition-colors">Clases</a>
          <a href="#planes" className="hover:text-primary transition-colors">Precios</a>
          <a href="#politicas" className="hover:text-primary transition-colors">Políticas</a>
          <button 
            onClick={() => onBook("trial")} 
            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-orange-500 transition-all font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5"
          >
            Reserva tu clase
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-white hover:text-primary transition-colors"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-secondary border-t border-white/10 p-6 flex flex-col gap-6 z-40 shadow-xl md:hidden animate-fadeIn text-center">
          <a href="#sobre-mi" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">Sobre mi</a>
          <a href="#clases" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">Clases</a>
          <a href="#planes" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">Precios</a>
          <a href="#politicas" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">Políticas</a>
          <button
             onClick={() => {
                onBook("trial")
                setIsMenuOpen(false)
             }}
             className="bg-primary text-white w-full py-4 rounded-lg font-bold text-lg shadow-soft"
          >
            Reserva tu clase
          </button>
        </div>
      )}
    </nav>
  )
}

const Hero = ({ onBook }) => (
  <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden bg-light">
    {/* Background Curve (Top part Navy, Bottom part Light) */}
    <div className="absolute top-0 left-0 w-full h-[65%] md:h-[75%] bg-secondary z-0 rounded-b-[40px] md:rounded-b-[80px]"></div>

    <div className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
      {/* Left text content */}
      <div className="space-y-8 lg:pr-10 text-center lg:text-left">
        <h1 className="text-5xl md:text-7xl leading-[1.1] text-white">
          <span className="block font-serif font-medium tracking-tight mb-2 text-6xl md:text-8xl">Español</span>
          <span className="block text-primary font-serif italic text-4xl md:text-5xl my-2 opacity-90">con</span>
          <span className="block text-primary font-serif font-bold tracking-tight text-6xl md:text-8xl">Sentido</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-200 max-w-lg mx-auto lg:mx-0 font-grotesk font-light">
          Gana confianza para hablar español en conversaciones reales. Acompañamiento personalizado para que te expreses con seguridad.
        </p>

        <div className="pt-4 flex justify-center lg:justify-start">
          <button
            onClick={() => onBook("trial")}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-soft-lg hover:bg-orange-500 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            Reserva tu clase de prueba
          </button>
        </div>
      </div>

      {/* Right Video content */}
      <div className="relative group mx-auto w-full max-w-[600px] mt-8 lg:mt-0">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Video preview"
            className="w-full h-auto object-cover aspect-video"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all cursor-pointer">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-soft-lg hover:scale-110 transition-transform">
              <PlayCircle className="w-10 h-10 ml-1" />
            </div>
          </div>
          {/* Fake Video Controls */}
          <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
             <div className="w-1/3 h-full bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </header>
)

const PhotosGallery = () => (
  <section className="py-12 bg-light overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80" alt="Students" className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-soft hover:scale-[1.02] transition-transform" />
        <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80" alt="Conversation" className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-soft hover:scale-[1.02] transition-transform" />
        <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80" alt="Culture" className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-soft hover:scale-[1.02] transition-transform" />
        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80" alt="Learning" className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-soft hover:scale-[1.02] transition-transform" />
      </div>
    </div>
  </section>
)

const AcercaDeMi = () => (
  <section id="sobre-mi" className="py-24 px-6 bg-white font-grotesk">
    <div className="container mx-auto max-w-6xl">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 relative">
          <div className="absolute inset-0 bg-primary/10 rounded-3xl translate-x-4 translate-y-4"></div>
          <img 
            src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=800&q=80" 
            alt="Juanita Sánchez" 
            className="relative z-10 w-full h-auto rounded-3xl shadow-soft-lg object-cover aspect-[4/5]"
          />
        </div>
        <div className="order-1 md:order-2 space-y-6">
          <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-8">
            Acerca de mí
          </h2>
          <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
            <p><strong>Hola, soy Juanita Sánchez, creadora de Español conSentido.</strong></p>
            <p>
              Soy licenciada en Educación y bachiller en Administración de Empresas, con amplia experiencia en el mundo corporativo y educativo, especialmente en áreas como operaciones, logística y gestión de personas. Esta combinación me permite unir lo mejor de ambos campos: la pedagogía y la comunicación efectiva con una visión práctica del entorno profesional.
            </p>
            <p>
              Trabajo con estudiantes que ya comprenden español y quieren organizar mejor sus ideas y ganar claridad al expresarse. Integro los aspectos del idioma de manera natural dentro de conversaciones reales para que puedas comunicarte con seguridad en situaciones cotidianas, profesionales o de viaje.
            </p>
            <p>
              Acompaño a mis estudiantes tanto en español para el trabajo como en conversación cotidiana. Si te interesa viajar o conocer Perú y Latinoamérica, también podemos conversar sobre cultura, costumbres y expresiones locales para que te sientas preparado al comunicarte de forma natural cuando decidas visitarnos.
            </p>
            <p>
              Mis clases son conversacionales y personalizadas. Adapto cada sesión a tus intereses y objetivos para ayudarte a desarrollar un español auténtico y ganar confianza al hablar. Creo un ambiente ameno donde avanzarás a tu propio ritmo y, sin darte cuenta, te sentirás cada vez más seguro al expresarte.
            </p>
            <p className="bg-light p-6 rounded-2xl italic text-gray-600 border border-gray-100 shadow-sm mt-6">
              "Y para que me conozcas un poco más: disfruto bailar salsa, hacer ejercicio, viajar y conocer nuevas personas. Me encantan los perros y también me interesan los temas relacionados con la filosofía, la psicología y la antropología, porque creo que los idiomas se aprenden mejor a través de conversaciones que exploran ideas, cultura y experiencias humanas."
            </p>
            <p className="font-medium text-secondary mt-6">
              Te invito a reservar una clase de prueba para conocernos y planear juntos tu camino en el español. Estaré encantada de acompañarte en este proceso.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
)

const ComoSonLasClases = () => (
  <section id="clases" className="py-24 px-6 bg-light font-grotesk">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-6">
          Cómo son las clases
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Mis clases son espacios vivos de conversación, donde el español se convierte en una herramienta para explorar ideas, experiencias y situaciones reales.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Mic size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">Participación Activa</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Desde el inicio te invito a participar activamente. Comenzamos con una frase disparadora que despierta tu opinión y, a través de preguntas estratégicas, la conversación va creciendo de forma natural. Te encuentras argumentando y reflexionando.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Video size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">Role Plays Reales</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Recreamos situaciones reales: pedir algo en un restaurante, resolver un imprevisto o iniciar una conversación. Practicamos en un entorno seguro, donde equivocarse es parte del aprendizaje para desenvolverte en viajes o la vida cotidiana.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Brain size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">Conexión y Reflexión</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Partimos de un cortometraje, una historia o un tema de interés para generar reflexiones profundas y conectar el idioma con tus vivencias. Un espacio vibrante de confianza donde compartir ideas sin juicios.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Heart size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">Guía Natural</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Mientras conversamos, te acompaño con sugerencias naturales y reformulaciones sutiles para que tu español suene cada vez más fluido, sin romper el ritmo de la charla. Sentirás el español como un medio auténtico para comunicarte.
          </p>
        </div>
      </div>
    </div>
  </section>
)

const Marquee = () => (
  <div className="bg-secondary border-y-2 border-black py-4 overflow-hidden transform -rotate-1 origin-left scale-[1.02]">
    <div className="whitespace-nowrap animate-marquee flex items-center">
      <div className="flex gap-8 px-4">
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="text-4xl font-syne font-bold text-white uppercase">
              Comunicación •
            </span>
            <span className="text-4xl font-syne font-bold text-outline-white uppercase">
              Cultura •
            </span>
            <span className="text-4xl font-syne font-bold text-primary uppercase">
              Conexión •
            </span>
            <span className="text-4xl font-syne font-bold text-outline-white uppercase">
              Pensamiento •
            </span>
            <span className="text-4xl font-syne font-bold text-white uppercase">
              Sentimiento •
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
)

const Philosophy = () => (
  <section id="filosofia" className="py-24 px-6 bg-white font-grotesk">
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-4">
            Nuestra <span className="text-primary italic">Filosofía</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-md">
            No memorices. Entiende la estructura profunda y siente el ritmo del idioma.
          </p>
        </div>
        <ArrowRight className="hidden md:block w-12 h-12 text-secondary/30 rotate-90" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-50 p-8 rounded-3xl transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-secondary">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl text-secondary mb-4">Pensamiento Crítico</h3>
          <p className="text-gray-600">
            Cuestiona y comprende. No repitas como loro, analiza por qué se dice así.
          </p>
        </div>
        
        <div className="bg-primary text-white p-8 rounded-3xl shadow-soft-lg transition-all duration-300 transform md:-translate-y-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 text-white">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl mb-4">Conexión Emocional</h3>
          <p className="text-white/90">
            El idioma es un vehículo para emociones. Si no sientes lo que dices, no comunicas.
          </p>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-3xl transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-secondary">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl text-secondary mb-4">Comunicación Real</h3>
          <p className="text-gray-600">
            Slang, muletillas, interrupciones. Prepárate para la calle, no para el examen.
          </p>
        </div>
      </div>
    </div>
  </section>
)

const Pricing = ({ onBook }) => (
  <section id="planes" className="py-24 px-6 bg-light relative font-grotesk">
    <div className="container mx-auto max-w-6xl relative z-10">
      <div className="text-center mb-16">
        <span className="inline-block bg-orange-100 text-primary px-4 py-1 rounded-full font-bold text-sm tracking-widest uppercase mb-4">
          Inversión
        </span>
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary">
          Elige tu <span className="text-primary italic">Camino</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {SERVICES.filter((s) => !s.hidden).map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl flex flex-col transition-all duration-300 ${
              plan.popular 
                ? "bg-secondary text-white shadow-xl transform md:-translate-y-4 md:scale-105 z-10 border border-secondary/20" 
                : "bg-white text-secondary shadow-soft border border-gray-100 hover:shadow-soft-lg"
            } relative`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full font-bold text-xs uppercase tracking-wide shadow-md">
                Más Popular
              </div>
            )}

            <div className={`p-8 pb-6 border-b ${plan.popular ? "border-white/10" : "border-gray-100"}`}>
              <h3 className={`font-syne font-bold text-2xl ${plan.popular ? "text-primary" : "text-secondary"}`}>
                {plan.title}
              </h3>
              <p className={`font-medium text-sm mt-1 ${plan.popular ? "text-gray-300" : "text-gray-500"}`}>
                {plan.subtitle}
              </p>
            </div>

            <div className={`p-8 flex-grow`}>
              <div className="flex items-baseline mb-8">
                <span className="font-grotesk font-bold text-5xl md:text-6xl">
                    €{plan.price}
                </span>
                <span className={`${plan.popular ? "text-gray-400" : "text-gray-500"} ml-2 font-medium`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-4 text-sm font-medium">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    {plan.popular ? (
                        <Star className="w-5 h-5 text-primary shrink-0" fill="currentColor" />
                    ) : (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                    <span className={plan.popular ? "text-gray-200" : "text-gray-600"}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => onBook(plan.id)}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-orange-500 shadow-soft hover:shadow-md hover:-translate-y-0.5"
                    : "bg-gray-50 text-secondary hover:bg-secondary hover:text-white"
                }`}
              >
                {plan.popular ? "Empezar Ahora" : "Seleccionar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const Testimonials = () => (
  <section id="testimonios" className="py-24 px-6 bg-white">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-4">
          Voces <span className="text-primary italic">Reales</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-8 rounded-3xl hover:-translate-y-1 transition-transform border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-6">
              {[...Array(t.stars)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" className="text-primary" />
              ))}
            </div>
            <h4 className="font-syne font-bold text-xl text-secondary mb-4">"{t.result}"</h4>
            <p className="text-gray-600 mb-8 font-grotesk leading-relaxed">
              {t.text}
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-lg">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-secondary text-sm">{t.name}</p>
                <p className="text-xs text-gray-500 font-medium">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="bg-secondary text-white relative overflow-hidden font-grotesk">
    <div className="container mx-auto max-w-6xl px-6 py-16 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start md:mb-12 gap-8 text-center md:text-left">
        <div>
          <h2 className="font-syne font-bold text-3xl md:text-4xl text-white">
            Español <span className="text-primary italic font-serif">con</span> Sentido
          </h2>
          <p className="text-gray-400 mt-2 font-light">Comunicar, pensar y sentir.</p>
        </div>

        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <Instagram size={20} />
          </a>
          <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <Twitter size={20} />
          </a>
          <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <Youtube size={20} />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <p>© 2026 Español Con Sentido. Todos los derechos reservados.</p>
        <div className="flex gap-6 mt-4 md:mt-0 font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Términos</a>
        </div>
      </div>
    </div>
  </footer>
)

// --- BOOKING SYSTEM ---
// Kept largely intact logic-wise, just styled to match brutalism (borders, fonts)
const BookingModal = ({ isOpen, onClose, initialServiceId }) => {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [service, setService] = useState(
    SERVICES.find((s) => s.id === initialServiceId) || SERVICES[0]
  )

  useEffect(() => {
    if (isOpen && initialServiceId) {
      setService(SERVICES.find((s) => s.id === initialServiceId) || SERVICES[0])
      setStep(1)
      setSelectedDate(null)
      setSelectedTime(null)
    }
  }, [isOpen, initialServiceId])

  const timeSlots = ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"]
  const nextDays = React.useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return {
      day: d.toLocaleDateString("es-ES", { weekday: "short" }),
      date: d.getDate(),
      fullDate: d,
      id: d.toISOString().split('T')[0]
    }
  }), [])

  const handleDateSelect = (date, time) => {
    if (date) setSelectedDate(date)
    if (time) setSelectedTime(time)
  }

  if (!isOpen) return null

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    setTimeout(() => setStep(4), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-4 overflow-y-auto font-grotesk">
      <div className="bg-white w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-3xl shadow-2xl relative">
        {/* Header */}
        <div className="bg-white text-secondary p-6 flex justify-between items-center shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="font-syne font-bold text-2xl">{service.title}</h3>
            {service.price > 0 && 
                <span className="bg-orange-50 text-primary border border-primary/30 rounded-full text-xs font-bold px-3 py-1 uppercase tracking-wide">
                €{service.price}
                </span>
            }
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-orange-50 rounded-full p-2">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto bg-white">
          {/* Progress Bar */}
          {step < 4 && (
            <div className="flex items-center justify-center mb-10 text-xs font-bold uppercase tracking-widest">
              <div
                className={`flex items-center gap-2 ${
                  step >= 1 ? "text-primary" : "text-gray-300"
                }`}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                  1
                </span>{" "}
                Horario
              </div>
              <div className="w-12 h-0.5 bg-gray-200 mx-4"></div>
              <div
                className={`flex items-center gap-2 ${
                  step >= 2 ? "text-primary" : "text-gray-300"
                }`}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                  2
                </span>{" "}
                Datos
              </div>
              <div className="w-12 h-0.5 bg-gray-200 mx-4"></div>
              <div
                className={`flex items-center gap-2 ${
                  step >= 3 ? "text-primary" : "text-gray-300"
                }`}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                  3
                </span>{" "}
                Pago
              </div>
            </div>
          )}

          {/* STEP 1: CALENDAR */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h4 className="text-2xl font-syne font-bold text-secondary mb-6">
                Selecciona tu momento
              </h4>

              <div className="grid grid-cols-5 gap-3 mb-8">
                {nextDays.map((d, i) => (
                  <div key={i} className="text-center group cursor-pointer" onClick={() => handleDateSelect(d, null)}>
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                      {d.day}
                    </div>
                    <div
                      className={`py-3 font-bold text-lg border-2 transition rounded-xl ${
                        selectedDate?.id === d.id
                          ? "bg-primary border-primary text-white shadow-soft-sm"
                          : "bg-white border-gray-200 text-secondary hover:border-primary/50"
                      }`}
                    >
                      {d.date}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleDateSelect(null, time)}
                    className={`py-3 border-2 text-sm font-bold transition rounded-xl ${
                      selectedTime === time
                        ? "bg-primary border-primary text-white shadow-soft-sm"
                        : "bg-white border-gray-200 text-secondary hover:border-primary/50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(2)}
                  className="bg-secondary text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary/90 transition-all shadow-soft"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS (Cuestionario) */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <h4 className="text-2xl font-syne font-bold text-secondary mb-2">
                Antes de nuestra clase...
              </h4>
              <p className="text-gray-500 mb-8">Me gustaría conocerte un poco mejor para adaptar la sesión a ti.</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">Nombre Completo</label>
                    <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder="Ej. María García" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">Email</label>
                    <input type="email" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder="tu@email.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">¿Qué te gustaría lograr con el español en este momento?</label>
                  <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                    <option value="">Selecciona una opción</option>
                    <option>Viajes</option>
                    <option>Trabajo</option>
                    <option>Conversación cotidiana</option>
                    <option>Conocer la cultura</option>
                    <option>Crecimiento personal</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">¿Cómo describirías tu experiencia con el español?</label>
                  <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                    <option value="">Selecciona una opción</option>
                    <option>Puedo mantener conversaciones básicas</option>
                    <option>Puedo conversar con fluidez</option>
                    <option>Lo entiendo bien pero quiero expresarme mejor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">¿En qué situaciones te gustaría sentirte más cómodo/a hablando español?</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder="Ej. reuniones de trabajo, viajes, etc." />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">¿Qué temas disfrutas conversar?</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder="Ej. hobbies, cultura, actualidad, etc." />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">¿Hay algo que te gustaría que supiera antes de nuestra clase? <span className="text-gray-400 font-normal">(Opcional)</span></label>
                  <textarea rows="2" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder="Escribe aquí..."></textarea>
                </div>
              </div>

              <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 font-bold hover:text-secondary transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
                >
                  Continuar al pago
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT (PAYPAL) */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="bg-orange-50 border-2 border-black p-5 mb-8 flex items-start gap-4">
                <AlertCircle
                  className="text-primary shrink-0 mt-0.5"
                  size={20}
                />
                <div className="text-sm">
                  <p className="font-bold text-black mb-1 uppercase">
                    Confirmación requerida
                  </p>
                  <p className="text-gray-600">
                    Para asegurar tu espacio en la agenda, completaremos el
                    proceso con el pago seguro.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-black p-6 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-syne font-bold text-black text-lg uppercase">
                    {service.title}
                  </span>
                  <span className="font-bold text-black text-xl">
                    €{service.price}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {selectedDate?.fullDate?.toLocaleDateString()} — {selectedTime}
                  </span>
                </div>
                <div className="h-0.5 bg-black my-4"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-black uppercase">Total</span>
                  <span className="font-bold text-primary">
                    €{service.price}.00
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePaymentSubmit}
                  className="w-full bg-[#0070BA] text-white border-2 border-[#0070BA] py-4 font-bold text-lg hover:bg-white hover:text-[#0070BA] transition shadow-hard flex justify-center items-center gap-3"
                >
                  <span className="italic">Pagar con</span>
                  <span className="italic font-extrabold text-2xl">PayPal</span>
                </button>

                <p className="text-center text-xs text-gray-500 uppercase font-mono">
                  Plataforma de pago encriptada y segura.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full text-center mt-6 text-gray-500 text-sm font-bold uppercase hover:text-black hover:underline"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="animate-fadeIn text-center py-8">
              <div className="w-20 h-20 bg-primary border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 text-white">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-3xl font-syne font-bold text-black mb-4 uppercase">
                ¡Todo Listo!
              </h4>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Tu sesión ha sido confirmada. Te hemos enviado un correo con
                todos los detalles y el enlace de acceso.
              </p>

              <div className="bg-white p-6 rounded-none border-2 border-black shadow-hard-sm text-left space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 border-2 border-black bg-secondary flex items-center justify-center shrink-0">
                    <Video className="text-white" size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-black text-sm uppercase">
                      Google Meet
                    </h5>
                    <a
                      href="#"
                      className="text-primary font-bold text-sm hover:underline"
                    >
                      meet.google.com/abc-defg-hij
                    </a>
                  </div>
                </div>

                <div className="h-0.5 bg-gray-100"></div>

                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 border-2 border-black bg-secondary flex items-center justify-center shrink-0">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-black text-sm uppercase">
                      Política
                    </h5>
                    <p className="text-sm text-gray-500">
                      Reprogramación gratuita hasta 24h antes.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-8 bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black hover:bg-white hover:text-black hover:shadow-hard transition"
              >
                Volver al Inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  const handleBook = (id) => {
    setSelectedServiceId(id)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-grotesk selection:bg-primary selection:text-white">
      <Header onBook={handleBook} />
      <Hero onBook={handleBook} />
      <PhotosGallery />
      <AcercaDeMi />
      <ComoSonLasClases />
      <Marquee />
      <Philosophy />
      {/* Testimonials added to match request for functionality, styled brutalist */}
      <Pricing onBook={handleBook} />
      <Testimonials />
      <Footer />
      
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialServiceId={selectedServiceId} 
      />
    </div>
  )
}

export default App
