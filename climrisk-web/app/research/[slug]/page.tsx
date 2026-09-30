import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Reveal from "../../components/Reveal";
import { allArticles, articleBody, getArticle } from "../../../lib/research";

// A page exists for every brief that has its own content, and for curated briefs
// that are not published elsewhere (those show the "being finalized" panel).
function pageArticles() {
  return allArticles().filter((a) => a.hasContent || !a.href);
}

export function generateStaticParams() {
  return pageArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.detail,
    openGraph: {
      title: a.title,
      description: a.detail,
      type: "article",
      ...(a.cover ? { images: [{ url: `https://climrisk.io${a.cover}` }] } : {}),
      ...(a.date ? { publishedTime: a.date } : {}),
    },
    ...(a.substack ? { alternates: { canonical: a.substack } } : {}),
  };
}

const md = {
  h1: () => null, // the page header already shows the title
  h2: (p: any) => <h2 className="text-2xl font-semibold text-white mt-14 mb-5 leading-snug" {...p} />,
  h3: (p: any) => <h3 className="text-lg font-semibold text-white mt-10 mb-3" {...p} />,
  p: (p: any) => <p className="text-[17px] text-zinc-300 leading-[1.8] mb-6" {...p} />,
  strong: (p: any) => <strong className="text-white font-semibold" {...p} />,
  a: ({ href, ...p }: any) => (
    <a href={href} className="text-gold-200 underline decoration-gold-200/40 underline-offset-4 hover:decoration-gold-200"
       {...(href && href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...p} />
  ),
  ul: (p: any) => <ul className="list-disc pl-6 mb-6 space-y-2 text-zinc-300 text-[17px] leading-[1.75]" {...p} />,
  ol: (p: any) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-zinc-300 text-[17px] leading-[1.75]" {...p} />,
  blockquote: (p: any) => (
    <blockquote className="border-l-2 border-gold-200 pl-6 my-10 text-xl text-white leading-relaxed italic" {...p} />
  ),
  hr: () => <hr className="my-12 border-white/10" />,
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt }: any) => (
    <figure className="my-10">
      <img src={src} alt={alt ?? ""} className="w-full rounded-xl border border-white/10" loading="lazy" />
      {alt ? <figcaption className="text-xs text-zinc-500 mt-3 font-mono">{alt}</figcaption> : null}
    </figure>
  ),
  table: (p: any) => (
    <div className="my-10 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm text-left" {...p} />
    </div>
  ),
  th: (p: any) => <th className="px-4 py-3 bg-white/5 text-zinc-300 font-semibold border-b border-white/10" {...p} />,
  td: (p: any) => <td className="px-4 py-3 text-zinc-400 border-b border-white/5 align-top" {...p} />,
  code: (p: any) => <code className="font-mono text-[0.9em] text-gold-200" {...p} />,
};

export default function ResearchBriefPage({ params }: { params: { slug: string } }) {
  const a = pageArticles().find((x) => x.slug === params.slug);
  if (!a) notFound();
  const body = a.hasContent ? articleBody(a.slug) : null;
  const date = a.date ? new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="pt-40 pb-32 px-6">
      <article className="max-w-3xl mx-auto">
        <Reveal>
          <Link href="/research" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 7 7 17M7 7v10h10"/>
            </svg>
            Back to Research
          </Link>

          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-4">{a.kicker}</p>
          <h1 className="heading-xl grad-text mb-8">{a.title}</h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-6">{a.detail}</p>
          {(date || a.author || a.readingMinutes) && (
            <p className="text-sm text-zinc-500 font-mono mb-12">
              {[a.author ?? "ClimRisk Research Desk", date, a.readingMinutes ? `${a.readingMinutes} min read` : null]
                .filter(Boolean).join(" · ")}
              {a.substack ? (
                <> · <a href={a.substack} target="_blank" rel="noopener noreferrer" className="text-gold-200 hover:text-white">Also on Substack</a></>
              ) : null}
            </p>
          )}
        </Reveal>

        {body ? (
          <div>
            {a.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.cover} alt="" className="w-full rounded-2xl border border-white/10 mb-14" />
            ) : null}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{body}</ReactMarkdown>

            {a.sources && a.sources.length > 0 && (
              <div className="mt-16 pt-8 border-t border-white/10">
                <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-mono mb-4">Sources</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-500">
                  {a.sources.map((s, i) => (
                    <li key={i}>
                      {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold-200">{s.title}</a> : s.title}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="panel p-8 mt-16">
              <p className="text-sm text-zinc-400 leading-relaxed">
                ClimRisk translates physical and transition climate risk into asset-level financial exposure.
                To run your own assets or portfolio through the engine, write to{" "}
                <a href="mailto:shri@climrisk.io" className="text-white hover:text-gold-200 transition-colors font-mono">shri@climrisk.io</a>{" "}
                or <Link href="/contact" className="text-white hover:text-gold-200">book a demo</Link>.
              </p>
            </div>
          </div>
        ) : (
          <div className="panel p-8">
            <p className="text-sm text-zinc-400 leading-relaxed">
              The full brief is being finalized for publication. In the meantime, the research desk
              is happy to walk you through the underlying data and methodology directly — reach out
              at{" "}
              <a href="mailto:shri@climrisk.io" className="text-white hover:text-gold-200 transition-colors font-mono">
                shri@climrisk.io
              </a>
              .
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
