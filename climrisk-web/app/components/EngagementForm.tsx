"use client";

import { useState, FormEvent } from "react";

const INQUIRY_ENDPOINT = "https://climrisk-github-io.onrender.com/inquiry";

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
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      engagement_type: String(fd.get("engagementType") || ""),
      institution_type: String(fd.get("institutionType") || ""),
      asset_range: String(fd.get("assetRange") || ""),
      regulatory_driver: String(fd.get("regulatoryDriver") || ""),
      timeline: String(fd.get("timeline") || ""),
      name: String(fd.get("name") || ""),
      institution: String(fd.get("institution") || ""),
      email: String(fd.get("email") || ""),
      notes: String(fd.get("notes") || ""),
    };

    setStatus("sending");
    try {
      const res = await fetch(INQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
    }
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

        <button type="submit" className="btn-primary w-full justify-center" disabled={status === "sending"}>
          {status === "sending" ? "Submitting…" : "Submit Inquiry / Request NDA"}
        </button>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Your inquiry is sent directly to the ClimRisk team — nothing opens in your own mail client.
        </p>

        {status === "sent" && (
          <p className="text-xs text-terminal font-mono">
            Inquiry received. We&apos;ll be in touch shortly.
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-400 font-mono">
            Something went wrong submitting your inquiry. Please email{" "}
            <a href="mailto:shri@climrisk.io" className="underline">shri@climrisk.io</a> directly.
          </p>
        )}
      </form>
    </div>
  );
}
