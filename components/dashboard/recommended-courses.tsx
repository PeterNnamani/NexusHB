"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendedCourse {
  id: string;
  title: string;
  category: string;
}

export function RecommendedCourses() {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch("/api/recommended-courses");
        const data = await response.json();
        setCourses(data || []);
      } catch (error) {
        console.error("Failed to fetch recommended courses", error);
      }
    }

    fetchCourses();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations yet.</p>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  className="flex justify-between hover:text-primary transition-colors"
                >
                  <span className="truncate">{course.title}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">{course.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
