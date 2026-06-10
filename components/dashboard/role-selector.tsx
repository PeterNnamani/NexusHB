"use client";

import { useState } from "react";
import { ChevronDown, GraduationCap, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UserRole = "student" | "tutor" | "agent";

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isCollapsed?: boolean;
}

const roles = [
  {
    value: "student" as const,
    label: "Student",
    icon: GraduationCap,
  },
  {
    value: "tutor" as const,
    label: "Tutor",
    icon: UserCheck,
  },
  {
    value: "agent" as const,
    label: "Agent",
    icon: Shield,
  },
];

export function RoleSelector({
  currentRole,
  onRoleChange,
  isCollapsed,
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentRoleData = roles.find((r) => r.value === currentRole);

  if (isCollapsed) {
    const IconComponent = currentRoleData?.icon;
    return (
      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full h-10">
              {IconComponent && <IconComponent className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="min-w-48">
            {roles.map((role) => {
              const RoleIcon = role.icon;
              return (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => onRoleChange(role.value)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    currentRole === role.value && "bg-primary/10",
                  )}
                >
                  <RoleIcon className="h-4 w-4" />
                  <span>{role.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-12">
            <div className="flex items-center gap-3">
              {currentRoleData && <currentRoleData.icon className="h-5 w-5" />}
              <div className="text-left">
                <div className="font-medium">{currentRoleData?.label}</div>
                <div className="text-xs text-muted-foreground">
                 
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {roles.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => onRoleChange(role.value)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                currentRole === role.value && "bg-primary/10",
              )}
            >
              <role.icon className="h-5 w-5" />
              <div>
                <div className="font-medium">{role.label}</div>
                <div className="text-xs text-muted-foreground">
                 
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
