"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

const INQUIRY_ENDPOINT = "https://climrisk-github-io.onrender.com/inquiry";

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "aol.com", "proton.me", "protonmail.com", "live.com", "msn.com",
];

const FUNCTIONS = [
  "Risk & Compliance",
  "Sustainability / ESG",
  "Investment & Portfolio Management",
  "Operations & Supply Chain",
  "Other",
];

const OBJECTIVES = [
  "Regulatory Disclosure (CSRD, IFRS S2, TCFD)",
  "Portfolio Stress-Testing (NGFS Scenarios)",
  "Operational Disruption & CapEx Modeling",
  "Asset / Supply Chain Mapping",
];

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
  const [emailError, setEmailError] = useState("");

  function validateWorkEmail(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase().trim();
    if (!domain) return true; // let the native `required`/`type=email` catch malformed input
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      setEmailError("Please use your work email, not a personal address, so we can route you correctly.");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const workEmail = String(fd.get("workEmail") || "");

    if (!validateWorkEmail(workEmail)) return;

    const payload = {
      first_name: String(fd.get("firstName") || ""),
      last_name: String(fd.get("lastName") || ""),
      work_email: workEmail,
      company: String(fd.get("company") || ""),
      primary_function: String(fd.get("primaryFunction") || ""),
      primary_objective: String(fd.get("primaryObjective") || ""),
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
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="panel p-8">
        <p className="text-xs uppercase tracking-widest text-terminal font-mono mb-4">Request Received</p>
        <h3 className="text-white font-semibold text-lg mb-3">We've got it. What happens next:</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          Someone from the team will reach out to your work email to schedule a 30-minute walkthrough
          tailored to what you selected. If you'd rather grab a slot yourself, this is where a scheduling
          link goes once one is connected. For now, reach out directly if you'd like to move faster.
        </p>
        <div className="border-t border-white/8 pt-6">
          <p className="text-xs text-zinc-500 mb-3">While you wait, the methodology behind the engine:</p>
          <Link href="/methodology" className="text-sm text-gold-200 hover:text-gold-300 transition-colors inline-flex items-center gap-1.5">
            Read the full methodology
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M7 7h10v10"/>
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-8">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-6">Request Access</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="First Name">
            <input name="firstName" type="text" required className={inputClass} />
          </Field>
          <Field label="Last Name">
            <input name="lastName" type="text" required className={inputClass} />
          </Field>
        </div>

        <Field label="Work Email">
          <input
            name="workEmail"
            type="email"
            required
            className={inputClass}
            onBlur={(e) => validateWorkEmail(e.target.value)}
          />
          {emailError && <p className="text-xs text-red-400 mt-2">{emailError}</p>}
        </Field>

        <Field label="Company Name">
          <input name="company" type="text" required className={inputClass} />
        </Field>

        <Field label="Primary Function">
          <select name="primaryFunction" required className={selectClass} defaultValue="">
            <option value="" disabled>Select one</option>
            {FUNCTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Primary Objective">
          <select name="primaryObjective" required className={selectClass} defaultValue="">
            <option value="" disabled>Select one</option>
            {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Notes (optional)">
          <textarea name="notes" rows={3} className={`${inputClass} resize-none`} />
        </Field>

        <button type="submit" className="btn-primary w-full justify-center" disabled={status === "sending"}>
          {status === "sending" ? "Submitting…" : "Request Access"}
        </button>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Your request goes straight to the ClimRisk team, work email required so we know who we're
          talking to.
        </p>

        {status === "error" && (
          <p className="text-xs text-red-400 font-mono">
            Something went wrong submitting your request. Please email{" "}
            <a href="mailto:shri@climrisk.io" className="underline">shri@climrisk.io</a> directly.
          </p>
        )}
      </form>
    </div>
  );
}
