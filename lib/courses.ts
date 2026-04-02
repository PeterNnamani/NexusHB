export type CourseStatus = "in-progress" | "completed" | "not-started"

export type CourseMaterial = {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: string
  url: string
}

export type CourseAssignment = {
  id: string
  title: string
  description: string
  dueDate: string
  status: "pending" | "submitted" | "graded"
  grade?: string
}

export type CourseQuiz = {
  id: string
  title: string
  questions: number
  timeLimit: string
  status: "locked" | "available" | "completed"
  score?: string
}

export type CourseGrade = {
  title: string
  score: string
  maxScore: string
  weight: string
}

export type CourseModule = {
  id: string
  title: string
  duration: string
  completed: boolean
}

export type Course = {
  id: number
  title: string
  category: string
  level: string
  instructor: string
  description: string
  image: string
  duration: string
  students: number
  rating: number
  reviews: number
  price: number
  earningsPotential: number
  progress: number
  totalLessons: number
  completedLessons: number
  lastAccessed: string
  status: CourseStatus
  nextLesson?: string
  syllabus: CourseModule[]
  materials: CourseMaterial[]
  assignments: CourseAssignment[]
  quizzes: CourseQuiz[]
  grades: CourseGrade[]
}

const baseDescription =
  "Dive into a comprehensive learning experience with hands-on lessons, downloadable resources, graded assignments, and timed quizzes. Perfect for learners who want a classroom-style journey."

export const courses: Course[] = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp 2026",
    category: "Full Stack",
    level: "Beginner",
    instructor: "Dr. Angela Yu",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop",
    duration: "40 hours",
    students: 12500,
    rating: 4.9,
    reviews: 3200,
    price: 99,
    earningsPotential: 12000,
    progress: 65,
    totalLessons: 48,
    completedLessons: 31,
    lastAccessed: "2 hours ago",
    status: "in-progress",
    nextLesson: "CSS Grid Layout",
    syllabus: [
      { id: "m1", title: "HTML & CSS Fundamentals", duration: "3h", completed: true },
      { id: "m2", title: "JavaScript Basics", duration: "5h", completed: true },
      { id: "m3", title: "Responsive Layouts", duration: "4h", completed: false },
      { id: "m4", title: "Node.js & APIs", duration: "6h", completed: false },
    ],
    materials: [
      {
        id: "mat1",
        title: "Course Syllabus",
        description: "Overview of modules and learning outcomes.",
        fileName: "syllabus.pdf",
        fileSize: "1.2 MB",
        url: "/downloads/syllabus.pdf",
      },
      {
        id: "mat2",
        title: "Starter Code Pack",
        description: "Get up and running with starter projects.",
        fileName: "starter-code.zip",
        fileSize: "15 MB",
        url: "/downloads/starter-code.zip",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "Build a Personal Portfolio",
        description: "Create a responsive portfolio website using HTML, CSS, and JavaScript.",
        dueDate: "March 25, 2026",
        status: "pending",
      },
      {
        id: "a2",
        title: "API Integration Project",
        description: "Fetch and display data from an open REST API.",
        dueDate: "April 3, 2026",
        status: "pending",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "HTML & CSS Quiz",
        questions: 15,
        timeLimit: "20 min",
        status: "completed",
        score: "92%",
      },
      {
        id: "q2",
        title: "JavaScript Quiz",
        questions: 20,
        timeLimit: "25 min",
        status: "available",
      },
    ],
    grades: [
      { title: "Assignments", score: "85", maxScore: "100", weight: "40%" },
      { title: "Quizzes", score: "92", maxScore: "100", weight: "30%" },
      { title: "Final Project", score: "n/a", maxScore: "100", weight: "30%" },
    ],
  },
  {
    id: 2,
    title: "React & Next.js Masterclass",
    category: "Frontend",
    level: "Intermediate",
    instructor: "Maximilian Schwarzmuller",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
    duration: "32 hours",
    students: 8700,
    rating: 4.8,
    reviews: 2100,
    price: 79,
    earningsPotential: 10000,
    progress: 40,
    totalLessons: 36,
    completedLessons: 14,
    lastAccessed: "1 day ago",
    status: "in-progress",
    nextLesson: "Server Components",
    syllabus: [
      { id: "m1", title: "React Fundamentals", duration: "4h", completed: true },
      { id: "m2", title: "Next.js Basics", duration: "5h", completed: false },
      { id: "m3", title: "API Routes & Data Fetching", duration: "4h", completed: false },
    ],
    materials: [
      {
        id: "mat1",
        title: "Next.js Starter Template",
        description: "A minimal boilerplate for building Next.js apps.",
        fileName: "next-starter.zip",
        fileSize: "9.8 MB",
        url: "/downloads/next-starter.zip",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "Build a Blog with Next.js",
        description: "Create a blog with dynamic routes and markdown support.",
        dueDate: "April 10, 2026",
        status: "pending",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "React Hooks Quiz",
        questions: 12,
        timeLimit: "15 min",
        status: "available",
      },
    ],
    grades: [
      { title: "Assignments", score: "n/a", maxScore: "100", weight: "50%" },
      { title: "Quizzes", score: "n/a", maxScore: "100", weight: "25%" },
      { title: "Participation", score: "n/a", maxScore: "100", weight: "25%" },
    ],
  },
  {
    id: 3,
    title: "TypeScript Complete Course",
    category: "Frontend",
    level: "Intermediate",
    instructor: "Stephen Grider",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    duration: "18 hours",
    students: 4200,
    rating: 4.9,
    reviews: 1200,
    price: 49,
    earningsPotential: 7000,
    progress: 100,
    totalLessons: 28,
    completedLessons: 28,
    lastAccessed: "2 weeks ago",
    status: "completed",
    nextLesson: "Review & Next Steps",
    syllabus: [
      { id: "m1", title: "TypeScript Basics", duration: "3h", completed: true },
      { id: "m2", title: "Advanced Types", duration: "4h", completed: true },
      { id: "m3", title: "Type Inference", duration: "3h", completed: true },
    ],
    materials: [
      {
        id: "mat1",
        title: "TypeScript Cheat Sheet",
        description: "Quick reference for common types and patterns.",
        fileName: "ts-cheatsheet.pdf",
        fileSize: "650 KB",
        url: "/downloads/ts-cheatsheet.pdf",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "Type-Driven Design Exercise",
        description: "Design types for a small e-commerce data model.",
        dueDate: "March 10, 2026",
        status: "graded",
        grade: "92%",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "TypeScript Core Concepts",
        questions: 20,
        timeLimit: "20 min",
        status: "completed",
        score: "95%",
      },
    ],
    grades: [
      { title: "Assignments", score: "92", maxScore: "100", weight: "50%" },
      { title: "Quizzes", score: "95", maxScore: "100", weight: "30%" },
      { title: "Final Project", score: "100", maxScore: "100", weight: "20%" },
    ],
  },
  {
    id: 4,
    title: "UI/UX Design Fundamentals",
    category: "Design",
    level: "Beginner",
    instructor: "Alex Rivera",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
    duration: "24 hours",
    students: 5100,
    rating: 4.8,
    reviews: 1500,
    price: 59,
    earningsPotential: 6000,
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    lastAccessed: "Not started",
    status: "not-started",
    syllabus: [
      { id: "m1", title: "Design Principles", duration: "3h", completed: false },
      { id: "m2", title: "Figma Basics", duration: "4h", completed: false },
    ],
    materials: [
      {
        id: "mat1",
        title: "Design Toolkit",
        description: "Source files and templates to kickstart your projects.",
        fileName: "design-toolkit.zip",
        fileSize: "28 MB",
        url: "/downloads/design-toolkit.zip",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "Create a Landing Page Mockup",
        description: "Design a high-converting landing page in Figma.",
        dueDate: "April 15, 2026",
        status: "pending",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "UX Principles Quiz",
        questions: 10,
        timeLimit: "15 min",
        status: "locked",
      },
    ],
    grades: [
      { title: "Assignments", score: "n/a", maxScore: "100", weight: "60%" },
      { title: "Quizzes", score: "n/a", maxScore: "100", weight: "20%" },
      { title: "Participation", score: "n/a", maxScore: "100", weight: "20%" },
    ],
  },
  {
    id: 5,
    title: "Database Design & SQL",
    category: "Database",
    level: "Intermediate",
    instructor: "James Wilson",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=600&fit=crop",
    duration: "22 hours",
    students: 6300,
    rating: 4.7,
    reviews: 1800,
    price: 69,
    earningsPotential: 9000,
    progress: 45,
    totalLessons: 30,
    completedLessons: 14,
    lastAccessed: "3 days ago",
    status: "in-progress",
    syllabus: [
      { id: "m1", title: "Relational Databases", duration: "3h", completed: true },
      { id: "m2", title: "SQL Queries", duration: "5h", completed: false },
    ],
    materials: [
      {
        id: "mat1",
        title: "SQL Cheat Sheet",
        description: "Common queries and commands for quick reference.",
        fileName: "sql-cheatsheet.pdf",
        fileSize: "450 KB",
        url: "/downloads/sql-cheatsheet.pdf",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "Design a Database Schema",
        description: "Model a database for a simple e-commerce store.",
        dueDate: "March 30, 2026",
        status: "pending",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "SQL Query Quiz",
        questions: 18,
        timeLimit: "20 min",
        status: "available",
      },
    ],
    grades: [
      { title: "Assignments", score: "n/a", maxScore: "100", weight: "50%" },
      { title: "Quizzes", score: "n/a", maxScore: "100", weight: "30%" },
      { title: "Final Exam", score: "n/a", maxScore: "100", weight: "20%" },
    ],
  },
  {
    id: 6,
    title: "AWS Cloud Practitioner",
    category: "DevOps",
    level: "Beginner",
    instructor: "Stephane Maarek",
    description: baseDescription,
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
    duration: "20 hours",
    students: 7800,
    rating: 4.7,
    reviews: 2400,
    price: 69,
    earningsPotential: 10000,
    progress: 0,
    totalLessons: 22,
    completedLessons: 0,
    lastAccessed: "Not started",
    status: "not-started",
    syllabus: [
      { id: "m1", title: "AWS Basics", duration: "3h", completed: false },
      { id: "m2", title: "Core Services", duration: "4h", completed: false },
    ],
    materials: [
      {
        id: "mat1",
        title: "AWS Glossary",
        description: "Key terms and services for the AWS Certified Cloud Practitioner exam.",
        fileName: "aws-glossary.pdf",
        fileSize: "1.1 MB",
        url: "/downloads/aws-glossary.pdf",
      },
    ],
    assignments: [
      {
        id: "a1",
        title: "AWS Architecture Diagram",
        description: "Design an architecture diagram for a simple web application.",
        dueDate: "April 20, 2026",
        status: "pending",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "AWS Fundamentals Quiz",
        questions: 15,
        timeLimit: "20 min",
        status: "locked",
      },
    ],
    grades: [
      { title: "Assignments", score: "n/a", maxScore: "100", weight: "60%" },
      { title: "Quizzes", score: "n/a", maxScore: "100", weight: "20%" },
      { title: "Final Assessment", score: "n/a", maxScore: "100", weight: "20%" },
    ],
  },
]

export function getCourseById(id: number) {
  return courses.find((course) => course.id === id)
}

export const enrolledCourseIds = [1, 2, 3]

export const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id))
