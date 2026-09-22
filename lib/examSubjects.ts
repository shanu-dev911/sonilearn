export const DEFAULT_SUBJECTS = [
  "General Awareness",
  "Reasoning",
  "Mathematics",
];

export const EXAM_SUBJECTS: Record<string, string[]> = {
  "RRB Ministerial & Isolated": [
    "General Awareness",
    "General Intelligence & Reasoning",
    "Mathematics",
    "Professional Ability",
  ],
};

export const WARRIOR_CORE_SUBJECTS: Record<string, string[]> = {
  "RRB Ministerial & Isolated": [
    "Professional Ability",
    "General Intelligence & Reasoning",
  ],
};

export function getSubjectsForExam(exam: string, discoveredSubjects: string[]) {
  const configuredSubjects = EXAM_SUBJECTS[exam.trim()];
  if (configuredSubjects) return configuredSubjects;
  return discoveredSubjects.length > 0 ? discoveredSubjects : DEFAULT_SUBJECTS;
}
