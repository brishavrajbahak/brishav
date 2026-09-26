export type Skill = "Python" | "SQL" | "Power BI" | "Cloud";
export type ProjectStatus = "Published" | "In progress" | "In development" | "Live system";

export type ProofMetric = {
  label: string;
  value: string;
  note: string;
};

export type ProjectMethodology = {
  source: string;
  dateRange: string;
  cohort: string;
  rawRows?: number;
  cleanedRows?: number;
  finalOutcomeRows?: number;
  badOutcomes?: number;
  goodOutcomes?: number;
  excludedRows?: number;
  numerator?: number;
  denominator?: number;
  exclusionReason?: string;
};

export type ProjectProof = {
  businessImpact: string[];
  delivered: string[];
  methodology: ProjectMethodology;
  metrics: ProofMetric[];
  dashboardPath?: string;
  correctionNote?: string;
};

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
  liveUrl?: string;
  liveLabel?: string;
  featured?: boolean;
  proof: ProjectProof;
};

export const heroCandidates = [
  "I build data projects, then make the next version better.",
  "I want the work to look good. I need the numbers to hold up.",
  "Pretty dashboards are easy. Trustworthy numbers take more work."
] as const;

export const siteConfig = {
  name: "Brishav Rajbahak",
  initials: "BR",
  eyebrow: "Data analyst in progress",
  headline: heroCandidates[1],
  description:
    "An undergraduate student in Nepal, learning how to make sense of real datasets and the decisions behind them.",
  location: "Kathmandu, Nepal",
  availability: "Open to internships and entry-level data or BI roles",
  email: "contact@brishavrajbahak.com.np",
  canonicalUrl: "https://brishavrajbahak.com.np",
  previewUrl: "https://v5.brishavrajbahak.com.np",
  github: "https://github.com/brishavrajbahak",
  linkedin: "https://www.linkedin.com/in/brishav-rajbahak-854a30342",
  instagram: "https://www.instagram.com/razzbahakbrishav"
} as const;

export const personalStory = {
  about:
    "It's me Brishav Rajbahak. Currently an undergraduate student learning new things and tools which i feel fascinating . i relate myself to the tech-enthuiast and wanna build cool things which not only exists but resonates well to the make an earth better place",
  rule:
    "being better than yesterday . just iterating the level even if its a word or an entire dictionary",
  reflection:
    "always wanting best and supreme level of things i build . wanting to make things look preety as preety as the system works. progress is always > perfection , perfection has no limit and cant be achived",
  approvedPhotos: (process.env.NEXT_PUBLIC_PERSONAL_PHOTO || "")
    .split(",")
    .map((photo) => photo.trim())
    .filter(Boolean)
} as const;

export const interfaceCopy = {
  loadingDashboard: "The dashboard is ready when you want to load it.",
  emptyProjects: "Nothing matches this filter yet.",
  contact: {
    missingName: "What should I call you?",
    invalidEmail: "That email address does not look complete.",
    shortMessage: "Give me a little more detail so I can reply properly.",
    verification: "Please complete the verification before sending.",
    failure: "I couldn't send this. Your message is still here—try again."
  }
} as const;

export const skills: Array<{ name: Skill; note: string }> = [
  { name: "Python", note: "Cleaning and analysis" },
  { name: "SQL", note: "Queries and data structure" },
  { name: "Power BI", note: "Dashboards and reporting" },
  { name: "Cloud", note: "Pages, Functions and delivery" }
];

export const projects: Project[] = [
  {
    id: "loan-default-analysis",
    number: "01",
    title: "Loan Default Analysis",
    status: "Published",
    summary: "A Lending Club analysis where the denominator mattered as much as the chart.",
    briefing:
      "Python, SQL and Power BI move 2.26 million accepted-loan records into a final-outcome cohort that can be checked and reproduced.",
    evidence: "The published final-outcome default rate is 19.98%.",
    skills: ["Python", "SQL", "Power BI"],
    tools: ["Pandas", "SQLite", "Jupyter", "Power BI"],
    repository: "https://github.com/brishavrajbahak/loan-default-analysis",
    featured: true,
    proof: {
      businessImpact: [
        "Separates completed outcomes from active loans before measuring default.",
        "Shows where grade, term and purpose carry different risk levels."
      ],
      delivered: [
        "A reproducible Python and SQL cleaning workflow.",
        "A two-page Power BI report covering the overview and risk segments."
      ],
      methodology: {
        source: "Lending Club accepted loans",
        dateRange: "2007–2018",
        cohort: "1,348,099 loans with a final repayment or default outcome",
        rawRows: 2260701,
        cleanedRows: 2260668,
        finalOutcomeRows: 1348099,
        badOutcomes: 269360,
        goodOutcomes: 1078739,
        excludedRows: 912569,
        numerator: 269360,
        denominator: 1348099,
        exclusionReason:
          "912,569 loans were still current, late or in a grace period, so they did not yet have a final outcome."
      },
      metrics: [
        { label: "Final-outcome default rate", value: "19.98%", note: "269,360 / 1,348,099" },
        { label: "Grade A", value: "6.04%", note: "Published segment rate" },
        { label: "Grade G", value: "49.67%", note: "Published segment rate" },
        { label: "60-month term", value: "32.45%", note: "Compared with 16.02% for 36 months" }
      ],
      dashboardPath: "/dashboard/loan-default/",
      correctionNote:
        "While checking the loan-status values, I noticed Current, Late and In Grace Period sitting beside loans that had actually finished. Those loans did not have a final outcome yet. I removed them from the denominator and recalculated the rate using loans that had ended."
    }
  },
  {
    id: "financial-inclusion-gap-analysis",
    number: "02",
    title: "Financial Inclusion Gap Analysis",
    status: "Published",
    summary: "A completed comparison of Nepal's financial access gaps across account ownership and digital finance.",
    briefing:
      "Python, SQL and Power BI turn Global Findex country-year observations into a finished analysis of Nepal against South Asia, lower-middle-income and global benchmarks.",
    evidence: "The public repository includes final findings, SQL analysis and a three-page Power BI dashboard.",
    skills: ["Python", "SQL", "Power BI"],
    tools: ["Pandas", "SQL", "Power BI"],
    repository: "https://github.com/brishavrajbahak/financial-inclusion-gap-analysis",
    proof: {
      businessImpact: [
        "Makes Nepal's account-ownership and digital-access gaps comparable with South Asia, lower-middle-income and world benchmarks.",
        "Surfaces the population groups that still lag in the published comparison, including women, poorer groups and older adults in 2024 digital access."
      ],
      delivered: [
        "A cleaned, analysis-ready Global Findex dataset and documented Python and SQL workflow.",
        "Three Power BI report pages: Executive Overview, Nepal Account Gaps and 2024 Digital Access."
      ],
      methodology: {
        source: "World Bank Global Findex Database",
        dateRange: "2011–2024; 2022 is an off-cycle survey covering 16 countries",
        cohort: "8,577 aggregated country-year-population-segment observations; 18 analysis-ready indicators"
      },
      metrics: [
        { label: "Source observations", value: "8,577", note: "World Bank Global Findex country-year-population-segment observations" },
        { label: "Analysis-ready indicators", value: "18", note: "Account ownership, financial institution access, mobile money, digital payments and inactive accounts" },
        { label: "Dashboard report pages", value: "3", note: "Executive Overview, Nepal Account Gaps and 2024 Digital Access" }
      ]
    }
  },
  {
    id: "loan-default-prediction",
    number: "03",
    title: "Loan Default Prediction",
    status: "Published",
    summary: "An explainable loan-risk predictor that uses only information available when the loan is issued.",
    briefing:
      "A time-based Lending Club model is trained on completed outcomes, checked for leakage and deployed as a Streamlit interface for educational risk exploration.",
    evidence: "The published repository documents validation, test evaluation, error analysis and a working Streamlit predictor.",
    skills: ["Python", "SQL", "Cloud"],
    tools: ["Python", "scikit-learn", "PostgreSQL", "Streamlit"],
    repository: "https://github.com/brishavrajbahak/loan-default-prediction",
    liveUrl: "https://brishav-loan-default-prediction.streamlit.app/",
    liveLabel: "Open live predictor",
    proof: {
      businessImpact: [
        "Shows how origination-time loan details can be used to estimate historical bad-outcome risk without using post-loan information.",
        "Makes the model's limits explicit: it is an educational, retrospective analysis and not a lending or credit-approval system."
      ],
      delivered: [
        "A leakage-audited, time-based model comparison and 2018 holdout evaluation.",
        "A live Streamlit predictor with dependent grade and sub-grade controls, responsible-use guidance and an estimated bad-outcome probability."
      ],
      methodology: {
        source: "Cleaned Lending Club completed-loan dataset",
        dateRange: "Training 2007–2015 / validation 2016–2017 / final test 2018",
        cohort: "1,348,099 completed-loan outcomes; unresolved loans excluded before modelling"
      },
      metrics: [
        { label: "2018 test ROC-AUC", value: "0.6912", note: "Random forest on the untouched 2018 test set" },
        { label: "2018 test recall", value: "66.45%", note: "Random forest bad-outcome recall" },
        { label: "Completed-loan rows", value: "1,348,099", note: "Loans with a known final outcome" }
      ]
    }
  },
  {
    id: "himalayan-observatory",
    number: "04",
    title: "Portfolio Platform",
    status: "Live system",
    summary: "This portfolio, built as a static-first frontend with protected edge functions.",
    briefing:
      "The frontend is exported statically while contact, analysis and rate limiting remain behind Cloudflare Pages Functions and a Durable Object.",
    evidence: "The source and deployed system are public.",
    skills: ["Cloud", "SQL", "Python"],
    tools: ["Cloudflare Pages", "Pages Functions", "Turnstile", "Durable Objects"],
    repository: "https://github.com/brishavrajbahak/brishav",
    proof: {
      businessImpact: ["Gives reviewers one place to inspect projects, methods and working interfaces."],
      delivered: ["A static frontend, protected contact route and interactive dataset endpoints."],
      methodology: {
        source: "Public portfolio repository",
        dateRange: "Current release",
        cohort: "Frontend and edge-function architecture"
      },
      metrics: []
    }
  }
];

export const pipeline = [
  { step: "Raw records", label: "Ingest", note: "2,260,701 accepted-loan rows enter the workspace." },
  { step: "Clean columns", label: "Cleanse", note: "Types are repaired and 33 footer rows are removed." },
  { step: "Outcome cohort", label: "Explore", note: "Only loans with a finished outcome enter the rate." },
  { step: "Risk comparison", label: "Model", note: "Grade, term and purpose are compared before adding complexity." },
  { step: "Dashboard", label: "Visualize", note: "The result becomes a report that can be inspected." },
  { step: "19.98%", label: "Impact", note: "The published KPI keeps its numerator and denominator visible." }
] as const;

export const journey = [
  { year: "Foundation", label: "Education", copy: "Computer science, statistics and the habit of checking the source." },
  { year: "Practice", label: "Applied Projects", copy: "Python and SQL work built from real datasets rather than polished mockups." },
  { year: "Communication", label: "BI Storytelling", copy: "Dashboards shaped around questions, definitions and the person reading them." },
  { year: "Now", label: "Dataverse Launch", copy: "Published projects and a frontend that keeps changing as the work improves." }
] as const;

export const insights = [
  {
    id: "tourism",
    label: "Tourism note",
    title: "Arrival volume is not the whole visit.",
    challenge: "Arrival counts can hide whether stay length and local value changed.",
    insight: "Read arrivals beside stay length, spend and occupancy.",
    lesson: "Related measures usually explain more than one headline number."
  },
  {
    id: "loan-risk",
    label: "Loan-risk note",
    title: "A default rate starts with an outcome definition.",
    challenge: "Current loans cannot be treated as completed repayments.",
    insight: "Keep unresolved loans outside a final-outcome denominator.",
    lesson: "The cohort definition belongs beside the result."
  },
  {
    id: "remittance",
    label: "Remittance note",
    title: "Transfer volume can hide channel quality.",
    challenge: "A rising total does not guarantee reliable formal access.",
    insight: "Compare household dependence with the channel used.",
    lesson: "The route matters as much as the amount."
  }
] as const;

export const navigation = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "process", label: "Process" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" }
] as const;

export const resumeUrl = process.env.NEXT_PUBLIC_RESUME_URL?.trim() || null;
