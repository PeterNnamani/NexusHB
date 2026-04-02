"use client"

import { notFound } from "next/navigation"

import { getCourseById } from "@/lib/courses"
import { CourseDetail } from "@/components/course/course-detail"

type MyCoursesPageProps = {
	params: Promise<{
		id: string
	}>
}

export default async function MyCourseDetailPage({ params }: MyCoursesPageProps) {
	const { id } = await params
	const courseId = Number(id)
	const course = getCourseById(courseId)

	if (!course) {
		notFound()
	}

	return (
		<div className="space-y-8">
			<CourseDetail course={course} backHref="/dashboard/my-courses" />
		</div>
	)
}

