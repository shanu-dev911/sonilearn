export const allSubjectsByExam: { [key: string]: { subjects: string[] } } = {
    // SSC
    'SSC CGL': { subjects: ['Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'] },
    'SSC CHSL': { subjects: ['Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Language'] },
    'SSC GD Constable': { subjects: ['General Intelligence & Reasoning', 'General Knowledge & General Awareness', 'Elementary Mathematics', 'English/Hindi'] },
    'SSC MTS': { subjects: ['Numerical and Mathematical Ability', 'Reasoning Ability and Problem Solving', 'General Awareness', 'English Language and Comprehension'] },
    'SSC CPO': { subjects: ['General Intelligence & Reasoning', 'General Knowledge & General Awareness', 'Quantitative Aptitude', 'English Comprehension'] },
    'SSC JE': { subjects: ['General Intelligence & Reasoning', 'General Awareness', 'General Engineering'] },
    'SSC Stenographer': { subjects: ['General Intelligence & Reasoning', 'General Awareness', 'English Language and Comprehension'] },

    // Banking
    'IBPS PO': { subjects: ['Reasoning Ability', 'Quantitative Aptitude', 'English Language'] },
    'IBPS Clerk': { subjects: ['Reasoning Ability', 'Numerical Ability', 'English Language'] },
    'IBPS RRB': { subjects: ['Reasoning', 'Numerical Ability'] },
    'SBI PO': { subjects: ['Reasoning Ability', 'Quantitative Aptitude', 'English Language'] },
    'SBI Clerk': { subjects: ['Reasoning Ability', 'Numerical Ability', 'English Language'] },
    'RBI Assistant': { subjects: ['Reasoning', 'Numerical Ability', 'English Language'] },
    'RBI Grade B': { subjects: ['General Awareness', 'Reasoning', 'English Language', 'Quantitative Aptitude'] },

    // Railways
    'Railway NTPC': { subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness'] },
    'Railway Group D': { subjects: ['General Science', 'Mathematics', 'General Intelligence & Reasoning', 'General Awareness & Current Affairs'] },
    'Railway JE': { subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', 'Technical Abilities'] },
    'Railway ALP': { subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Science', 'General Awareness on Current Affairs'] },
    'Railway Technician': { subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Science', 'General Awareness & Current Affairs'] },

    // Defence
    'NDA': { subjects: ['Mathematics', 'General Ability Test'] },
    'CDS': { subjects: ['English', 'General Knowledge', 'Elementary Mathematics'] },
    'AFCAT': { subjects: ['General Awareness', 'Verbal Ability in English', 'Numerical Ability & Reasoning', 'Military Aptitude Test'] },
    'Agniveer Vayu (Airforce)': { subjects: ['English', 'Reasoning & General Awareness (RAGA)', 'Physics', 'Mathematics'] },
    'Agniveer SSR/MR (Navy)': { subjects: ['Science', 'Mathematics', 'English', 'General Awareness'] },
    'Agniveer Army': { subjects: ['General Knowledge', 'General Science', 'Maths', 'Logical Reasoning'] },

    // Police
    'CAPF (AC)': { subjects: ['General Ability and Intelligence', 'General Studies, Essay and Comprehension'] },
    'BSF Tradesman': { subjects: ['General Awareness', 'General Knowledge', 'Elementary Mathematics', 'Analytical Aptitude', 'Hindi/English Language'] },
    'CRPF Constable': { subjects: ['General Intelligence & Reasoning', 'General Knowledge & General Awareness', 'Elementary Mathematics', 'English/Hindi'] },
    'CISF Constable': { subjects: ['General Intelligence & Reasoning', 'General Knowledge & General Awareness', 'Elementary Mathematics', 'English/Hindi'] },
    'ITBP Constable': { subjects: ['General Intelligence & Reasoning', 'General Knowledge', 'Elementary Mathematics', 'English/Hindi'] },

    // Teaching
    'CTET': { subjects: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'] },
    'KVS Teacher': { subjects: ['General English', 'General Hindi', 'General Awareness & Current Affairs', 'Reasoning Ability', 'Computer Literacy', 'Perspectives on Education and Leadership'] },
    'NVS Teacher': { subjects: ['Reasoning Ability', 'General Awareness', 'Knowledge of ICT', 'Teaching Aptitude', 'Subject Knowledge'] },
    'State TET': { subjects: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'] },

    // UPSC & Others
    'UPSC Civil Services (IAS)': { subjects: ['Indian History', 'Geography', 'Indian Polity', 'Economics', 'General Science', 'Current Affairs', 'CSAT'] },
    'UPSC EPFO': { subjects: ['General English', 'Indian Freedom Struggle', 'Current Events', 'Indian Polity & Economy', 'General Accounting Principles', 'Industrial Relations & Labour Laws', 'General Science', 'General Mental Ability', 'Social Security in India'] },
    'UPSC ESIC': { subjects: ['General English', 'General Awareness', 'Quantitative Aptitude', 'Reasoning'] },
    'ISRO Assistant': { subjects: ['General English', 'Quantitative Aptitude', 'General Intelligence & Reasoning', 'General Knowledge'] },
    'DRDO MTS': { subjects: ['Quantitative Aptitude', 'General Awareness', 'Reasoning Ability'] },
    'LIC AAO': { subjects: ['Reasoning Ability', 'Quantitative Aptitude', 'English Language', 'General Knowledge & Current Affairs'] },
    'FCI Manager': { subjects: ['English Language', 'Reasoning Ability', 'Numerical Aptitude', 'General Studies'] },

    // State Exams
    'BPSC': { subjects: ['General Studies', 'History of Bihar', 'Geography', 'Indian Polity', 'Indian Economy', 'General Science', 'Current Affairs', 'Aptitude & Reasoning'] },
    'BSSC (Inter Level)': { subjects: ['General Studies', 'General Science and Math', 'Reasoning Ability'] },
    'Bihar Police/Daroga': { subjects: ['Hindi', 'English', 'Math', 'Social Science', 'General Science', 'Current Affairs'] },
    'Bihar Teacher (TRE)': { subjects: ['General Studies', 'Subject Specific'] },
    'Bihar STET/BTET': { subjects: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Subject Specific'] },
    'Nagar Nigam Exams': { subjects: ['General Studies', 'General Aptitude', 'Language'] },

    'UPPSC': { subjects: ['General Studies', 'CSAT', 'Hindi', 'Essay'] },
    'UPSSSC (PET)': { subjects: ['Indian History', 'Indian National Movement', 'Geography', 'Indian Economy', 'Indian Constitution', 'General Science', 'Elementary Arithmetic', 'General Hindi', 'General English', 'Reasoning', 'Current Affairs', 'General Awareness'] },
    'UP Police Constable/SI': { subjects: ['General Knowledge', 'General Hindi', 'Numerical & Mental Ability', 'Mental Aptitude, IQ and Reasoning Ability'] },
    'UP Super TET': { subjects: ['Language (Hindi, English, Sanskrit)', 'Science', 'Math', 'Environment & Social Study', 'Teaching Methodology', 'Child Psychology'] },
    'UP Lekhpal': { subjects: ['General Hindi', 'Maths', 'General Knowledge', 'Rural Development and Rural Society'] },
    'Nagar Palika Parishad': { subjects: ['General Studies', 'General Aptitude', 'Language'] },


    'JPSC': { subjects: ['General Studies Paper I', 'General Studies Paper II (Jharkhand Specific)'] },
    'JSSC (CGL)': { subjects: ['Language Paper', 'Tribal and Regional Language', 'General Studies', 'General Science', 'General Math', 'Reasoning', 'Computer Knowledge', 'Jharkhand Specific'] },
    'Jharkhand Police': { subjects: ['General Knowledge', 'Numerical Ability', 'Reasoning', 'Hindi'] },
    'JTET': { subjects: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies', 'Subject Specific'] },
    'Municipal Service (JMSCCE)': { subjects: ['Language', 'Regional/Tribal Language', 'Technical and Specific Subjects', 'General Studies'] },
    
    'MPPSC': { subjects: ['General Studies', 'CSAT', 'History', 'Geography', 'Polity', 'Economy'] },
    'MP PEB (Vyapam)': { subjects: ['General Knowledge', 'General Hindi', 'General English', 'General Mathematics', 'General Reasoning Ability', 'General Science', 'Computer Knowledge'] },
    'MP Police': { subjects: ['General Knowledge and Reasoning', 'Intellectual Ability and Mental Aptitude', 'Science and Simple Arithmetic'] },
    'MP TET (Varg 1, 2, 3)': { subjects: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'] },
    'Nagar Nigam Bharti': { subjects: ['General Knowledge', 'Current Affairs', 'MP GK', 'Hindi', 'English', 'Computer'] },

    'RAS': { subjects: ['General Knowledge & General Science', 'Current Affairs', 'General Studies I, II, III', 'General Hindi and General English'] },
    'REET': { subjects: ['Child Development & Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'] },
    'Rajasthan Police': { subjects: ['Reasoning, Logic and Basic Knowledge of Computers', 'General Knowledge, General Science, Social Science and Current Affairs', 'Knowledge of laws & provisions related to crimes against women & children', 'Rajasthan GK'] },
    'CET': { subjects: ['General Science', 'Reasoning & Mental Ability', 'General Hindi', 'General English', 'Computer knowledge', 'Current affairs', 'Rajasthan GK'] },
    'Patwari': { subjects: ['General Science', 'History, Polity and Geography of India', 'General English & Hindi', 'Mental ability and Reasoning, Basic Numerical efficiency', 'Basic Computer'] }, // Example for Rajasthan
    'LDC': { subjects: ['General Knowledge', 'Everyday Science', 'Mathematics', 'General Hindi and English'] },


    'WBCS': { subjects: ['English Composition', 'Bengali/Hindi/Urdu/Nepali/Santali Composition', 'General Studies I', 'General Studies II', 'Constitution of India and Indian Economy', 'Arithmetic and Test of Reasoning', 'Optional Subject'] },
    'WB Police': { subjects: ['General Awareness & General Knowledge', 'English', 'Elementary Mathematics', 'Reasoning & Logical Analysis'] },
    'WBPSC Clerkship': { subjects: ['English', 'General Studies', 'Arithmetic'] },
    'Municipal Service Commission': { subjects: ['General Studies', 'Current Affairs', 'English', 'Arithmetic'] },

    'DSSSB (Teaching & Non-Teaching)': { subjects: ['General Awareness', 'General Intelligence & Reasoning Ability', 'Arithmetical & Numerical Ability', 'Hindi Language & Comprehension', 'English Language & Comprehension', 'Subject/Post specific'] },
};
