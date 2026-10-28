"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
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
    <Card className="glass-card rounded-xl border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle className="font-heading tracking-tight">Recommended Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
            <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-800 dark:text-emerald-300">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted-foreground">No recommendations yet.</p>
          </div>
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
