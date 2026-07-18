export type Skill = "Python" | "SQL" | "Power BI" | "Cloud";
export type ProjectStatus = "Published" | "In progress" | "In development" | "Live system";

export type Project = {
  id: string;
  number: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  briefing: string;
  evidence: string;
  skills: Skill[];
  tools: string[];
  repository: string;
  featured?: boolean;
};

export const siteConfig = {
  name: "Brishav Rajbahak",
  initials: "BR",
  eyebrow: "Data Analyst & Data Science Aspirant",
  headline: "Turning Data Into Cinematic Stories.",
  description:
    "I clean, explore, and explain data through Python, SQL, dashboards, and practical forecasting workflows—turning raw numbers into evidence people can act on.",
  location: "Kathmandu, Nepal",
  availability: "Open to internships and entry-level data or BI roles",
  email: "contact@brishavrajbahak.com.np",
  canonicalUrl: "https://brishavrajbahak.com.np",
  github: "https://github.com/brishavrajbahak",
  linkedin: "https://www.linkedin.com/in/brishav-rajbahak-854a30342",
  instagram: "https://www.instagram.com/razzbahakbrishav"
} as const;

export const skills: Array<{ name: Skill; note: string }> = [
  { name: "Python", note: "Cleaning, exploration, modeling" },
  { name: "SQL", note: "Queries, joins, analytical structure" },
  { name: "Power BI", note: "Dashboards and decision stories" },
  { name: "Cloud", note: "Pages, Functions, secure delivery" }
];

export const projects: Project[] = [
  {
    id: "loan-default-analysis",
    number: "01",
    title: "Loan Default Analysis",
    status: "Published",
    summary: "A borrower-risk analysis shaped into a reproducible reporting workflow.",
    briefing:
      "The published project uses Python, Pandas, SQL, SQLite, and Power BI to move from borrower records to segmentation and dashboard-ready risk reporting.",
    evidence:
      "Published repository evidence reports a measured final-outcome default rate of 19.98%.",
    skills: ["Python", "SQL", "Power BI"],
    tools: ["Pandas", "SQLite", "Jupyter", "Power BI"],
    repository: "https://github.com/brishavrajbahak/loan-default-analysis",
    featured: true
  },
  {
    id: "financial-inclusion-gap-analysis",
    number: "02",
    title: "Financial Inclusion Gap Analysis",
    status: "In progress",
    summary: "An evidence-led investigation into underserved segments and access disparity.",
    briefing:
      "The current repository frames an analytics workflow for comparing access, trust, and reporting gaps without presenting unfinished findings as final results.",
    evidence: "Public work in progress; conclusions remain provisional until the analysis is complete.",
    skills: ["Python", "SQL", "Power BI"],
    tools: ["Pandas", "SQL", "Power BI", "Gap analysis"],
    repository: "https://github.com/brishavrajbahak/financial-inclusion-gap-analysis"
  },
  {
    id: "loan-default-prediction",
    number: "03",
    title: "Loan Default Prediction",
    status: "In development",
    summary: "A reserved project space for future predictive risk work.",
    briefing:
      "This repository is currently empty. No model, metric, feature set, or delivery claim is presented until published work exists.",
    evidence: "In development—no results claimed.",
    skills: ["Python", "SQL"],
    tools: ["Planned: Python", "Planned: SQL"],
    repository: "https://github.com/brishavrajbahak/loan-default-prediction"
  },
  {
    id: "himalayan-observatory",
    number: "04",
    title: "Himalayan Data Observatory",
    status: "Live system",
    summary: "The portfolio itself: static-first storytelling with protected edge endpoints.",
    briefing:
      "A Cloudflare Pages frontend connected to Pages Functions, Turnstile, email delivery, analytics events, and a Durable Object rate limiter while preserving a static deployment model.",
    evidence: "Published source and production deployment are available through this portfolio repository.",
    skills: ["Cloud", "SQL", "Python"],
    tools: ["Cloudflare Pages", "Pages Functions", "Turnstile", "Durable Objects"],
    repository: "https://github.com/brishavrajbahak/brishav"
  }
];

export const pipeline = [
  { step: "Ingest", note: "Bring the source into a traceable workspace." },
  { step: "Cleanse", note: "Resolve types, gaps, duplicates, and noise." },
  { step: "Explore", note: "Ask focused questions and test patterns." },
  { step: "Model", note: "Use the simplest method the question needs." },
  { step: "Visualize", note: "Make comparison and change easy to see." },
  { step: "Impact", note: "Connect the signal to a useful decision." }
] as const;

export const journey = [
  {
    year: "Foundation",
    label: "Education",
    copy: "Built grounding in computer science, data structures, statistics, and evidence-led reporting."
  },
  {
    year: "Practice",
    label: "Applied Projects",
    copy: "Turned coursework and datasets into repeatable Python and SQL analysis workflows."
  },
  {
    year: "Communication",
    label: "BI Storytelling",
    copy: "Focused on dashboard structure, decision context, and explaining findings without visual noise."
  },
  {
    year: "Now",
    label: "Dataverse Launch",
    copy: "Connected published work, interactive demos, and a production-ready portfolio frontend."
  }
] as const;

export const insights = [
  {
    id: "tourism",
    label: "Tourism signal",
    title: "Stay length and occupancy tell more than arrival volume alone.",
    challenge: "Arrival counts can look healthy while hiding whether local economic value is improving.",
    insight:
      "The demo becomes more useful when arrivals, stay length, visitor spend, and occupancy are read together.",
    lesson: "The strongest KPI is often the relationship between measures, not the loudest single number."
  },
  {
    id: "loan-risk",
    label: "Risk signal",
    title: "Default pressure often appears before default is formally recorded.",
    challenge: "Outcome-only reporting can surface risk after the useful intervention window has narrowed.",
    insight:
      "Delinquency and segment patterns are more useful when treated as early signals, not only as explanations after default.",
    lesson: "A decision metric earns its value by arriving before the headline result."
  },
  {
    id: "remittance",
    label: "Resilience signal",
    title: "Transfer strength can still hide fragile channel quality.",
    challenge: "Higher transfer values may look positive while formal-channel reliability remains uneven.",
    insight:
      "Household dependence and formal-channel use need to be compared together to reveal where resilience is weakest.",
    lesson: "System quality matters as much as the volume moving through it."
  }
] as const;

export const navigation = [
  { id: "home", label: "Home" },
  { id: "method", label: "Method" },
  { id: "projects", label: "Projects" },
  { id: "laboratory", label: "Lab" },
  { id: "journey", label: "Journey" },
  { id: "insights", label: "Insights" },
  { id: "contact", label: "Contact" }
] as const;

export const resumeUrl = process.env.NEXT_PUBLIC_RESUME_URL?.trim() || null;
