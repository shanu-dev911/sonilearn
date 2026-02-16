
export interface ExamBlueprint {
  distribution: { subject: string; count: number }[];
  totalQuestions: number;
}

export const examBlueprints: { [key: string]: ExamBlueprint } = {
  'SSC CGL': {
    totalQuestions: 100,
    distribution: [
      { subject: 'Quantitative Aptitude', count: 25 },
      { subject: 'Reasoning', count: 25 },
      { subject: 'General Awareness', count: 25 },
      { subject: 'English Comprehension', count: 25 },
    ],
  },
  'SSC CHSL': {
    totalQuestions: 100,
    distribution: [
        { subject: 'English Language', count: 30 },
        { subject: 'Reasoning', count: 30 },
        { subject: 'Quantitative Aptitude', count: 20 },
        { subject: 'General Awareness', count: 20 },
    ],
  },
  'Railway Group D': {
    totalQuestions: 100,
    distribution: [
      { subject: 'General Science', count: 40 },
      { subject: 'Mathematics', count: 25 },
      { subject: 'General Intelligence & Reasoning', count: 25 },
      { subject: 'General Awareness & Current Affairs', count: 10 },
    ],
  },
};
