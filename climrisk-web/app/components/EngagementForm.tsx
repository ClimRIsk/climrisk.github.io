"use client";

import { useState, FormEvent } from "react";

const ENGAGEMENT_TYPES = [
  "Technical Demo",
  "Regulatory Advisory (CSRD / IFRS S2 / TCFD)",
  "Carbon Auditing & Data Assurance",
  "Physical & Transition Stress Testing",
  "Partnership / Data Provider",
  "Media & Academic Inquiry",
];

const INSTITUTION_TYPES = [
  "Bank / Financial Institution",
  "Asset Manager / Institutional Investor",
  "Industrial Corporate",
  "Insurer / Reinsurer",
  "Government / NGO",
  "Other",
];

const ASSET_RANGES = ["Under 50 assets", "50 – 500 assets", "500 – 5,000 assets", "5,000+ assets"];

const REGULATORY_DRIVERS = ["CSRD", "IFRS S2", "TCFD", "SEBI / BRSR", "Internal risk mandate", "Not yet determined"];

const TIMELINES = ["Immediate", "This quarter", "Next quarter", "Exploratory"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full bg-obsidian-800 border border-white/8 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-gold-200/50 transition-colors duration-300";
const inputClass = selectClass;

export default function EngagementForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const lines = [
      `Engagement Type: ${fd.get("engagementType")}`,
      `Institution Type: ${fd.get("institutionType")}`,
      `Assets Under Consideration: ${fd.get("assetRange")}`,
      `Primary Regulatory Driver: ${fd.get("regulatoryDriver")}`,
      `Timeline: ${fd.get("timeline")}`,
      ``,
      `Name: ${fd.get("name")}`,
      `Institution: ${fd.get("institution")}`,
      `Email: ${fd.get("email")}`,
      ``,
      `Notes:`,
      String(fd.get("notes") || ""),
    ].join("\n");

    const subject = encodeURIComponent(`Engagement Inquiry — ${fd.get("engagementType")}`);
    const body = encodeURIComponent(lines);
    window.location.href = `mailto:shri@climrisk.io?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="panel p-8">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-6">Inquiry Parameters</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Engagement Type">
          <select name="engagementType" required className={selectClass} defaultValue="">
            <option value="" disabled>Select an engagement type</option>
            {ENGAGEMENT_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Institution Type">
            <select name="institutionType" required className={selectClass} defaultValue="">
              <option value="" disabled>Select one</option>
              {INSTITUTION_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Assets Under Consideration">
            <select name="assetRange" required className={selectClass} defaultValue="">
              <option value="" disabled>Select a range</option>
              {ASSET_RANGES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Primary Regulatory Driver">
            <select name="regulatoryDriver" required className={selectClass} defaultValue="">
              <option value="" disabled>Select one</option>
              {REGULATORY_DRIVERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Timeline">
            <select name="timeline" required className={selectClass} defaultValue="">
              <option value="" disabled>Select one</option>
              {TIMELINES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Name">
            <input name="name" type="text" required className={inputClass} />
          </Field>
          <Field label="Institution">
            <input name="institution" type="text" required className={inputClass} />
          </Field>
        </div>

        <Field label="Email">
          <input name="email" type="email" required className={inputClass} />
        </Field>

        <Field label="Notes (optional)">
          <textarea name="notes" rows={3} className={`${inputClass} resize-none`} />
        </Field>

        <button type="submit" className="btn-primary w-full justify-center">
          Submit Inquiry / Request NDA
        </button>

        <p className="text-xs text-zinc-600 leading-relaxed">
          This opens a pre-filled email to shri@climrisk.io in your mail client — nothing is
          transmitted automatically. If your client doesn't open, email the details above directly.
        </p>

        {sent && (
          <p className="text-xs text-terminal font-mono">
            Your mail client should now be open with the inquiry pre-filled.
          </p>
        )}
      </form>
    </div>
  );
}
