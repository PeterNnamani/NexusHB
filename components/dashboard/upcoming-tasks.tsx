"use client";

import { useEffect, useState } from "react";
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
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tasks scheduled.</p>
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
