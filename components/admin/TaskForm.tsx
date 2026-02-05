"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type TaskTheme = "информатика" | "математика" | "физика" | "русский";
type TaskDifficulty = "лёгкий" | "средний" | "сложный";

export type AdminTask = {
  id?: string;
  title?: string;
  task_text?: string;
  subject?: string;
  theme?: string;
  difficulty?: string;
  hint?: string;
  answer?: string;
  is_published?: boolean;
};

export default function TaskForm({
  selected,
  setSelected,
  onCreate,
  onUpdate,
  loading,
}: {
  selected: AdminTask | null;
  setSelected: (t: AdminTask | null) => void;
  onCreate: () => Promise<void>;
  onUpdate: () => Promise<void>;
  loading: boolean;
}) {
  return (
    <section className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Создать / Редактировать</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input value={selected?.title || ""} onChange={(e) => setSelected({ ...(selected ?? {}), title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Предмет</Label>
          <Input value={selected?.subject || ""} onChange={(e) => setSelected({ ...(selected ?? {}), subject: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Тема</Label>
          <Input value={selected?.theme || ""} onChange={(e) => setSelected({ ...(selected ?? {}), theme: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Сложность</Label>
          <Select value={selected?.difficulty || ""} onValueChange={(v) => setSelected({ ...(selected ?? {}), difficulty: v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите уровень" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="лёгкий">лёгкий</SelectItem>
              <SelectItem value="средний">средний</SelectItem>
              <SelectItem value="сложный">сложный</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Условие</Label>
          <Textarea className="min-h-25" value={selected?.task_text || ""} onChange={(e) => setSelected({ ...(selected ?? {}), task_text: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Подсказка</Label>
          <Input value={selected?.hint || ""} onChange={(e) => setSelected({ ...(selected ?? {}), hint: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Ответ</Label>
          <Input value={selected?.answer || ""} onChange={(e) => setSelected({ ...(selected ?? {}), answer: e.target.value })} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-6">
        <Button onClick={onCreate} disabled={loading} className="flex-1 sm:flex-none">Создать</Button>
        <Button onClick={onUpdate} disabled={loading} className="flex-1 sm:flex-none">Сохранить</Button>
        <Button variant="outline" onClick={() => setSelected(null)} className="w-full sm:w-auto">Сбросить</Button>
      </div>
    </section>
  );
}

