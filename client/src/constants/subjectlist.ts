export const subjects = [
  "History",
  "Political Science",
  "Sociology",
  "Psychology",
  "Philosophy",
  "Literature",
  "Linguistics",
  "Anthropology",
  "Fine Arts",
  "Performing Arts (Music, Dance, Theatre)",
  "Archaeology",
  "Cultural Studies",
  "Gender Studies",
  "Journalism & Mass Communication",
  "Public Administration",
  "Accounting",
  "Finance",
  "Economics",
  "Business Administration",
  "Human Resource Management",
  "Marketing",
  "Entrepreneurship",
  "International Business",
  "Supply Chain Management",
  "Banking & Insurance",
  "Taxation",
  "E-Commerce",
  "Corporate Law",
  "Advertising & Public Relations",
  "Hospitality & Tourism Management",
  "Algorithms",
  "Data Structures",
  "Operating Systems",
  "Computer Architecture",
  "Compiler Design",
  "Theory of Computation",
  "Distributed Systems",
  "Parallel Computing",
  "Database Management Systems (DBMS)",
  "Information Systems",
  "Software Engineering",
  "Software Testing & Quality Assurance",
  "Programming Languages",
  "Web Development",
  "Mobile Application Development",
  "Human-Computer Interaction (HCI)",
  "DevOps & Continuous Integration",
  "Agile Methodologies",
  "Version Control Systems (e.g., Git)",
  "Software Project Management",
  "Data Science",
  "Big Data Analytics",
  "Machine Learning",
  "Deep Learning",
  "Artificial Intelligence",
  "Natural Language Processing (NLP)",
  "Computer Vision",
  "Reinforcement Learning",
  "Data Mining",
  "Knowledge Representation & Reasoning",
  "Computer Networks",
  "Wireless Networks",
  "Cloud Computing",
  "Edge Computing",
  "Internet of Things (IoT)",
  "Blockchain Technology",
  "Cryptography",
  "Cybersecurity",
  "Ethical Hacking",
  "Network Security",
  "Quantum Computing",
  "Augmented Reality (AR)",
  "Virtual Reality (VR)",
  "Mixed Reality (MR)",
  "Robotics & Autonomous Systems",
  "Computational Linguistics",
  "Bioinformatics & Computational Biology",
  "Cognitive Computing",
  "Explainable AI (XAI)",
  "Data Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics & Communication Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Robotics Engineering",
  "Mechatronics",
  "Automotive Engineering",
  "Structural Engineering",
  "Marine Engineering",
  "Petroleum Engineering",
  "Agricultural Engineering",
  "Environmental Engineering",
  "Materials Science",
  "Nanotechnology",
  "Nuclear Engineering",
  "Systems Engineering",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Statistics",
  "Environmental Science",
  "Geology",
  "Astronomy",
  "Oceanography",
  "Meteorology",
  "Ecology",
  "Biochemistry",
  "Biotechnology",
  "Microbiology",
  "Genetics",
  "Molecular Biology",
  "Zoology",
  "Botany",
  "Neuroscience",
  "Pharmacology",
  "Anatomy",
  "Food Science & Technology",
  "Forensic Science",
  "Energy Science",
  "Renewable Energy Engineering",
  "Operations Research",
  "Industrial Design",
  "Biomedical Informatics",
  "Cognitive Science",
  "Computational Biology",
  "Astrophysics",
  "Space Science & Engineering",
  "Artificial Neural Systems",
  "Geoinformatics & Remote Sensing",
  "Health Informatics",
  "Data Visualization & Analytics"
] as const;

export type Subject = typeof subjects[number];

// Helper function to filter subjects based on user input
export const getFilteredSubjects = (query: string, maxResults: number = 10): string[] => {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();

  // First, find exact matches at the beginning
  const exactMatches = subjects.filter(subject =>
    subject.toLowerCase().startsWith(normalizedQuery)
  );

  // Then, find partial matches anywhere in the subject name
  const partialMatches = subjects.filter(subject =>
    !subject.toLowerCase().startsWith(normalizedQuery) &&
    subject.toLowerCase().includes(normalizedQuery)
  );

  // Combine and limit results
  return [...exactMatches, ...partialMatches].slice(0, maxResults);
};

// Helper function to highlight matching text
export const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;

  const normalizedQuery = query.toLowerCase();
  const normalizedText = text.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text;

  return text.substring(0, index) +
         '<mark class="bg-primary/20 text-primary font-medium">' +
         text.substring(index, index + query.length) +
         '</mark>' +
         text.substring(index + query.length);
};
