/** Paystack allows alphanumeric, hyphen, underscore, and dot (max ~100 chars). */

const MAX_REFERENCE_LENGTH = 96

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8)
}

/** Slug safe for Paystack reference segments. */
export function slugifyForReference(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function sanitizeReference(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

function fitReference(parts: string[]): string {
  const id = shortId()
  const suffix = `-${id}`
  const maxBase = MAX_REFERENCE_LENGTH - suffix.length

  let base = sanitizeReference(parts.filter(Boolean).join("-"))
  if (base.length > maxBase) {
    base = base.slice(0, maxBase).replace(/-$/, "")
  }

  return sanitizeReference(`${base}${suffix}`)
}

/** Single course purchase — e.g. Nexus-Intro-to-React-a1b2c3d4 */
export function buildCoursePaymentReference(courseTitle: string): string {
  const slug = slugifyForReference(courseTitle) || "Course"
  return fitReference(["Nexus", slug])
}

/** Cart / multi-course — e.g. Nexus-3-Courses-Intro-React-JS-a1b2c3d4 */
export function buildBulkCoursePaymentReference(courseTitles: string[]): string {
  const titles = courseTitles.map((t) => slugifyForReference(t)).filter(Boolean)
  if (titles.length === 0) {
    return fitReference(["Nexus", "Course-Bundle"])
  }
  if (titles.length === 1) {
    return fitReference(["Nexus", titles[0]])
  }

  const first = titles[0].slice(0, 28)
  const second =
    titles.length > 1 ? titles[1].slice(0, 18) : undefined
  const countLabel = `${titles.length}-Courses`

  return fitReference(["Nexus", countLabel, first, second].filter(Boolean) as string[])
}

/** Subscription — e.g. Nexus-Tutor-Plus-Plan-a1b2c3d4 */
export function buildSubscriptionPaymentReference(planName: string): string {
  const slug = slugifyForReference(planName) || "Subscription"
  return fitReference(["Nexus", slug, "Plan"])
}

/** Parse comma-separated titles from checkout payload. */
export function parseCourseTitlesFromPayload(courseTitle?: string): string[] {
  if (!courseTitle?.trim()) return []
  return courseTitle
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}
