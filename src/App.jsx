import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Link } from "react-router-dom"
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
        isScrolled ? "backdrop-blur-md shadow-soft py-3" : "py-5"
      }`}
      style={{ backgroundColor: isScrolled ? 'rgba(2, 4, 16, 0.95)' : '#020410' }}
    >
      <div className="container mx-auto px-6 flex justify-between items-center text-white">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group relative z-50">
          <img
             src="/logo2_nobg.png"
             alt="Español con Sentido - Juanita Sánchez"
             className="h-20 md:h-24 w-auto object-contain transition-transform hover:scale-105"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-grotesk text-sm font-medium tracking-wide">
          <a href="#sobre-mi" className="hover:text-primary transition-colors">{t('nav.about')}</a>
          <a href="#clases" className="hover:text-primary transition-colors">{t('nav.classes')}</a>
          <a href="#planes" className="hover:text-primary transition-colors">{t('nav.pricing')}</a>
          <Link to="/politicas" className="hover:text-primary transition-colors">{t('nav.policies')}</Link>
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
        <div className="absolute top-full left-0 w-full border-t border-white/10 p-6 flex flex-col gap-6 z-40 shadow-xl md:hidden animate-fadeIn text-center" style={{ backgroundColor: '#020410' }}>
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
          <Link to="/politicas" onClick={() => setIsMenuOpen(false)} className="font-grotesk font-bold text-xl text-white hover:text-primary transition-colors">{t('nav.policies')}</Link>
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
    {/* Background Curve (sección del video) */}
    <div className="absolute top-0 left-0 w-full h-[65%] md:h-[75%] z-0 rounded-b-[40px] md:rounded-b-[80px]" style={{ backgroundColor: '#0F0A11' }}></div>

    <div className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
      {/* Left text content */}
      <div className="space-y-8 lg:pr-10 text-center lg:text-left">
        <h1 className="text-5xl md:text-7xl leading-[1.1] text-white">
          <span className="block font-serif font-medium tracking-tight mb-2 text-6xl md:text-8xl">Español</span>
          <span className="block text-primary font-serif my-2 text-6xl md:text-8xl">
            <span className="italic opacity-90">con </span><span className="font-bold tracking-tight">Sentido</span>
          </span>
        </h1>
        <p className="text-2xl md:text-3xl text-white/90 max-w-lg mx-auto lg:mx-0 font-serif font-light italic tracking-wide mt-2 mb-6">
          Español para comunicar, expresar y sentir
        </p>

        <p className="text-lg md:text-xl text-gray-200 max-w-lg mx-auto lg:mx-0 font-grotesk font-light">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center lg:justify-start gap-4" style={{ marginTop: '4rem', paddingTop: '1.5rem' }}>
          <button
            onClick={() => onBook("trial")}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-soft-lg hover:bg-orange-500 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {t('hero.cta')}
          </button>
          <button
            onClick={() => onBook("trial")}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-all"
          >
            {t('hero.groupClasses')}
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
        <div className="order-2 md:order-1 flex flex-col gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl translate-x-4 translate-y-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=800&q=80" 
              alt="Juanita Sánchez" 
              className="relative z-10 w-full h-auto rounded-3xl shadow-soft-lg object-cover aspect-[4/5]"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl translate-x-4 translate-y-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80" 
              alt="Conversación y aprendizaje" 
              className="relative z-10 w-full h-auto rounded-3xl shadow-soft-lg object-cover aspect-[4/5]"
            />
          </div>
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
  <div className="border-y-2 border-black py-4 overflow-hidden transform -rotate-1 origin-left scale-[1.02]" style={{ backgroundColor: '#020410' }}>
    <div className="whitespace-nowrap animate-marquee flex items-center">
      <div className="flex gap-8 px-4">
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="text-4xl font-syne font-bold text-white uppercase">
              {items[0]}
            </span>
            <span className="text-4xl font-syne font-bold text-primary uppercase">
              {items[1]}
            </span>
            <span className="text-4xl font-syne font-bold text-primary uppercase">
              {items[2]}
            </span>
            <span className="text-4xl font-syne font-bold text-primary uppercase">
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
                ? "bg-[#020410] text-white shadow-xl transform md:-translate-y-4 md:scale-105 z-10 border border-secondary/20" 
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
                    €{plan.price ?? (plan.id === 'mentorship' ? '99' : plan.id === 'pro' ? '59' : '29')}
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
                    : "bg-gray-50 text-secondary hover:bg-[#020410] hover:text-white"
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
  const groups = t('testimonials.groups') || []
  const items = Array.isArray(groups) ? groups.flatMap((g) => g.reviews || []) : []
  const itemsReversed = useMemo(() => [...items].reverse(), [items])
  const scrollerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const getScrollMetrics = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return { step: 0, maxIdx: 0 }
    const card = el.querySelector("[data-testimonial-card]")
    const style = getComputedStyle(el)
    const gap = parseFloat(style.columnGap || style.gap || "24") || 24
    const w = card?.offsetWidth ?? 0
    const step = w + gap
    const maxIdx = Math.max(0, itemsReversed.length - 1)
    return { step, maxIdx }
  }, [itemsReversed.length])

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || itemsReversed.length === 0) return
    const { step, maxIdx } = getScrollMetrics()
    if (step <= 0) return
    const idx = Math.round(el.scrollLeft / step)
    setActiveIndex(Math.min(maxIdx, Math.max(0, idx)))
  }, [getScrollMetrics, itemsReversed.length])

  const scrollToIndex = useCallback(
    (idx) => {
      const el = scrollerRef.current
      if (!el || itemsReversed.length === 0) return
      const { step, maxIdx } = getScrollMetrics()
      if (step <= 0) return
      const clamped = Math.min(maxIdx, Math.max(0, idx))
      el.scrollTo({ left: clamped * step, behavior: "smooth" })
      setActiveIndex(clamped)
    },
    [getScrollMetrics, itemsReversed.length]
  )

  const scrollByDir = (dir) => scrollToIndex(activeIndex + dir)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => syncActiveFromScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(() => syncActiveFromScroll())
    ro.observe(el)
    syncActiveFromScroll()
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
    }
  }, [syncActiveFromScroll, itemsReversed.length])

  return (
  <section id="testimonios" className="py-24 px-6 bg-white">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-10">
        <h2 className="font-syne font-bold text-4xl md:text-5xl text-secondary mb-4">
          {t('testimonials.title')} <span className="text-primary italic">{t('testimonials.titleItalic')}</span>
        </h2>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          disabled={activeIndex <= 0}
          className="absolute left-0 top-[min(12rem,35%)] z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-secondary shadow-md backdrop-blur-sm transition -ml-2 enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          aria-label={t('testimonials.prev')}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          disabled={activeIndex >= itemsReversed.length - 1}
          className="absolute right-0 top-[min(12rem,35%)] z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-secondary shadow-md backdrop-blur-sm transition -mr-2 enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          aria-label={t('testimonials.next')}
        >
          <ChevronRight size={22} />
        </button>

        <div
          ref={scrollerRef}
          className="flex items-start gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none -mx-2 px-2 pb-2 md:mx-0 md:px-8 touch-pan-x"
          role="region"
          aria-roledescription={t('testimonials.carouselLabel')}
          aria-label={`${t('testimonials.title')} ${t('testimonials.titleItalic')}`}
        >
          {itemsReversed.map((rev, idx) => (
            <article
              key={`${rev.name}-${idx}`}
              data-testimonial-card
              className="bg-gradient-to-b from-gray-50 to-white p-6 sm:p-7 rounded-2xl border border-gray-100/90 shadow-sm shrink-0 w-[min(calc(100vw-2rem),22rem)] sm:w-[24rem] max-w-[90vw] snap-center snap-always self-start transition-shadow duration-300 hover:shadow-md hover:border-primary/15"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className="text-primary" aria-hidden />
                ))}
              </div>
              <p className="text-gray-600 font-grotesk leading-relaxed text-[15px] sm:text-base">
                &ldquo;{rev.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                <div className="w-11 h-11 bg-[#020410] text-white rounded-full flex items-center justify-center font-bold text-base shrink-0 ring-2 ring-white shadow-sm">
                  {rev.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-secondary text-sm leading-tight">{rev.name}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{rev.date}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  </section>
  )
}


const Footer = () => {
  const { t } = useLanguage()
  return (
  <footer className="text-white relative overflow-hidden font-grotesk" style={{ backgroundColor: '#020410' }}>
    <div className="container mx-auto max-w-6xl px-6 py-16 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start md:mb-12 gap-8 text-center md:text-left">
        <div>
          <a href="#" className="inline-block">
            <img src="/logo2_nobg.png" alt="Español con Sentido - Juanita Sánchez" className="h-20 md:h-24 w-auto object-contain" />
          </a>
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
          <Link to="/politicas" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
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
  const [formData, setFormData] = useState({ name: '', email: '', promoCode: '', q1: '', q2: '', q3: '', q4: '', q5: '' })
  const [paypalLink, setPaypalLink] = useState(null)
  const [bookingId, setBookingId] = useState(null)
  const [finalPrice, setFinalPrice] = useState(null)
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [acceptedPolicies, setAcceptedPolicies] = useState(false)

  useEffect(() => {
    if (isOpen && initialServiceId) {
      setServiceId(initialServiceId)
      setStep(1)
      setSelectedDate(null)
      setSelectedTime(null)
      setPaypalLink(null)
      setBookingId(null)
      setFinalPrice(null)
      setAppliedPromo(null)
      setBookingError(null)
      setAcceptedPolicies(false)
    }
  }, [isOpen, initialServiceId])

  const service = services.find((s) => s.id === serviceId) || services[0] || {}
  const servicePrice = service.price ?? (serviceId === 'mentorship' ? 99 : serviceId === 'pro' ? 59 : 29)

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

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleContinueToPayment = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      setBookingError(language === 'es' ? 'Nombre y email son obligatorios' : 'Name and email are required')
      return
    }
    if (!acceptedPolicies) {
      setBookingError(modal.details?.acceptPoliciesError)
      return
    }
    setBookingError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          date: selectedDate?.id,
          time: selectedTime,
          serviceId,
          serviceTitle: service.title,
          price: servicePrice,
          promoCode: formData.promoCode?.trim() || undefined,
          questions: { q1: formData.q1, q2: formData.q2, q3: formData.q3, q4: formData.q4, q5: formData.q5 },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear la reserva')
      setBookingId(data.bookingId)
      setFinalPrice(data.finalPrice)
      setAppliedPromo(data.appliedPromo || null)
      const username = import.meta.env.VITE_PAYPAL_ME_USERNAME || ''
      const priceToPay = data.finalPrice ?? servicePrice
      const link = username
        ? (priceToPay > 0 ? `https://www.paypal.me/${username}/${priceToPay}` : `https://www.paypal.me/${username}`)
        : null
      setPaypalLink(link)
      setStep(3)
    } catch (err) {
      setBookingError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020410]/80 backdrop-blur-sm p-4 overflow-y-auto font-grotesk">
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
                  className="bg-[#020410] text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#020410]/90 transition-all shadow-soft"
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
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {bookingError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.name}</label>
                    <input type="text" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.namePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.email}</label>
                    <input type="email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.emailPlaceholder} />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q1}</label>
                   <select value={formData.q1} onChange={(e) => updateForm('q1', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                     <option value="">{modal.details?.q1Placeholder}</option>
                     {modal.details?.q1Options?.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q2}</label>
                   <select value={formData.q2} onChange={(e) => updateForm('q2', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary">
                     <option value="">{modal.details?.q2Placeholder}</option>
                     {modal.details?.q2Options?.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                   </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q3}</label>
                  <input type="text" value={formData.q3} onChange={(e) => updateForm('q3', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q3Placeholder} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q4}</label>
                  <input type="text" value={formData.q4} onChange={(e) => updateForm('q4', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q4Placeholder} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.promoCode} <span className="text-gray-400 font-normal">{modal.details?.optional}</span></label>
                  <input type="text" value={formData.promoCode} onChange={(e) => updateForm('promoCode', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400 uppercase" placeholder={modal.details?.promoCodePlaceholder} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">{modal.details?.q5} <span className="text-gray-400 font-normal">{modal.details?.optional}</span></label>
                  <textarea rows="2" value={formData.q5} onChange={(e) => updateForm('q5', e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-secondary placeholder:text-gray-400" placeholder={modal.details?.q5Placeholder}></textarea>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 flex gap-3 items-start">
                  <input
                    type="checkbox"
                    id="accept-policies-booking"
                    checked={acceptedPolicies}
                    onChange={(e) => setAcceptedPolicies(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <label htmlFor="accept-policies-booking" className="text-sm text-gray-700 leading-snug cursor-pointer">
                    {modal.details?.acceptPoliciesPrefix}{" "}
                    <a
                      href="/politicas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold underline underline-offset-2 hover:text-orange-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {modal.details?.acceptPoliciesLink}
                    </a>
                    {" "}
                    <span className="text-gray-500 text-xs">({modal.details?.acceptPoliciesOpenInNewTab})</span>
                  </label>
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
                  onClick={handleContinueToPayment}
                  disabled={loading || !acceptedPolicies}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (language === 'es' ? 'Guardando...' : 'Saving...') : modal.details?.continueText}
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
                    €{servicePrice}
                  </span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between items-center text-sm text-green-600 mb-1">
                    <span>{language === 'es' ? 'Descuento' : 'Discount'} ({appliedPromo.code} -{appliedPromo.discountPercent}%)</span>
                    <span>-€{(servicePrice - (finalPrice ?? servicePrice)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {selectedDate?.fullDate?.toLocaleDateString()} — {selectedTime}
                  </span>
                </div>
                <div className="h-0.5 bg-black my-4"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-black uppercase">{modal.payment?.total}</span>
                  <span className="font-bold text-primary">
                    €{(finalPrice ?? servicePrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {paypalLink ? (
                  <>
                    <p className="text-gray-600 text-sm mb-2">{modal.payment?.bookingSaved}</p>
                    <p className="text-gray-500 text-xs mb-4">{modal.payment?.paypalInstruction}</p>
                    <a
                      href={paypalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={async () => {
                        try {
                          const token = import.meta.env.VITE_ADMIN_TOKEN || ''
                          const url = `/api/confirm-payment?bookingId=${bookingId}${token ? `&token=${token}` : ''}`
                          const res = await fetch(url)
                          const data = await res.json()
                          if (!res.ok) {
                            console.error('Error confirming payment:', data.error)
                          } else {
                            console.log('Payment confirmed:', data.message)
                          }
                        } catch (err) {
                          console.error('Failed to confirm payment:', err.message)
                        }
                        setStep(4)
                      }}
                      className="w-full bg-[#0070BA] text-white border-2 border-[#0070BA] py-4 font-bold text-lg hover:bg-white hover:text-[#0070BA] transition shadow-hard flex justify-center items-center gap-3 rounded-xl"
                    >
                      <span className="italic">{modal.payment?.payWith}</span>
                      <span className="italic font-extrabold text-2xl">PayPal</span>
                    </a>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {modal.payment?.bookingSaved}
                    {!import.meta.env.VITE_PAYPAL_ME_USERNAME && (
                      <span className="block mt-2 text-amber-600 text-xs">
                        {language === 'es' ? 'Configura VITE_PAYPAL_ME_USERNAME en .env' : 'Set VITE_PAYPAL_ME_USERNAME in .env'}
                      </span>
                    )}
                  </p>
                )}

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
                  <div className="w-10 h-10 border-2 border-black bg-[#020410] flex items-center justify-center shrink-0">
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
                  <div className="w-10 h-10 border-2 border-black bg-[#020410] flex items-center justify-center shrink-0">
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
      <ComoSonLasClases />
      <PhotosGallery />
      <AcercaDeMi />
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
