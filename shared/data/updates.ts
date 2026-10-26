// Curated timeline of editions relevant to the portal. Check the ISO catalogue for current status.
export interface Update { date: string; standard: string; title: string; note: string; link: string }

export const STANDARD_UPDATES: Update[] = [
  { date: "2018-12", standard: "ISO 19650-1 / -2", title: "Concepts and principles; delivery phase of assets", note: "First editions of the core information management parts.", link: "https://www.iso.org/search.html?q=ISO%2019650-1" },
  { date: "2020-08", standard: "ISO 19650-3", title: "Operational phase of assets", note: "Information management during operation (AIM).", link: "https://www.iso.org/search.html?q=ISO%2019650-3" },
  { date: "2020-06", standard: "ISO 19650-5", title: "Security-minded approach to information management", note: "Sensitivity assessment, security strategy and management plan.", link: "https://www.iso.org/search.html?q=ISO%2019650-5" },
  { date: "2022-08", standard: "ISO 19650-4", title: "Information exchange", note: "Process and criteria for information exchanges between parties.", link: "https://www.iso.org/search.html?q=ISO%2019650-4" },
  { date: "2025", standard: "ISO 19650-6", title: "Health and safety information", note: "Collaborative sharing and use of health and safety information.", link: "https://www.iso.org/search.html?q=ISO%2019650-6" },
  { date: "2024", standard: "ISO 7817-1", title: "Level of information need — concepts and principles", note: "International successor to EN 17412-1 for specifying LOIN.", link: "https://www.iso.org/search.html?q=ISO%207817-1" },
  { date: "2024", standard: "ISO 16739-1 (IFC 4.3)", title: "Industry Foundation Classes 4.3", note: "IFC 4.3 adds infrastructure domains (road, rail, bridge, ports).", link: "https://www.iso.org/search.html?q=ISO%2016739-1" },
  { date: "2023-12", standard: "ISO/IEC 42001", title: "AI management system — requirements", note: "First certifiable management system standard for AI.", link: "https://www.iso.org/search.html?q=ISO%2FIEC%2042001" },
  { date: "2025", standard: "ISO/IEC 42005", title: "AI system impact assessment", note: "Guidance on assessing impacts of AI systems on people and society.", link: "https://www.iso.org/search.html?q=ISO%2FIEC%2042005" },
];
