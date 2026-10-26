// Starter list of ISO 19650-2 information management activities for the responsibility matrix.
// Rows are added without assignments; the team marks R/A/C/I per task team.
const s = (stage: string, items: string[]) => items.map((item) => ({ item, stage }));

export const RACI_STARTER = [
  ...s("Assessment & need (5.1)", ["Appoint individuals for the information management function", "Establish the project's information requirements", "Establish the project's information delivery milestones", "Establish the project's information standard", "Establish the project's information production methods and procedures", "Establish the project's reference information and shared resources", "Establish the project's common data environment", "Establish the project's information protocol"]),
  ...s("Invitation to tender (5.2)", ["Establish the appointing party's exchange information requirements", "Assemble reference information and shared resources", "Establish tender response requirements and evaluation criteria", "Compile invitation to tender information"]),
  ...s("Tender response (5.3)", ["Nominate individuals to undertake the information management function", "Establish the delivery team's (pre-appointment) BIM execution plan", "Assess each task team's capability and capacity", "Establish the delivery team's capability and capacity", "Establish the delivery team's proposed mobilization plan", "Establish the delivery team's risk register", "Compile the delivery team's tender response"]),
  ...s("Appointment (5.4)", ["Confirm the delivery team's BIM execution plan", "Establish the delivery team's detailed responsibility matrix", "Establish the lead appointed party's exchange information requirements", "Establish the task information delivery plans (TIDPs)", "Establish the master information delivery plan (MIDP)", "Complete the lead appointed party's appointment documents", "Complete appointed parties' appointment documents"]),
  ...s("Mobilization (5.5)", ["Mobilize resources", "Mobilize information technology", "Test the project's information production methods and procedures"]),
  ...s("Collaborative production (5.6)", ["Check availability of reference information and shared resources", "Generate information", "Complete quality assurance check", "Review information and approve for sharing", "Information model review"]),
  ...s("Information model delivery (5.7)", ["Submit information model for lead appointed party authorization", "Review and authorize the information model", "Submit information model for appointing party acceptance", "Review and accept the information model"]),
  ...s("Project close-out (5.8)", ["Archive the project information model", "Compile lessons learned for future projects"]),
  ...s("Operational phase (19650-3)", ["Update the asset information model", "Verify asset information against the AIR", "Manage access to the asset information model"]),
  ...s("Security (19650-5)", ["Carry out the security triage", "Establish the security management plan", "Manage security breaches and incidents"]),
];
