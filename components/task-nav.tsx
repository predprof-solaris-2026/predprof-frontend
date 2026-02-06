"use client";

import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { TaskSchema } from "@/lib/client";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  trainingList: TaskSchema[] | null;
  trainingProgress: Record<string, "correct" | "wrong" | "none">;
  currentTaskId?: string | null;
  onNavigate: (id: string) => void;
  onGenerate: () => void;
  onResetProgress: () => void;
  loadingGenerate?: boolean;
};

export default function TaskNav({
  trainingList,
  trainingProgress,
  currentTaskId,
  onNavigate,
  onGenerate,
  onResetProgress,
  loadingGenerate,
}: Props) {
  return (
    <nav
      className="flex items-center gap-3 px-3 py-2 lg:py-0 bg-accent/50 rounded-xl overflow-x-auto shadow-sm min-h-14"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#00000020 transparent" } as React.CSSProperties}
    >
      {trainingList && trainingList.length > 0 ? (
        trainingList.map((t, i) => {
          const id = t.id;
          const idStr = id ? String(id) : undefined;
          const status = idStr ? trainingProgress[idStr] : undefined;
          const isCurrent = idStr !== undefined && String(currentTaskId ?? "") === idStr;

          let buttonStyles = "font-medium transition-all duration-200 border";
          if (isCurrent) {
            if (status === "correct") {
              buttonStyles += " bg-green-600 text-white border-green-700 hover:bg-green-700 hover:text-white";
            } else if (status === "wrong") {
              buttonStyles += " bg-red-600 text-white border-red-700 hover:bg-red-700 hover:text-white";
            } else {
              buttonStyles += " bg-white text-black border-gray-300 shadow-md hover:bg-gray-50";
            }
          } else {
            if (status === "correct") {
              buttonStyles += " bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
            } else if (status === "wrong") {
              buttonStyles += " bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
            } else {
              buttonStyles += " bg-transparent text-gray-600 border-transparent hover:bg-gray-200";
            }
          }

          return (
            <Button
              key={idStr ?? `idx-${i}`}
              className={cn("min-w-[2.5rem] h-10 w-10 p-0 rounded-lg", buttonStyles)}
              variant="ghost"
              onClick={() => idStr && onNavigate(idStr)}
            >
              {i + 1}
            </Button>
          );
        })
      ) : (
        <Button className="size-10 bg-white text-black border border-gray-300 shadow-md">1</Button>
      )}

      <Button
        className="size-10 ml-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
        variant="ghost"
        onClick={onGenerate}
        disabled={loadingGenerate}
      >
        {loadingGenerate ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="size-5" />}
      </Button>

      {trainingList && trainingList.length > 1 && (
        <Button className="ml-2 rounded-lg" variant="outline" onClick={onResetProgress}>
          Выйти с тренировки
        </Button>
      )}
    </nav>
  );
}

