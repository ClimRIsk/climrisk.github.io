/**
 * Research content loader (build time, static export).
 *
 * An article lives in   content/research/<slug>/article.md   (GitHub-flavoured markdown)
 * with its metadata in  content/research/<slug>/meta.json
 * and its images in     public/research/<slug>/…  (referenced in markdown as /research/<slug>/x.png)
 *
 * meta.json "status": "published" → listed and rendered on climrisk.io
 *                     "draft"     → hidden (the Research Desk agent writes drafts;
 *                                    scripts/publish_research.sh flips them to published)
 * Set SHOW_DRAFTS=1 when running `npm run dev` to preview drafts locally.
 */
import fs from "fs";
import path from "path";
import { BRIEFS, type Brief } from "../app/research/data";

export type Source = { title: string; url?: string };
export type Article = Brief & {
  date?: string;          // ISO date of publication
  author?: string;
  cover?: string;         // /research/<slug>/cover.png
  substack?: string;      // canonical Substack URL, when cross-posted
  sources?: Source[];
  readingMinutes?: number;
  hasContent: boolean;
};

const DIR = path.join(process.cwd(), "content", "research");
const showDrafts = process.env.SHOW_DRAFTS === "1";

type Meta = Omit<Partial<Article>, "status"> & { status?: "published" | "draft" | "in-progress" };

function readMeta(slug: string): Meta | null {
  const f = path.join(DIR, slug, "meta.json");
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

export function articleBody(slug: string): string | null {
  const f = path.join(DIR, slug, "article.md");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}

function contentSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
}

/** Every brief shown on the site: the hand-curated list plus published content folders. */
export function allArticles(): Article[] {
  const out = new Map<string, Article>();
  for (const b of BRIEFS) out.set(b.slug, { ...b, hasContent: false });
  for (const slug of contentSlugs()) {
    const m = readMeta(slug);
    if (!m) continue;
    const isDraft = m.status === "draft";
    if (isDraft && !showDrafts) continue;
    const body = articleBody(slug);
    const base = out.get(slug);
    const words = body ? body.split(/\s+/).length : 0;
    out.set(slug, {
      ...(base ?? { slug, tier: "case-study", kicker: "", title: slug, detail: "" }),
      ...(m as Omit<Meta, "status">),
      slug,
      status: m.status === "in-progress" ? "in-progress" : undefined,
      hasContent: !!body,
      readingMinutes: words ? Math.max(1, Math.round(words / 230)) : undefined,
      // a full article on our own site always opens here, with Substack as a secondary link
      href: body ? undefined : (m.href ?? base?.href),
    });
  }
  const list = Array.from(out.values());
  // newest dated pieces first; undated curated items keep their order after them
  return list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getArticle(slug: string): Article | undefined {
  return allArticles().find((a) => a.slug === slug);
}
