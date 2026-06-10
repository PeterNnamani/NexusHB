import type { SupabaseClient } from "@supabase/supabase-js"
import { lastNMonths, monthKey, roundMoney, splitPayment } from "@/lib/finance"

function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function loadAdminOverviewData(admin: SupabaseClient) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const sixMonthsAgo = monthsAgo(5)

  const months = lastNMonths(6)
  const revenueByMonth: Record<string, number> = {}
  const signupsByMonth: Record<string, number> = {}
  const enrollmentsByMonth: Record<string, number> = {}
  const splitByMonth: Record<string, { gross: number; platform: number; tutor: number }> = {}
  for (const key of months) {
    revenueByMonth[key] = 0
    signupsByMonth[key] = 0
    enrollmentsByMonth[key] = 0
    splitByMonth[key] = { gross: 0, platform: 0, tutor: 0 }
  }

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: publishedCourses },
    { count: draftCourses },
    { count: newRegistrations },
    { count: activeEnrollments },
    { count: activeSubscriptions },
    { count: pendingOrders },
    { count: contactCount },
    { count: suggestionCount },
    { count: liveSessions },
    { count: certificates },
    { count: newsletter },
    { count: students },
    { count: tutors },
    { count: admins },
    { count: ordersPending },
    { count: ordersPaid },
    { count: ordersFailed },
    { count: ordersCancelled },
    { count: paySuccess },
    { count: payFailed },
    { count: payRefunded },
    { data: payments },
    { data: recentUsers },
    { data: signupsRecent },
    { data: enrollmentsRecent },
    { data: recentPaymentsRaw },
    { data: pendingOrdersRaw },
    { data: topCourses },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("courses").select("*", { count: "exact", head: true }),
    admin.from("courses").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("courses").select("*", { count: "exact", head: true }).eq("status", "draft"),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    admin.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("contact_submissions").select("*", { count: "exact", head: true }),
    admin.from("suggestions").select("*", { count: "exact", head: true }),
    admin.from("live_sessions").select("*", { count: "exact", head: true }),
    admin.from("certificates").select("*", { count: "exact", head: true }),
    admin.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "tutor"),
    admin.from("users").select("*", { count: "exact", head: true }).in("role", ["admin", "agent"]),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    admin.from("payments").select("*", { count: "exact", head: true }).eq("status", "success"),
    admin.from("payments").select("*", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("payments").select("*", { count: "exact", head: true }).eq("status", "refunded"),
    admin.from("payments").select("amount, paid_at, status, course_id"),
    admin
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("users")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    admin
      .from("enrollments")
      .select("enrolled_at")
      .gte("enrolled_at", sixMonthsAgo.toISOString()),
    admin
      .from("payments")
      .select("id, amount, reference, status, paid_at, course_id, user_id")
      .order("paid_at", { ascending: false })
      .limit(10),
    admin
      .from("orders")
      .select("reference, amount, status, created_at, course_id, user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("courses")
      .select("id, title, students_count, status, price")
      .order("students_count", { ascending: false })
      .limit(8),
  ])

  let grossCollected = 0
  let monthlyRevenue = 0
  let platformRevenue = 0
  let tutorCredits = 0
  let studentReserve = 0

  for (const p of payments || []) {
    if (p.status !== "success") continue
    const amt = Number(p.amount) || 0
    grossCollected += amt
    const split = splitPayment(amt, p.course_id)
    platformRevenue += split.platformFee
    tutorCredits += split.tutorCredit
    studentReserve += split.studentReserve
    if (p.paid_at && new Date(p.paid_at) >= startOfMonth) monthlyRevenue += amt
    if (p.paid_at) {
      const key = monthKey(new Date(p.paid_at))
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += amt
        splitByMonth[key].gross += amt
        splitByMonth[key].platform += split.platformFee
        splitByMonth[key].tutor += split.tutorCredit
      }
    }
  }

  for (const u of signupsRecent || []) {
    if (!u.created_at) continue
    const key = monthKey(new Date(u.created_at))
    if (signupsByMonth[key] !== undefined) signupsByMonth[key]++
  }

  for (const e of enrollmentsRecent || []) {
    if (!e.enrolled_at) continue
    const key = monthKey(new Date(e.enrolled_at))
    if (enrollmentsByMonth[key] !== undefined) enrollmentsByMonth[key]++
  }

  const usersByRole = {
    student: students ?? 0,
    tutor: tutors ?? 0,
    admin: admins ?? 0,
  }

  const payerIds = [...new Set((recentPaymentsRaw || []).map((p) => p.user_id))]
  const courseIds = [
    ...new Set(
      (recentPaymentsRaw || [])
        .map((p) => p.course_id)
        .filter((id): id is string => !!id && !id.startsWith("plan:")),
    ),
  ]

  const [{ data: payers }, { data: courseRows }] = await Promise.all([
    admin
      .from("users")
      .select("id, name, email")
      .in("id", payerIds.length ? payerIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("courses")
      .select("id, title")
      .in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const payerMap = new Map(
    (payers || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "User"]),
  )
  const courseMap = new Map((courseRows || []).map((c) => [c.id, c.title]))

  const analytics = {
    summary: {
      totalUsers: totalUsers ?? 0,
      newRegistrations: newRegistrations ?? 0,
      publishedCourses: publishedCourses ?? 0,
      draftCourses: draftCourses ?? 0,
      grossCollected: roundMoney(grossCollected),
      monthlyRevenue: roundMoney(monthlyRevenue),
      platformRevenue: roundMoney(platformRevenue),
      tutorCredits: roundMoney(tutorCredits),
      studentReserve: roundMoney(studentReserve),
      activeEnrollments: activeEnrollments ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      pendingOrders: pendingOrders ?? 0,
      contactSubmissions: contactCount ?? 0,
      suggestions: suggestionCount ?? 0,
      liveSessions: liveSessions ?? 0,
      certificates: certificates ?? 0,
      newsletterSubscribers: newsletter ?? 0,
    },
    usersByRole,
    paymentStatus: [
      { status: "Success", count: paySuccess ?? 0 },
      { status: "Failed", count: payFailed ?? 0 },
      { status: "Refunded", count: payRefunded ?? 0 },
    ],
    orderStatus: [
      { status: "Pending", count: ordersPending ?? 0 },
      { status: "Paid", count: ordersPaid ?? 0 },
      { status: "Failed", count: ordersFailed ?? 0 },
      { status: "Cancelled", count: ordersCancelled ?? 0 },
    ],
    roleChart: [
      { role: "Students", count: usersByRole.student },
      { role: "Tutors", count: usersByRole.tutor },
      { role: "Admins", count: usersByRole.admin },
    ],
    courseStatus: [
      { status: "Published", count: publishedCourses ?? 0 },
      { status: "Draft", count: draftCourses ?? 0 },
    ],
    revenueChart: months.map((key) => ({
      month: key,
      revenue: roundMoney(revenueByMonth[key] ?? 0),
    })),
    signupsChart: months.map((key) => ({ month: key, signups: signupsByMonth[key] ?? 0 })),
    enrollmentsChart: months.map((key) => ({
      month: key,
      enrollments: enrollmentsByMonth[key] ?? 0,
    })),
    splitChart: months.map((key) => ({
      month: key,
      gross: roundMoney(splitByMonth[key]?.gross ?? 0),
      platform: roundMoney(splitByMonth[key]?.platform ?? 0),
      tutor: roundMoney(splitByMonth[key]?.tutor ?? 0),
    })),
    topCourses: (topCourses || []).map((c) => ({
      id: c.id,
      title: c.title,
      students: c.students_count ?? 0,
      status: c.status,
      price: roundMoney(Number(c.price) || 0),
    })),
  }

  const tables = {
    totalCourses: totalCourses ?? 0,
    totalRevenue: roundMoney(grossCollected),
    monthlyRevenue: roundMoney(monthlyRevenue),
    recentPayments: (recentPaymentsRaw || []).map((p) => ({
      id: p.id,
      amount: roundMoney(Number(p.amount) || 0),
      reference: p.reference,
      status: p.status,
      payer: payerMap.get(p.user_id) || "Unknown",
      item: p.course_id?.startsWith("plan:")
        ? p.course_id.replace("plan:", "").replace(/_/g, " ")
        : courseMap.get(p.course_id) || "Subscription",
      paidAt: p.paid_at,
    })),
    pendingOrdersList: (pendingOrdersRaw || []).map((o) => ({
      reference: o.reference,
      amount: roundMoney(Number(o.amount) || 0),
      createdAt: o.created_at,
    })),
    recentUsers: (recentUsers || []).map((u) => ({
      name: u.name || (u.email ? String(u.email).split("@")[0] : "User"),
      email: u.email,
      role: u.role === "agent" ? "admin" : u.role,
      joinedAt: u.created_at,
    })),
  }

  return { analytics, tables }
}
