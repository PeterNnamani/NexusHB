import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"
import {
  splitPayment,
  computeStudentReserve,
  roundMoney,
  lastNMonths,
  monthKey,
  FINANCE_RULES,
} from "@/lib/finance"
import { ADMIN_CACHE_TTL_MS, withServerCache } from "@/lib/server-cache"
import { adminJson } from "@/lib/admin-json-response"

export const dynamic = "force-dynamic"

async function loadFinanceData() {
  const admin = getAdminDb()

  const [
    { data: payments },
    { data: orders },
    { data: enrollments },
    { data: subscriptions },
  ] = await Promise.all([
    admin
      .from("payments")
      .select("id, user_id, course_id, amount, reference, status, paid_at, created_at")
      .order("paid_at", { ascending: false })
      .limit(500),
    admin
      .from("orders")
      .select("id, user_id, course_id, reference, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("enrollments")
      .select("user_id, course_id, status, progress, enrolled_at")
      .eq("status", "active")
      .limit(1000),
    admin.from("user_subscriptions").select("id, user_id, status").eq("status", "active"),
  ])

  const userIds = new Set<string>()
  const courseIds = new Set<string>()

  for (const p of payments || []) {
    if (p.user_id) userIds.add(p.user_id)
    if (p.course_id && !p.course_id.startsWith("plan:")) courseIds.add(p.course_id)
  }
  for (const o of orders || []) {
    if (o.user_id) userIds.add(o.user_id)
    if (o.course_id && !o.course_id.startsWith("plan:")) courseIds.add(o.course_id)
  }
  for (const e of enrollments || []) {
    if (e.user_id) userIds.add(e.user_id)
    if (e.course_id) courseIds.add(e.course_id)
  }

  const idList = (ids: Set<string>) =>
    ids.size ? [...ids] : ["00000000-0000-0000-0000-000000000000"]

  const [{ data: users }, { data: courses }] = await Promise.all([
    admin.from("users").select("id, name, email, role").in("id", idList(userIds)),
    admin
      .from("courses")
      .select("id, title, instructor_id, price, earnings_potential")
      .in("id", idList(courseIds)),
  ])

  for (const c of courses || []) {
    if (c.instructor_id) userIds.add(c.instructor_id)
  }

  let userMap = new Map(
    (users || []).map((u) => [
      u.id,
      { name: u.name || u.email?.split("@")[0] || "User", email: u.email, role: u.role },
    ]),
  )

  const missingUserIds = [...userIds].filter((id) => !userMap.has(id))
  if (missingUserIds.length > 0) {
    const { data: extraUsers } = await admin
      .from("users")
      .select("id, name, email, role")
      .in("id", missingUserIds)
    for (const u of extraUsers || []) {
      userMap.set(u.id, {
        name: u.name || u.email?.split("@")[0] || "User",
        email: u.email,
        role: u.role,
      })
    }
  }

  const courseMap = new Map(
    (courses || []).map((c) => [
      c.id,
      {
        title: c.title,
        instructorId: c.instructor_id,
        price: Number(c.price) || 0,
        earningsPotential: Number(c.earnings_potential) || 0,
      },
    ]),
  )

    let grossCollected = 0
    let platformRevenue = 0
    let tutorCreditsTotal = 0
    let studentReserveFromSales = 0
    let courseRevenue = 0
    let subscriptionRevenue = 0
    let refundedAmount = 0
    let failedCount = 0

    const monthlyBuckets: Record<string, { gross: number; platform: number; tutor: number }> = {}
    for (const key of lastNMonths(6)) {
      monthlyBuckets[key] = { gross: 0, platform: 0, tutor: 0 }
    }

    const recentPayments: {
      id: string
      reference: string
      amount: number
      status: string
      category: string
      payer: string
      item: string
      platformFee: number
      tutorCredit: number
      studentReserve: number
      paidAt: string | null
    }[] = []

    const tutorCreditMap = new Map<
      string,
      { name: string; role: string; credited: number; pendingReserve: number; courses: number }
    >()

    for (const p of payments || []) {
      const amt = Number(p.amount) || 0
      const status = p.status || "unknown"

      if (status === "refunded") {
        refundedAmount += amt
        continue
      }
      if (status !== "success") {
        failedCount++
        continue
      }

      const split = splitPayment(amt, p.course_id)
      grossCollected += amt
      platformRevenue += split.platformFee
      tutorCreditsTotal += split.tutorCredit
      studentReserveFromSales += split.studentReserve

      if (split.category === "course") courseRevenue += amt
      else subscriptionRevenue += amt

      if (p.paid_at) {
        const key = monthKey(new Date(p.paid_at))
        if (monthlyBuckets[key]) {
          monthlyBuckets[key].gross += amt
          monthlyBuckets[key].platform += split.platformFee
          monthlyBuckets[key].tutor += split.tutorCredit
        }
      }

      const payer = userMap.get(p.user_id)
      let item = "Subscription"
      if (split.category === "course" && p.course_id) {
        item = courseMap.get(p.course_id)?.title || "Course"
        const instructorId = courseMap.get(p.course_id)?.instructorId
        if (instructorId && split.tutorCredit > 0) {
          const tutor = userMap.get(instructorId)
          const existing = tutorCreditMap.get(instructorId) || {
            name: tutor?.name || "Tutor",
            role: tutor?.role || "tutor",
            credited: 0,
            pendingReserve: 0,
            courses: 0,
          }
          existing.credited = roundMoney(existing.credited + split.tutorCredit)
          tutorCreditMap.set(instructorId, existing)
        }
      } else if (p.course_id?.startsWith("plan:")) {
        item = p.course_id.replace("plan:", "").replace(/_/g, " ")
      }

      if (recentPayments.length < 50) {
        recentPayments.push({
          id: p.id,
          reference: p.reference,
          amount: amt,
          status,
          category: split.category,
          payer: payer?.name || "Unknown",
          item,
          platformFee: split.platformFee,
          tutorCredit: split.tutorCredit,
          studentReserve: split.studentReserve,
          paidAt: p.paid_at,
        })
      }
    }

    let enrollmentReserve = 0
    const studentReserves: {
      student: string
      course: string
      progress: number
      maxPayout: number
      reserved: number
      enrolledAt: string | null
    }[] = []

    for (const e of enrollments || []) {
      const course = courseMap.get(e.course_id)
      if (!course) continue
      const progress = Number(e.progress) || 0
      const reserved = computeStudentReserve(course.earningsPotential, progress)
      enrollmentReserve += reserved

      const student = userMap.get(e.user_id)
      if (studentReserves.length < 30) {
        studentReserves.push({
          student: student?.name || "Student",
          course: course.title,
          progress,
          maxPayout: course.earningsPotential,
          reserved,
          enrolledAt: e.enrolled_at,
        })
      }
    }

    const staffCredits = [...tutorCreditMap.entries()]
      .map(([id, v]) => ({
        id,
        name: v.name,
        role: v.role,
        credited: v.credited,
        courses: (courses || []).filter((c) => c.instructor_id === id).length,
      }))
      .sort((a, b) => b.credited - a.credited)

    const pendingOrders = (orders || []).filter((o) => o.status === "pending")
    const pendingOrderValue = pendingOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0)

    const revenueChart = lastNMonths(6).map((key) => ({
      month: key,
      gross: roundMoney(monthlyBuckets[key]?.gross ?? 0),
      platform: roundMoney(monthlyBuckets[key]?.platform ?? 0),
      tutor: roundMoney(monthlyBuckets[key]?.tutor ?? 0),
    }))

    return {
      rules: FINANCE_RULES,
      summary: {
        grossCollected: roundMoney(grossCollected),
        platformRevenue: roundMoney(platformRevenue),
        tutorCreditsTotal: roundMoney(tutorCreditsTotal),
        studentReserveFromSales: roundMoney(studentReserveFromSales),
        enrollmentReserve: roundMoney(enrollmentReserve),
        totalStudentReserve: roundMoney(studentReserveFromSales + enrollmentReserve),
        courseRevenue: roundMoney(courseRevenue),
        subscriptionRevenue: roundMoney(subscriptionRevenue),
        refundedAmount: roundMoney(refundedAmount),
        failedPayments: failedCount,
        pendingOrders: pendingOrders.length,
        pendingOrderValue: roundMoney(pendingOrderValue),
        activeEnrollments: enrollments?.length ?? 0,
        activeSubscriptions: subscriptions?.length ?? 0,
        paymentCount: (payments || []).filter((p) => p.status === "success").length,
      },
      revenueChart,
      recentPayments,
      studentReserves: studentReserves.sort((a, b) => b.reserved - a.reserved),
      staffCredits,
      pendingOrders: pendingOrders.slice(0, 20).map((o) => ({
        reference: o.reference,
        amount: Number(o.amount) || 0,
        status: o.status,
        item: o.course_id?.startsWith("plan:")
          ? o.course_id.replace("plan:", "").replace(/_/g, " ")
          : courseMap.get(o.course_id)?.title || o.course_id,
        payer: userMap.get(o.user_id)?.name || "Unknown",
        createdAt: o.created_at,
      })),
    }
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  try {
    const data = await withServerCache("admin:finance", ADMIN_CACHE_TTL_MS, loadFinanceData)
    return adminJson(data)
  } catch (error) {
    console.error("admin finance error:", error)
    return NextResponse.json({ error: "Failed to load finance data" }, { status: 500 })
  }
}
