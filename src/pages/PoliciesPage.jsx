import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "../context/LanguageContext"

export default function PoliciesPage() {
  const { t, language, toggleLanguage } = useLanguage()
  const page = t("policiesPage")

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

      <main className="py-12 md:py-16 px-6 pb-24">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-syne font-bold text-3xl md:text-4xl text-secondary mb-4">
            {page.title}
          </h1>
          <p className="text-gray-600 mb-12 leading-relaxed text-lg">{page.intro}</p>
          <div className="space-y-8">
            {(page.sections || []).map((sec, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/90 border border-gray-100 p-6 md:p-8 shadow-sm"
              >
                <h2 className="font-syne font-bold text-base md:text-lg text-secondary mb-4">
                  {sec.title}
                </h2>
                {sec.preamble ? (
                  <p className="text-gray-700 leading-relaxed mb-3">{sec.preamble}</p>
                ) : null}
                {sec.bullets?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed mb-3">
                    {sec.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {(sec.paragraphs || []).map((para, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
