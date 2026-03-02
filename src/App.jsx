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

import { useLanguage } from "./context/LanguageContext"

// --- COMPONENTS ---

const Header = ({ onBook }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { t, language, toggleLanguage } = useLanguage()

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
          <a href="#sobre-mi" className="hover:text-primary transition-colors">{t('nav.about')}</a>
          <a href="#clases" className="hover:text-primary transition-colors">{t('nav.classes')}</a>
          <a href="#planes" className="hover:text-primary transition-colors">{t('nav.pricing')}</a>
          <a href="#politicas" className="hover:text-primary transition-colors">{t('nav.policies')}</a>
          <button 
            onClick={() => onBook("trial")} 
            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-orange-500 transition-all font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5"
          >
            {t('nav.book')}
          </button>
          
          {/* Language Switcher */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => toggleLanguage('es')}
              className={`p-1.5 rounded-md transition-all ${language === 'es' ? 'bg-white shadow-sm' : 'hover:bg-white/20'}`}
              title="Español"
            >
              <img src="https://flagcdn.com/w20/es.png" alt="ES" className="w-5 h-auto rounded-sm" />
            </button>
            <button
              onClick={() => toggleLanguage('en')}
              className={`p-1.5 rounded-md transition-all ${language === 'en' ? 'bg-white shadow-sm' : 'hover:bg-white/20'}`}
              title="English"
            >
              <img src="https://flagcdn.com/w20/us.png" alt="EN" className="w-5 h-auto rounded-sm" />
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-white hover:text-primary transition-colors relative z-50"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-secondary border-t border-white/10 p-6 flex flex-col gap-6 z-40 shadow-xl md:hidden animate-fadeIn text-center">
          <div className="flex justify-center gap-4 mb-4">
             <button
              onClick={() => toggleLanguage('es')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${language === 'es' ? 'bg-white text-secondary font-bold' : 'text-white hover:bg-white/10'}`}
            >
              <img src="https://flagcdn.com/w20/es.png" alt="ES" className="w-5 h-auto" /> Español
            </button>
            <button
              onClick={() => toggleLanguage('en')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${language === 'en' ? 'bg-white text-secondary font-bold' : 'text-white hover:bg-white/10'}`}
            >
              <img src="https://flagcdn.com/w20/us.png" alt="EN" className="w-5 h-auto" /> English
            </button>
          </div>
          <a href="#sobre-mi" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">{t('nav.about')}</a>
          <a href="#clases" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">{t('nav.classes')}</a>
          <a href="#planes" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">{t('nav.pricing')}</a>
          <a href="#politicas" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">{t('nav.policies')}</a>
          <button
             onClick={() => {
                onBook("trial")
                setIsMenuOpen(false)
             }}
             className="bg-primary text-white w-full py-4 rounded-lg font-bold text-lg shadow-soft"
          >
            {t('nav.book')}
          </button>
        </div>
      )}
    </nav>
  )
}

const Hero = ({ onBook }) => {
  const { t } = useLanguage()
  
  return (
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
          {t('hero.subtitle')}
        </p>

        <div className="pt-4 flex justify-center lg:justify-start">
          <button
            onClick={() => onBook("trial")}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-soft-lg hover:bg-orange-500 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {t('hero.cta')}
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
}

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

const AcercaDeMi = () => {
  const { t } = useLanguage()
  
  return (
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
            {t('about.title')}
          </h2>
          <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
            <p><strong>{t('about.p1')}</strong></p>
            <p>{t('about.p2')}</p>
            <p>{t('about.p3')}</p>
            <p>{t('about.p4')}</p>
            <p>{t('about.p5')}</p>
            <p className="bg-light p-6 rounded-2xl italic text-gray-600 border border-gray-100 shadow-sm mt-6">
              {t('about.quote')}
            </p>
            <p className="font-medium text-secondary mt-6">
              {t('about.p6')}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
  )
}

const ComoSonLasClases = () => {
  const { t } = useLanguage()
  const features = t('classes.features') || []

  return (
  <section id="clases" className="py-24 px-6 bg-light font-grotesk">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-6">
          {t('classes.title')}
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('classes.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Mic size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">{features[0]?.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {features[0]?.desc}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Video size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">{features[1]?.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {features[1]?.desc}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Brain size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">{features[2]?.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {features[2]?.desc}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-transform">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Heart size={28} />
          </div>
          <h3 className="font-bold text-xl text-secondary mb-3">{features[3]?.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {features[3]?.desc}
          </p>
        </div>
      </div>
    </div>
  </section>
  )
}

const Marquee = () => {
  const { t } = useLanguage()
  const items = t('marquee') || []
  return (
  <div className="bg-secondary border-y-2 border-black py-4 overflow-hidden transform -rotate-1 origin-left scale-[1.02]">
    <div className="whitespace-nowrap animate-marquee flex items-center">
      <div className="flex gap-8 px-4">
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="text-4xl font-syne font-bold text-white uppercase">
              {items[0]}
            </span>
            <span className="text-4xl font-syne font-bold text-outline-white uppercase">
              {items[1]}
            </span>
            <span className="text-4xl font-syne font-bold text-primary uppercase">
              {items[2]}
            </span>
            <span className="text-4xl font-syne font-bold text-outline-white uppercase">
              {items[3]}
            </span>
            <span className="text-4xl font-syne font-bold text-white uppercase">
              {items[4]}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
  )
}

const Philosophy = () => {
  const { t } = useLanguage()
  const items = t('philosophy.items') || []
  return (
  <section id="filosofia" className="py-24 px-6 bg-white font-grotesk">
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-4">
            {t('philosophy.title')} <span className="text-primary italic">{t('philosophy.titleItalic')}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-md">
            {t('philosophy.subtitle')}
          </p>
        </div>
        <ArrowRight className="hidden md:block w-12 h-12 text-secondary/30 rotate-90" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-50 p-8 rounded-3xl transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-secondary">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl text-secondary mb-4">{items[0]?.title}</h3>
          <p className="text-gray-600">
            {items[0]?.desc}
          </p>
        </div>
        
        <div className="bg-primary text-white p-8 rounded-3xl shadow-soft-lg transition-all duration-300 transform md:-translate-y-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 text-white">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl mb-4">{items[1]?.title}</h3>
          <p className="text-white/90">
            {items[1]?.desc}
          </p>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-3xl transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-secondary">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="font-syne font-bold text-2xl text-secondary mb-4">{items[2]?.title}</h3>
          <p className="text-gray-600">
            {items[2]?.desc}
          </p>
        </div>
      </div>
    </div>
  </section>
  )
}

const Pricing = ({ onBook }) => {
  const { t } = useLanguage()
  const services = t('services') || []
  return (
  <section id="planes" className="py-24 px-6 bg-light relative font-grotesk">
    <div className="container mx-auto max-w-6xl relative z-10">
      <div className="text-center mb-16">
        <span className="inline-block bg-orange-100 text-primary px-4 py-1 rounded-full font-bold text-sm tracking-widest uppercase mb-4">
          {t('pricing.badge')}
        </span>
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary">
          {t('pricing.title')} <span className="text-primary italic">{t('pricing.titleItalic')}</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {services.filter((s) => !s.hidden).map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl flex flex-col transition-all duration-300 ${
              plan.id === 'pro' 
                ? "bg-secondary text-white shadow-xl transform md:-translate-y-4 md:scale-105 z-10 border border-secondary/20" 
                : "bg-white text-secondary shadow-soft border border-gray-100 hover:shadow-soft-lg"
            } relative`}
          >
            {plan.id === 'pro' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full font-bold text-xs uppercase tracking-wide shadow-md">
                {t('pricing.popular')}
              </div>
            )}

            <div className={`p-8 pb-6 border-b ${plan.id === 'pro' ? "border-white/10" : "border-gray-100"}`}>
              <h3 className={`font-syne font-bold text-2xl ${plan.id === 'pro' ? "text-primary" : "text-secondary"}`}>
                {plan.title}
              </h3>
              <p className={`font-medium text-sm mt-1 ${plan.id === 'pro' ? "text-gray-300" : "text-gray-500"}`}>
                {plan.subtitle}
              </p>
            </div>

            <div className={`p-8 flex-grow`}>
              <div className="flex items-baseline mb-8">
                <span className="font-grotesk font-bold text-5xl md:text-6xl">
                    €{plan.id === 'mentorship' ? '99' : plan.id === 'pro' ? '59' : '29'}
                </span>
                <span className={`${plan.id === 'pro' ? "text-gray-400" : "text-gray-500"} ml-2 font-medium`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-4 text-sm font-medium">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    {plan.id === 'pro' ? (
                        <Star className="w-5 h-5 text-primary shrink-0" fill="currentColor" />
                    ) : (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                    <span className={plan.id === 'pro' ? "text-gray-200" : "text-gray-600"}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => onBook(plan.id)}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.id === 'pro'
                    ? "bg-primary text-white hover:bg-orange-500 shadow-soft hover:shadow-md hover:-translate-y-0.5"
                    : "bg-gray-50 text-secondary hover:bg-secondary hover:text-white"
                }`}
              >
                {plan.id === 'pro' ? t('pricing.start') : t('pricing.select')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
  )
}

const Testimonials = () => {
  const { t } = useLanguage()
  const items = t('testimonials.items') || []
  return (
  <section id="testimonios" className="py-24 px-6 bg-white">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-4">
          {t('testimonials.title')} <span className="text-primary italic">{t('testimonials.titleItalic')}</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-8 rounded-3xl hover:-translate-y-1 transition-transform border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" className="text-primary" />
              ))}
            </div>
            <h4 className="font-syne font-bold text-xl text-secondary mb-4">"{item.result}"</h4>
            <p className="text-gray-600 mb-8 font-grotesk leading-relaxed">
              {item.text}
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-lg">
                {item.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-secondary text-sm">{item.name}</p>
                <p className="text-xs text-gray-500 font-medium">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
  )
}

const Footer = () => {
  const { t } = useLanguage()
  return (
  <footer className="bg-secondary text-white relative overflow-hidden font-grotesk">
    <div className="container mx-auto max-w-6xl px-6 py-16 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start md:mb-12 gap-8 text-center md:text-left">
        <div>
          <h2 className="font-syne font-bold text-3xl md:text-4xl text-white">
            Español <span className="text-primary italic font-serif">con</span> Sentido
          </h2>
          <p className="text-gray-400 mt-2 font-light">{t('footer.subtitle')}</p>
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
        <p>{t('footer.rights')}</p>
        <div className="flex gap-6 mt-4 md:mt-0 font-medium">
          <a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a>
        </div>
      </div>
    </div>
  </footer>
  )
}

// --- BOOKING SYSTEM ---
// Kept largely intact logic-wise, just styled to match brutalism (borders, fonts)
const BookingModal = ({ isOpen, onClose, initialServiceId }) => {
  const { t, language } = useLanguage()
  const services = t('services') || []
  const modal = t('modal') || {}

  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [serviceId, setServiceId] = useState(initialServiceId)

  useEffect(() => {
    if (isOpen && initialServiceId) {
      setServiceId(initialServiceId)
      setStep(1)
      setSelectedDate(null)
      setSelectedTime(null)
    }
  }, [isOpen, initialServiceId])

  const service = services.find((s) => s.id === serviceId) || services[0] || {}

  const timeSlots = ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"]
  const nextDays = React.useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return {
      day: d.toLocaleDateString(language === 'es' ? "es-ES" : "en-US", { weekday: "short" }),
      date: d.getDate(),
      fullDate: d,
      id: d.toISOString().split('T')[0]
    }
  }), [language])

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
                {modal.steps?.time}
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
                {modal.steps?.details}
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
                {modal.steps?.payment}
              </div>
            </div>
          )}

          {/* STEP 1: CALENDAR */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h4 className="text-2xl font-syne font-bold text-secondary mb-6">
                {modal.time?.title}
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
                  {modal.time?.continue}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS (Cuestionario) */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <h4 className="text-2xl font-syne font-bold text-secondary mb-2">
                {modal.details?.title}
              </h4>
              <p className="text-gray-500 mb-8">{modal.details?.subtitle}</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.name}</label>
                    <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.namePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.email}</label>
                    <input type="email" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.emailPlaceholder} />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q1}</label>
                   <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                     <option value="">{modal.details?.q1Placeholder}</option>
                     {modal.details?.q1Options?.map((opt, idx) => <option key={idx}>{opt}</option>)}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q2}</label>
                   <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                     <option value="">{modal.details?.q2Placeholder}</option>
                     {modal.details?.q2Options?.map((opt, idx) => <option key={idx}>{opt}</option>)}
                   </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q3}</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q3Placeholder} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q4}</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q4Placeholder} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q5} <span className="text-gray-400 font-normal">{modal.details?.optional}</span></label>
                  <textarea rows="2" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q5Placeholder}></textarea>
                </div>
              </div>

              <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 font-bold hover:text-secondary transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  {modal.details?.back}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
                >
                  {modal.details?.continueText}
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
                    {modal.payment?.alertTitle}
                  </p>
                  <p className="text-gray-600">
                    {modal.payment?.alertDesc}
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
                  <span className="font-bold text-black uppercase">{modal.payment?.total}</span>
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
                  <span className="italic">{modal.payment?.payWith}</span>
                  <span className="italic font-extrabold text-2xl">PayPal</span>
                </button>

                <p className="text-center text-xs text-gray-500 uppercase font-mono">
                  {modal.payment?.secure}
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full text-center mt-6 text-gray-500 text-sm font-bold uppercase hover:text-black hover:underline"
              >
                {modal.payment?.cancel}
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
                {modal.success?.title}
              </h4>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {modal.success?.desc}
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
                      {modal.success?.policy}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {modal.success?.policyDesc}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-8 bg-black text-white px-8 py-3 font-bold uppercase border-2 border-black hover:bg-white hover:text-black hover:shadow-hard transition"
              >
                {modal.success?.return}
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
