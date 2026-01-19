"use client";

import { useAtom } from "jotai";
import { athenaEnvironmentAtom } from "@/lib/foundation-kit/atoms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, ServerOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function EnvironmentToggle() {
  const [environment, setEnvironment] = useAtom(athenaEnvironmentAtom);

  const toggleEnvironment = () => {
    const newEnv = environment === "sandbox" ? "production" : "sandbox";
    setEnvironment(newEnv);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEnvironment}
          className="flex items-center gap-2"
        >
          {environment === "production" ? (
            <Server className="h-4 w-4 text-green-600" />
          ) : (
            <ServerOff className="h-4 w-4 text-yellow-600" />
          )}
          <Badge
            variant={environment === "production" ? "default" : "secondary"}
          >
            {environment === "production" ? "Production" : "Sandbox"}
          </Badge>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Current environment: <strong>{environment}</strong>
        </p>
        <p className="text-xs mt-1">
          Click to switch to{" "}
          {environment === "sandbox" ? "Production" : "Sandbox"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

