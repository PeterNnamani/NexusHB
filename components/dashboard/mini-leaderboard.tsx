"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
}

export function MiniLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    // Fetch leaderboard data for the current course
    async function fetchLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard?courseId=current");
        const data = await response.json();
        setLeaderboard(data.topUsers || []);
      } catch (error) {
        console.error("Failed to fetch leaderboard data", error);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {leaderboard.map((user, index) => (
            <li key={user.id} className="flex justify-between">
              <span>
                {index + 1}. {user.name}
              </span>
              <span>{user.points} pts</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
