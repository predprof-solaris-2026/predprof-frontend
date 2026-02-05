"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileJson, Upload, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type AdminTask = {
  id?: string;
  title?: string;
  task_text?: string;
  subject?: string;
  theme?: string;
  difficulty?: string;
};

export default function TaskList({
  filtered,
  handleExport,
  handleExportCsv,
  jsonFile,
  setJsonFile,
  csvFile,
  setCsvFile,
  handleImport,
  handleImportCsv,
  setSelected,
  handleDelete,
  qTitle,
  setQTitle,
  qStatement,
  setQStatement,
  qSubject,
  setQSubject,
  qTheme,
  setQTheme,
  qDifficulty,
  setQDifficulty,
}: {
  filtered: AdminTask[];
  handleExport: () => Promise<void>;
  handleExportCsv: () => Promise<void>;
  jsonFile: File | null;
  setJsonFile: (f: File | null) => void;
  csvFile: File | null;
  setCsvFile: (f: File | null) => void;
  handleImport: () => Promise<void>;
  handleImportCsv: () => Promise<void>;
  setSelected: (t: AdminTask | null) => void;
  handleDelete: (id: string) => void;
  qTitle: string;
  setQTitle: (v: string) => void;
  qStatement: string;
  setQStatement: (v: string) => void;
  qSubject: string;
  setQSubject: (v: string) => void;
  qTheme: string;
  setQTheme: (v: string) => void;
  qDifficulty: string;
  setQDifficulty: (v: string) => void;
}) {
  return (
    <section className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Список задач</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Экспорт
          </Button>
          <Button onClick={handleExportCsv} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Экспорт CSV
          </Button>

          <Input id="jsonFileInput" type="file" accept="application/json" className="hidden" onChange={(e) => setJsonFile(e.currentTarget.files?.[0] ?? null)} />
          <Input id="csvFileInput" type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setCsvFile(e.currentTarget.files?.[0] ?? null)} />

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto flex-1 truncate" asChild>
              <label htmlFor="jsonFileInput" className="cursor-pointer flex items-center justify-center">
                <FileJson className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{jsonFile ? jsonFile.name : "Выбрать JSON"}</span>
              </label>
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto flex-1 truncate" asChild>
              <label htmlFor="csvFileInput" className="cursor-pointer flex items-center justify-center">
                <FileJson className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{csvFile ? csvFile.name : "Выбрать CSV"}</span>
              </label>
            </Button>
            <Button onClick={handleImport} className="shrink-0">
              <Upload className="h-4 w-4" />
            </Button>
            <Button onClick={handleImportCsv} className="shrink-0">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 bg-muted/30 p-3 rounded-lg">
        <div className="col-span-1 sm:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Поиск по заголовку</Label>
          <Input className="h-8" value={qTitle} onChange={(e) => setQTitle(e.target.value)} placeholder="..." />
        </div>
        <div className="col-span-1 sm:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Поиск по условию</Label>
          <Input className="h-8" value={qStatement} onChange={(e) => setQStatement(e.target.value)} placeholder="..." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Предмет</Label>
          <Input className="h-8" value={qSubject} onChange={(e) => setQSubject(e.target.value)} placeholder="..." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Тема</Label>
          <Input className="h-8" value={qTheme} onChange={(e) => setQTheme(e.target.value)} placeholder="..." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Сложность</Label>
          <Select value={qDifficulty} onValueChange={(v) => setQDifficulty(v)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="лёгкий">лёгкий</SelectItem>
              <SelectItem value="средний">средний</SelectItem>
              <SelectItem value="сложный">сложный</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={() => { setQTitle(''); setQStatement(''); setQSubject(''); setQTheme(''); setQDifficulty('') }} className='w-full text-xs h-8'>
            Сброс
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.id} className="p-4 border rounded-lg bg-background flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-primary/50 transition-colors">
            <div className="w-full">
              <div className="font-semibold text-lg">{t.title}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-1 mb-2">
                {t.subject} • {t.theme} • {t.difficulty}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-3">{t.task_text}</div>
            </div>
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => { setSelected(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                Редактировать
              </Button>
              <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => handleDelete(String(t.id))}>
                Удалить
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">Ничего не найдено</div>}
      </div>
    </section>
  );
}

