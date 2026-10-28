"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpcomingTask {
  id: string;
  title: string;
  deadline: string;
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch("/api/upcoming-tasks");
        const data = await response.json();
        setTasks(data || []);
      } catch (error) {
        console.error("Failed to fetch upcoming tasks", error);
      }
    }

    fetchTasks();
  }, []);

  return (
    <Card className="glass-card rounded-xl border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle className="font-heading tracking-tight">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
            <div className="mb-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-2.5 text-sky-300">
              <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">No upcoming tasks scheduled.</p>
            <Link href="/dashboard/browse-courses">
              <Button variant="outline" size="sm" className="border-border/80">
                Browse courses
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex justify-between">
                <span className="truncate">{task.title}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
