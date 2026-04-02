import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface Enrollment {
  userId: string
  courseId: string
  email: string
  enrolledDate: string
  progress: number
}

const enrollmentsPath = path.join(process.cwd(), "public", "enrollments.json")

async function readEnrollments(): Promise<{ enrollments: Enrollment[] }> {
  try {
    const data = await fs.readFile(enrollmentsPath, "utf-8")
    return JSON.parse(data)
  } catch {
    return { enrollments: [] }
  }
}

async function writeEnrollments(data: { enrollments: Enrollment[] }): Promise<void> {
  await fs.writeFile(enrollmentsPath, JSON.stringify(data, null, 2))
}

export async function GET() {
  const enrollmentsData = await readEnrollments()
  return NextResponse.json(enrollmentsData)
}

export async function POST(request: NextRequest) {
  const enrollment = await request.json()

  const enrollmentsData = await readEnrollments()

  // Check if already enrolled
  const exists = enrollmentsData.enrollments.some(
    (e) => e.userId === enrollment.userId && e.courseId === enrollment.courseId
  )

  if (!exists) {
    enrollmentsData.enrollments.push(enrollment)
    await writeEnrollments(enrollmentsData)
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const { userId, courseId, progress } = await request.json()

  const enrollmentsData = await readEnrollments()
  const enrollment = enrollmentsData.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId
  )

  if (enrollment) {
    enrollment.progress = progress
    await writeEnrollments(enrollmentsData)
  }

  return NextResponse.json({ success: true })
}
