import { NextResponse } from "next/server"
import { requireStaff, getAdminDb } from "@/lib/admin-auth"
import { isAdminRole } from "@/lib/admin"
import { resolveOwnedInstructorIds } from "@/lib/instructor-identity"
import { FINANCE_RULES, roundMoney } from "@/lib/finance"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireStaff()
  if ("error" in auth) return auth.error

  try {
    const admin = getAdminDb()
    let courseQuery = admin
      .from("courses")
      .select("id, title, rating, students_count, status")
    if (!isAdminRole(auth.profile.role)) {
      const ownedIds = await resolveOwnedInstructorIds(admin, {
        kind: "staff",
        profile: auth.profile,
      })
      courseQuery = courseQuery.in("instructor_id", ownedIds)
    }

    const { data: courses } = await courseQuery
    const courseIds = (courses || []).map((c) => c.id)
    const coursesTaught = courseIds.length

    let activeStudents = 0
    let totalEarnings = 0
    let monthlyEarnings = 0
    let recentEarnings: {
      amount: number
      student: string
      course: string
      date: string
    }[] = []

    if (courseIds.length > 0) {
      const { data: enrollments } = await admin
        .from("enrollments")
        .select("user_id")
        .in("course_id", courseIds)
        .eq("status", "active")
      activeStudents = new Set((enrollments || []).map((e) => e.user_id)).size

      const { data: payments } = await admin
        .from("payments")
        .select("amount, paid_at, course_id, status, user_id")
        .in("course_id", courseIds)
        .eq("status", "success")
        .order("paid_at", { ascending: false })

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const courseTitleById = new Map((courses || []).map((c) => [c.id, c.title]))
      const payerIds = [...new Set((payments || []).map((p) => p.user_id))]
      const { data: payers } = await admin
        .from("users")
        .select("id, name, email")
        .in("id", payerIds.length ? payerIds : ["00000000-0000-0000-0000-000000000000"])
      const payerMap = new Map(
        (payers || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "Student"]),
      )

      for (const p of payments || []) {
        const gross = Number(p.amount) || 0
        const credit = roundMoney(gross * FINANCE_RULES.tutorShareRate)
        totalEarnings += credit
        if (p.paid_at && new Date(p.paid_at) >= startOfMonth) monthlyEarnings += credit
      }

      recentEarnings = (payments || []).slice(0, 10).map((p) => ({
        amount: roundMoney((Number(p.amount) || 0) * FINANCE_RULES.tutorShareRate),
        student: payerMap.get(p.user_id) || "Student",
        course: courseTitleById.get(p.course_id) || "Course",
        date: p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "",
      }))
    }

    const ratings = (courses || []).map((c) => Number(c.rating) || 0).filter((r) => r > 0)
    const averageRating = ratings.length
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : 0

    const publishedCount = (courses || []).filter((c) => c.status === "published").length

    return NextResponse.json({
      totalEarnings: roundMoney(totalEarnings),
      monthlyEarnings: roundMoney(monthlyEarnings),
      activeStudents,
      coursesTaught,
      publishedCount,
      averageRating,
      courses: courses || [],
      recentEarnings,
    })
  } catch (error) {
    console.error("Failed to load tutor stats:", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
