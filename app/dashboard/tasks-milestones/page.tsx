"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  Flag,
  ListChecks,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseItem {
  id: string;
  title: string;
  category: string;
  instructor: string;
  image: string;
  level: string;
  duration: string;
  rating: number;
  students: number;
  lessons: number;
  price: number;
  earningsPotential?: number;
}

interface TaskItem {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: Date;
  status: "Pending" | "In Progress" | "Review";
  progress: number;
  priority: "High" | "Medium" | "Low";
}

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  progress: number;
  status: "On Track" | "In Progress" | "At Risk";
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function TasksMilestonesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch("/api/courses");
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error("Failed to load courses for tasks page:", error);
      }
    }

    loadCourses();
  }, []);

  const enrolledCourses = useMemo(() => {
    if (!user?.enrolledCourses || courses.length === 0) return [];
    return courses.filter((course) => user.enrolledCourses.includes(course.id));
  }, [courses, user?.enrolledCourses]);

  const today = useMemo(() => new Date(), []);

  const tasks = useMemo<TaskItem[]>(() => {
    if (enrolledCourses.length === 0) {
      return [];
    }

    return enrolledCourses.slice(0, 4).map((course, index) => {
      const progress = user?.courseProgress?.[course.id] ?? 0;
      const status =
        progress >= 80 ? "Review" : progress >= 40 ? "In Progress" : "Pending";
      const priority: TaskItem["priority"] =
        index === 0 ? "High" : index === 1 ? "Medium" : "Low";
      const dueDate = addDays(today, 2 + index * 3);

      return {
        id: `${course.id}-task`,
        title:
          status === "Review"
            ? `Finalize capstone review for ${course.title}`
            : `Complete next module in ${course.title}`,
        courseTitle: course.title,
        dueDate,
        status,
        progress: Math.min(progress + 15, 100),
        priority,
      };
    });
  }, [enrolledCourses, today, user?.courseProgress]);

  const milestones = useMemo<MilestoneItem[]>(() => {
    if (enrolledCourses.length === 0) {
      return [
        {
          id: "default-1",
          title: "Join a course to unlock milestone tracking",
          description:
            "Milestones are automatically generated for active learning plans.",
          deadline: addDays(today, 10),
          progress: 0,
          status: "At Risk",
        },
      ];
    }

    return enrolledCourses.slice(0, 3).map((course, index) => {
      const progress = user?.courseProgress?.[course.id] ?? 0;
      const status =
        progress >= 60
          ? "On Track"
          : progress >= 30
            ? "In Progress"
            : "At Risk";
      return {
        id: `${course.id}-milestone`,
        title: `Milestone for ${course.title}`,
        description: `Finish the next learning milestone and push your course progress above ${Math.min(progress + 30, 100)}%.`,
        deadline: addDays(today, 4 + index * 4),
        progress: Math.min(progress + 20, 100),
        status,
      };
    });
  }, [enrolledCourses, today, user?.courseProgress]);

  const summary = useMemo(
    () => ({
      totalTasks: tasks.length,
      openTasks: tasks.filter((task) => task.status !== "Review").length,
      reviewTasks: tasks.filter((task) => task.status === "Review").length,
      milestonesInProgress: milestones.filter(
        (milestone) => milestone.status !== "At Risk",
      ).length,
    }),
    [milestones, tasks],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tasks & Milestones</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Track your next actions, review due dates, and see how milestone
          progress is moving your learning plan forward.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-3xl border border-border p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tasks due soon
                    </p>
                    <p className="text-3xl font-semibold">
                      {summary.openTasks}
                    </p>
                  </div>
                  <Badge variant="secondary">Priority</Badge>
                </div>
                <div className="rounded-3xl bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Next task</div>
                  <p className="mt-2 font-semibold">
                    {tasks[0]?.title || "No active tasks yet"}
                  </p>
                  {tasks[0] && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Due {tasks[0].dueDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Milestone Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Milestones on track
                    </p>
                    <p className="text-3xl font-semibold">
                      {summary.milestonesInProgress}
                    </p>
                  </div>
                  <Badge variant="outline">Focus</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Keep your milestones moving by completing at least one task
                  every two days.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border border-border overflow-hidden">
            <CardHeader className="bg-muted/50 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">
                    In progress
                  </p>
                  <h2 className="text-xl font-semibold">Priority Task List</h2>
                </div>
                <Button variant="outline" size="sm">
                  Export Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <ul className="space-y-4">
                {tasks.length === 0 ? (
                  <li className="rounded-3xl border border-border bg-background p-5 text-sm text-muted-foreground">
                    No enrolled courses found. Browse courses to start tracking
                    tasks and milestones.
                  </li>
                ) : (
                  tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-3xl border border-border bg-background p-5 transition hover:border-primary/80"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                            {task.priority} priority
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-foreground">
                            {task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {task.courseTitle}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <Badge
                            variant={
                              task.priority === "High" ? "secondary" : "outline"
                            }
                          >
                            {task.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Due {task.dueDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Completion</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border">
            <CardHeader className="px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    Milestone Timeline
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Key course milestones and delivered progress.
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-5">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="rounded-3xl border border-border p-4 bg-background"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {index + 1}
                          </span>
                          <span>{milestone.deadline.toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          milestone.status === "On Track"
                            ? "secondary"
                            : milestone.status === "In Progress"
                              ? "default"
                              : "outline"
                        }
                      >
                        {milestone.status}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Progress value={milestone.progress} className="h-2" />
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{milestone.progress}% complete</span>
                        <span>{milestone.deadline.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border p-6 bg-muted/50">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">
                  Focus recommendation
                </p>
                <p>
                  Keep the most urgent task on top and complete at least one
                  milestone step each day to maintain momentum.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-background p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Tasks in review</span>
                  <span>
                    {summary.reviewTasks} of {summary.totalTasks}
                  </span>
                </div>
                <Progress
                  value={
                    summary.totalTasks
                      ? (summary.reviewTasks / summary.totalTasks) * 100
                      : 0
                  }
                  className="h-2 mt-3"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
