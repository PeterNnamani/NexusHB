export function isCourseCompleted(
  user: {
    completedCourses?: string[];
    courseProgress?: Record<string, number>;
  } | null | undefined,
  courseId?: string,
): boolean {
  if (!courseId) return false;

  if (!user) return false;

  return (
    (user.completedCourses?.includes(courseId) ?? false) ||
    (user.courseProgress?.[courseId] ?? 0) >= 100
  );
}
