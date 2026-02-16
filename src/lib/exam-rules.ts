
export interface ExamRule {
  timer: number; // in minutes
  negativeMark: number;
  marksPerQuestion: number;
}

export const examRules: { [key: string]: ExamRule } = {
  // SSC Exams as per user request
  'SSC CGL': { timer: 60, negativeMark: 0.50, marksPerQuestion: 2 },
  'SSC CHSL': { timer: 60, negativeMark: 0.50, marksPerQuestion: 2 },
  'SSC GD Constable': { timer: 60, negativeMark: 0.25, marksPerQuestion: 2 }, // Modern pattern is 60 mins.
  'SSC MTS': { timer: 90, negativeMark: 1, marksPerQuestion: 3 }, // Session 2 has 1 mark negative marking.
  
  // Railway Exams as per user request
  'Railway Group D': { timer: 90, negativeMark: 1/3, marksPerQuestion: 1 },
  'Railway NTPC': { timer: 90, negativeMark: 1/3, marksPerQuestion: 1 },

  // Other common exams for completeness
  'SSC CPO': { timer: 120, negativeMark: 0.25, marksPerQuestion: 1 },
  'SSC JE': { timer: 120, negativeMark: 0.25, marksPerQuestion: 1 },
  'UP Police Constable/SI': { timer: 120, negativeMark: 0.5, marksPerQuestion: 2 },
  'BPSC': { timer: 120, negativeMark: 1/3, marksPerQuestion: 1 },
  'JSSC CGL': { timer: 120, negativeMark: 1/3, marksPerQuestion: 3 },
};

// A default rule for any exam not explicitly listed
export const defaultExamRule: ExamRule = {
  timer: 60,
  negativeMark: 0.25,
  marksPerQuestion: 1,
};
