// Course catalogue: semester fee (INR) and subjects (internal /30 + external /70 = 100)
export const COURSES = {
  "BCA": {
    title: "Bachelor of Computer Applications", semesters: 6, semFee: 42000, prefix: "BCA",
    subjects: [
      { code: "BCA-301", name: "Data Structures", credits: 4 },
      { code: "BCA-302", name: "Database Management Systems", credits: 4 },
      { code: "BCA-303", name: "Java Programming", credits: 4 },
      { code: "BCA-304", name: "Computer Networks", credits: 3 },
      { code: "BCA-305", name: "Mathematics", credits: 3 }
    ]
  },
  "B.Tech CSE": {
    title: "B.Tech in Computer Science & Engineering", semesters: 8, semFee: 78000, prefix: "BTCS",
    subjects: [
      { code: "CS-501", name: "Design & Analysis of Algorithms", credits: 4 },
      { code: "CS-502", name: "Operating Systems", credits: 4 },
      { code: "CS-503", name: "Theory of Computation", credits: 3 },
      { code: "CS-504", name: "Computer Organization", credits: 3 },
      { code: "CS-505", name: "Software Engineering", credits: 3 }
    ]
  },
  "B.Sc IT": {
    title: "B.Sc in Information Technology", semesters: 6, semFee: 35000, prefix: "BSIT",
    subjects: [
      { code: "IT-301", name: "Object Oriented Programming (C++)", credits: 4 },
      { code: "IT-302", name: "Web Technologies", credits: 4 },
      { code: "IT-303", name: "Digital Electronics", credits: 3 },
      { code: "IT-304", name: "Discrete Mathematics", credits: 3 }
    ]
  },
  "MCA": {
    title: "Master of Computer Applications", semesters: 4, semFee: 55000, prefix: "MCA",
    subjects: [
      { code: "MCA-101", name: "Advanced Java", credits: 4 },
      { code: "MCA-102", name: "Data Mining", credits: 4 },
      { code: "MCA-103", name: "Cloud Computing", credits: 3 },
      { code: "MCA-104", name: "Artificial Intelligence", credits: 4 },
      { code: "MCA-105", name: "Software Project Management", credits: 3 }
    ]
  },
  "BBA": {
    title: "Bachelor of Business Administration", semesters: 6, semFee: 40000, prefix: "BBA",
    subjects: [
      { code: "BBA-301", name: "Principles of Management", credits: 4 },
      { code: "BBA-302", name: "Financial Accounting", credits: 4 },
      { code: "BBA-303", name: "Business Economics", credits: 3 },
      { code: "BBA-304", name: "Marketing Management", credits: 3 }
    ]
  }
};

export const PAYMENT_MODES = ["UPI", "Cash", "Card"];
export const LOW_ATTENDANCE = 75;

export const GRADES = [
  { min: 90, grade: "O", point: 10, label: "Outstanding" },
  { min: 80, grade: "A+", point: 9, label: "Excellent" },
  { min: 70, grade: "A", point: 8, label: "Very Good" },
  { min: 60, grade: "B+", point: 7, label: "Good" },
  { min: 50, grade: "B", point: 6, label: "Above Average" },
  { min: 40, grade: "C", point: 5, label: "Pass" },
  { min: 0, grade: "F", point: 0, label: "Fail" }
];
export const gradeOf = pct => GRADES.find(g => pct >= g.min) || GRADES[GRADES.length - 1];
