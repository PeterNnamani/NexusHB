"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users } from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
}

interface LeaderboardItem {
  id: string;
  name: string;
  points: number;
  streak: number;
  completedCourses: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, lbRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/leaderboard"),
        ]);
        const coursesData = await coursesRes.json();
        const lbData = await lbRes.json();
        setCourses(coursesData.courses || []);
        setLeaderboard(lbData.topUsers || []);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const enrolledCourses = useMemo(() => {
    if (!user?.enrolledCourses || !courses.length) return [];
    return courses.filter((course) => user.enrolledCourses.includes(course.id));
  }, [courses, user?.enrolledCourses]);

  const averageProgress = useMemo(() => {
    if (!user?.enrolledCourses?.length) return 0;
    const total = Object.values(user.courseProgress || {}).reduce((sum, p) => sum + p, 0);
    return Math.round(total / user.enrolledCourses.length);
  }, [user]);

  const userRank = useMemo(() => {
    if (!user) return null;
    const idx = leaderboard.findIndex((l) => l.id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            See how you rank against other learners. Points come from completed courses and learning streaks.
          </p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto">
          <Users className="h-4 w-4 mr-1" />
          {leaderboard.length} ranked
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl border border-border p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Top learners</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ranked by points earned across the platform.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No learners ranked yet. Complete lessons to start earning points.
                </p>
              ) : (
                <div className="grid gap-4">
                  {leaderboard.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-3xl border p-4 ${
                        item.id === user?.id ? "border-primary bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">#{index + 1}</div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {item.name}
                            {item.id === user?.id && <span className="text-primary text-sm ml-2">(You)</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.completedCourses} course{item.completedCourses !== 1 ? "s" : ""} completed • {item.streak} day streak
                          </p>
                        </div>
                        <Badge variant="outline">{item.points} pts</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Your enrolled courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">
                  You are not enrolled in any courses yet. Browse courses to join a learning path and start ranking up.
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="rounded-3xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.category} • {course.level}
                          </p>
                        </div>
                        <Badge>{user?.courseProgress?.[course.id] ?? 0}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Your rank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-primary/10 p-4">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current learner rank</p>
                  <p className="text-3xl font-semibold">{userRank ? `#${userRank}` : "Unranked"}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Average progress</span>
                  <span>{averageProgress}%</span>
                </div>
                <Progress value={averageProgress} className="h-2" />
              </div>
              <div className="rounded-3xl border border-border bg-background p-4 space-y-2 text-sm">
                <p className="font-medium">Your points</p>
                <p className="text-2xl font-semibold">{user?.points ?? 0}</p>
                <p className="text-muted-foreground">
                  Complete courses and keep your daily streak to climb the leaderboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
