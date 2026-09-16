export type Brief = {
  slug: string;
  kicker: string;
  title: string;
  detail: string;
  href?: string; // set only when the full piece is published externally (e.g. Substack)
  tier: "flagship" | "regulatory" | "case-study";
  status?: "in-progress"; // omit for published pieces
};

export const BRIEFS: Brief[] = [
  {
    slug: "21-global-industries-climate-scenario",
    tier: "flagship",
    kicker: "Flagship Study",
    title: "We Ran 21 Global Industries Through Every Climate Scenario",
    detail: "A coal power plant in Germany breaks even on carbon costs at $27/tonne — the EU price today is $65. The full sector-by-sector break-even map, from coal power to oil refining.",
  },
  {
    slug: "the-supply-chain-tax",
    tier: "case-study",
    kicker: "Physical Risk · South & Southeast Asia",
    title: "The Supply Chain Tax",
    detail: "In April 2024 a heat dome settled over South and Southeast Asia and did not move for three weeks. What that costs a global supply chain, quantified.",
    href: "https://climriskresearch.substack.com/p/the-supply-chain-tax",
  },
  {
    slug: "financial-anatomy-of-a-monsoon-deficit",
    tier: "case-study",
    kicker: "Physical Risk · South Asia · Agricultural Finance · August 2026",
    title: "The Financial Anatomy of a Monsoon Deficit",
    detail: "What happens to global markets when India's rain fails — a deep dive into agricultural credit exposure under a shifting monsoon.",
  },
  {
    slug: "the-productivity-tax",
    tier: "case-study",
    kicker: "Physical Risk · India",
    title: "The Productivity Tax",
    detail: "In May 2024, temperatures crossed 45°C simultaneously across Rajasthan, Uttar Pradesh, and Haryana. The labor-productivity cost of that heatwave, modelled.",
  },
  {
    slug: "financial-anatomy-of-a-super-el-nino",
    tier: "case-study",
    kicker: "Macro Risk",
    title: "The Financial Anatomy of a Super El Niño",
    detail: "What the physical parameters of a super El Niño tell investors — before the headlines catch up.",
  },
  {
    slug: "carlsberg-group-climate-risk",
    tier: "case-study",
    kicker: "Sector Deep Dive · Beverages",
    title: "Assessing Physical and Transition Climate Risk in Beverages: Carlsberg Group",
    detail: "A CRFM deep dive into water stress and carbon transition exposure across a global brewer's asset base.",
  },
  {
    slug: "kering-group-climate-risk",
    tier: "case-study",
    kicker: "Sector Deep Dive · Luxury Goods",
    title: "Assessing Physical and Transition Climate Risk in Luxury Goods: Kering Group",
    detail: "Physical and transition risk across a luxury goods supply chain, quantified asset by asset.",
  },
  {
    slug: "michelin-group-climate-risk",
    tier: "case-study",
    kicker: "Sector Deep Dive · Manufacturing",
    title: "Assessing Physical and Transition Climate Risk in Manufacturing: Michelin Group",
    detail: "A CRFM deep dive into physical and transition exposure across a global manufacturing footprint.",
  },
  {
    slug: "european-olive-oil-climate-risk",
    tier: "case-study",
    kicker: "Sector Deep Dive · Agriculture",
    title: "Assessing Physical and Transition Climate Risk in Agriculture: European Olive Oil Cooperatives",
    detail: "Physical risk quantification for one of Europe's most climate-exposed agricultural sectors.",
  },
  {
    slug: "dynamic-lca-iso14067-data-assurance",
    kicker: "Flagship Whitepaper",
    title: "Dynamic Life Cycle Assessments & ISO 14067 Data Assurance",
    detail: "How to build audit-ready LCAs that hold up under both ISO 14067 assurance and financial disclosure scrutiny.",
    tier: "flagship",
    status: "in-progress",
  },
  {
    slug: "ifrs-s2-readiness-checklist",
    kicker: "Regulatory & Compliance Brief",
    title: "IFRS S2 Readiness: A Practical Checklist for Reporting Teams",
    detail: "What a reporting team actually needs in place before first disclosure, beyond the standard's text.",
    tier: "regulatory",
    status: "in-progress",
  },
  {
    slug: "csrd-physical-risk-esrs",
    kicker: "Regulatory & Compliance Brief",
    title: "CSRD & Physical Risk: What the ESRS Actually Requires",
    detail: "Where the ESRS climate disclosures demand asset-level physical risk data, and where a narrative still passes.",
    tier: "regulatory",
    status: "in-progress",
  },
];
