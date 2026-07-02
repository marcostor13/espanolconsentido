import { Link } from "react-router-dom"
import { ArrowLeft, Gift } from "lucide-react"
import { useLanguage } from "../context/LanguageContext"
import WhatsAppButton from "../components/WhatsAppButton"

export default function ReferralPage() {
  const { t, language, toggleLanguage } = useLanguage()
  const page = t("referralPage")

  if (!page || typeof page !== "object") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] font-grotesk selection:bg-primary selection:text-white">
      <header
        className="sticky top-0 z-30 border-b border-white/10 shadow-sm"
        style={{ backgroundColor: "#020410" }}
      >
        <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} aria-hidden />
            {page.backToHome}
          </Link>
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => toggleLanguage("es")}
              className={"p-1.5 rounded-md transition-all " + (language === "es" ? "bg-white shadow-sm" : "hover:bg-white/20")}
              title="Español"
            >
              <img src="https://flagcdn.com/w20/es.png" alt="" className="w-5 h-auto rounded-sm" />
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage("en")}
              className={"p-1.5 rounded-md transition-all " + (language === "en" ? "bg-white shadow-sm" : "hover:bg-white/20")}
              title="English"
            >
              <img src="https://flagcdn.com/w20/us.png" alt="" className="w-5 h-auto rounded-sm" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ backgroundColor: "#020410" }}>
          <div className="container mx-auto px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center relative z-10">
            <div className="text-center md:text-left order-2 md:order-1">
              <span className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full font-bold text-xs md:text-sm tracking-widest uppercase mb-6">
                <Gift size={16} />
                {page.badge}
              </span>
              <h1 className="font-syne font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-5 leading-tight">
                {page.title}
              </h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                {page.intro}
              </p>
            </div>
            <div className="order-1 md:order-2 mx-auto w-full max-w-sm md:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80"
                  alt={page.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-3xl px-6">
          {/* How it works */}
          <section className="py-12 md:py-16">
            <h2 className="font-syne font-bold text-2xl md:text-3xl text-secondary mb-8 text-center md:text-left">
              {page.howItWorksTitle}
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {(page.steps || []).map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center sm:items-start sm:text-left"
                >
                  <h3 className="font-syne font-bold text-lg text-secondary mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Terms sections */}
          <div className="space-y-6 pb-4">
            {(page.sections || []).map((sec, idx) => (
              <div key={idx} className="rounded-2xl bg-white border border-gray-100 p-6 md:p-8 shadow-sm">
                <h2 className="font-syne font-bold text-base md:text-lg text-secondary mb-4">{sec.title}</h2>
                {sec.bullets?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
                    {sec.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {(sec.paragraphs || []).map((para, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  )
}
