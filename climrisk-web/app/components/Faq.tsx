import Reveal from "./Reveal";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Where does the data live, and who hosts it?",
    a: "The engine and your portfolio data run in a cloud environment we control; nothing is handed to a third-party AI vendor for inference — the resident agent needs no API key by default, and an optional language model runs entirely on your own machine via Ollama if you want more fluent written answers. For regulated deployments (banking, insurance) we scope hosting and data residency per engagement — raise it on the call and we'll work it into the proposal rather than force a one-size-fits-all answer here.",
  },
  {
    q: "How long does implementation actually take?",
    a: "A single-portfolio screening run (asset coordinates in, Capital-at-Risk out) is typically same-day — the live widget on the homepage is that exact pipeline, running on real data, not a sample file. A full embedded-due-diligence or white-label engagement, where the output feeds your own disclosure cycle, is usually 2–6 weeks depending on how much of your asset register needs geocoding first.",
  },
  {
    q: "Is there an API, or is this only a web app?",
    a: "Both. The web app (\"Launch Platform\") is the same engine every capability on the Platform page is built on, and it's also reachable as a direct API for teams integrating Capital-at-Risk output into their own risk systems at portfolio scale — see the Enterprise API engagement model on the Platform page.",
  },
  {
    q: "How is this priced?",
    a: "There's no published price list, because the three engagement models (Advisory Retainer, Embedded Due Diligence, White Label) scale very differently with portfolio size and how deeply the output needs to integrate with your existing workflow. Book a call and we'll scope it against your actual asset count rather than quote a number that doesn't fit your portfolio.",
  },
  {
    q: "What happens if the model is wrong about one of my assets?",
    a: "We'd rather you catch that than we hide it. Every methodology decision traces to a named, public data source (see /methodology), every validation test is published with its script so you can re-run it yourself (see /validation), and the engine reports its own confidence rather than a single number dressed up as certainty. If something still looks off on your own assets, that's exactly what the technical demo is for — we'll run it live, together, on your own coordinates.",
  },
];

export default function Faq() {
  return (
    <div className="max-w-5xl mx-auto mt-24 pt-16 border-t border-white/8">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Before You Book a Call</p>
        <h2 className="heading-lg grad-text mb-10">What procurement usually asks first.</h2>
      </Reveal>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <Reveal key={item.q} delayMs={i * 50}>
            <details className="group panel px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white font-medium text-sm leading-relaxed">
                {item.q}
                <svg
                  className="shrink-0 text-gold-200 transition-transform duration-300 group-open:rotate-45"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="text-sm text-zinc-500 leading-relaxed mt-4">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
