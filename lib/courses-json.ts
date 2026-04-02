// Course types from JSON
export interface SyllabusItem {
  week: number
  topic: string
  videos: number
  duration: string
}

export interface VideoInfo {
  title: string
  url: string
  duration: string
  type: string
}

export interface JsonCourse {
  id: string
  title: string
  description: string
  category: string
  instructor: string
  price: number
  image: string
  level: string
  duration: string
  rating: number
  students: number
  lessons: number
  video: VideoInfo
  syllabus: SyllabusItem[]
}

// Load courses from JSON file
export async function loadCoursesFromJson(): Promise<JsonCourse[]> {
  try {
    const response = await fetch('/courses.json', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data.courses || []
  } catch (error) {
    console.error('Failed to load courses from JSON:', error)
    return []
  }
}

// Get all courses
export async function getAllCourses(): Promise<JsonCourse[]> {
  return await loadCoursesFromJson()
}

// Get single course by ID
export async function getCourseById(id: string): Promise<JsonCourse | null> {
  const courses = await loadCoursesFromJson()
  return courses.find(course => course.id === id) || null
}

// Get courses by category
export async function getCoursesByCategory(category: string): Promise<JsonCourse[]> {
  const courses = await loadCoursesFromJson()
  return courses.filter(course => course.category.toLowerCase() === category.toLowerCase())
}

// Get courses by level
export async function getCoursesByLevel(level: string): Promise<JsonCourse[]> {
  const courses = await loadCoursesFromJson()
  return courses.filter(course => course.level.toLowerCase() === level.toLowerCase())
}

// Search courses
export async function searchCourses(query: string): Promise<JsonCourse[]> {
  const courses = await loadCoursesFromJson()
  const lowerQuery = query.toLowerCase()
  return courses.filter(
    course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.description.toLowerCase().includes(lowerQuery) ||
      course.category.toLowerCase().includes(lowerQuery) ||
      course.instructor.toLowerCase().includes(lowerQuery)
  )
}

// Get unique categories
export async function getCategories(): Promise<string[]> {
  const courses = await loadCoursesFromJson()
  const categories = new Set(courses.map(course => course.category))
  return Array.from(categories).sort()
}

// Get unique levels
export async function getLevels(): Promise<string[]> {
  const courses = await loadCoursesFromJson()
  const levels = new Set(courses.map(course => course.level))
  return Array.from(levels).sort()
}
