export const DEFAULT_SUBJECTS = [
  "General Awareness",
  "Reasoning",
  "Mathematics",
];

export const EXAM_HARD_SUBJECTS: Record<string, [string, string]> = {
  "SSC CGL": ["Quantitative Aptitude", "English Comprehension"],
  "SSC CHSL": ["Quantitative Aptitude", "English Comprehension"],
  "SSC MTS": ["Numerical & Mathematical Ability", "Reasoning Ability"],
  "SSC GD": ["Elementary Mathematics", "General Intelligence & Reasoning"],
  "SSC CPO": ["Quantitative Aptitude", "English Comprehension"],
  "SSC Stenographer": ["General Awareness", "General Intelligence & Reasoning"],
  "SSC JE": ["General Engineering", "General Intelligence & Reasoning"],
  "RRB NTPC": ["Mathematics", "General Science"],
  "RRB Group D": ["Mathematics", "General Science"],
  "RRB ALP": ["Basic Science & Engineering", "Mathematics"],
  "RRB Technician": ["Mathematics", "General Science"],
  "RRB JE": ["Technical Abilities", "General Science"],
  "RRB SSE": ["Technical Abilities", "General Science"],
  "RRB Paramedical": ["Professional Ability", "General Science"],
  "RRB Ministerial & Isolated": ["Professional Ability", "General Intelligence & Reasoning"],
  "RRB Apprentice": ["Trade Theory", "Mathematics"],
};

export const EXAM_WARRIOR_SUBJECTS: Record<string, [string, string]> = {
  "RRB Group D": ["General Science", "Mathematics"],
  "RRB Apprentice": ["General Science", "Professional Ability"],
  "RRB JE": ["General Science", "Technical Ability"],
  "RRB NTPC": ["Mathematics", "General Science"],
  "RRB ALP": ["Basic Science & Engineering", "Mathematics"],
  "RRB Technician": ["Mathematics", "General Science"],
  "RRB SSE": ["Technical Ability", "General Science"],
  "RRB Paramedical": ["Professional Ability", "General Science"],
  "RRB Ministerial & Isolated": ["Professional Ability", "General Intelligence & Reasoning"],
  "SSC CGL": ["Mathematics", "English Comprehension"],
  "SSC CHSL": ["Mathematics", "English Comprehension"],
  "SSC MTS": ["Numerical & Mathematical Ability", "Reasoning Ability"],
  "SSC GD": ["Mathematics", "General Intelligence & Reasoning"],
  "SSC CPO": ["Quantitative Aptitude", "English Comprehension"],
  "SSC Stenographer": ["General Awareness", "General Intelligence & Reasoning"],
  "SSC JE": ["General Engineering", "General Intelligence & Reasoning"],
};

export const EXAM_SUBJECTS: Record<string, string[]> = {
  "RRB Ministerial & Isolated": [
    "General Awareness",
    "General Intelligence & Reasoning",
    "Mathematics",
    "Professional Ability",
  ],
};

export const WARRIOR_CORE_SUBJECTS: Record<string, string[]> = {
  ...Object.fromEntries(
    Object.entries(EXAM_HARD_SUBJECTS).map(([exam, subjects]) => [exam, subjects])
  ),
};

export function getSubjectsForExam(exam: string, discoveredSubjects: string[]) {
  const configuredSubjects = EXAM_SUBJECTS[exam.trim()];
  if (configuredSubjects) return configuredSubjects;
  return discoveredSubjects.length > 0 ? discoveredSubjects : DEFAULT_SUBJECTS;
}
