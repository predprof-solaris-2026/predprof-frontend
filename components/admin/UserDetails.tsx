"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AdminUser = { id?: string; first_name?: string; last_name?: string; email?: string };
type UserStats = { pvp?: { wins?: number; matches?: number; losses?: number; draws?: number }; training?: { correct?: number; attempts?: number; accuracy_pct?: number } };

export default function UserDetails({
  user,
  stats,
  onBack,
}: {
  user: AdminUser | null;
  stats: UserStats | null;
  onBack: () => void;
}) {
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <span>Выберите пользователя из списка слева, чтобы просмотреть подробную статистику</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 md:animate-none">
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden mb-4 -ml-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
      </Button>

      <div className="mb-6 pb-4 border-b">
        <h3 className="text-2xl font-bold break-words">{user.first_name} {user.last_name}</h3>
        <div className="text-sm text-muted-foreground mt-1 break-all">{user.email}</div>
        <div className="text-xs font-mono text-muted-foreground mt-1 select-all">ID: {user.id}</div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg shadow-sm bg-card">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">PVP Арена</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{stats.pvp?.wins ?? 0}</span>
              <span className="text-sm text-muted-foreground">побед из {stats.pvp?.matches ?? 0} матчей</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-green-50 text-green-700 rounded border border-green-100">
                <div className="font-bold">{stats.pvp?.wins ?? 0}</div>
                <div className="text-[10px] uppercase">Побед</div>
              </div>
              <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                <div className="font-bold">{stats.pvp?.losses ?? 0}</div>
                <div className="text-[10px] uppercase">Поражений</div>
              </div>
              <div className="p-2 bg-gray-50 text-gray-700 rounded border border-gray-100">
                <div className="font-bold">{stats.pvp?.draws ?? 0}</div>
                <div className="text-[10px] uppercase">Ничьих</div>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg shadow-sm bg-card">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Тренировка</div>
            <div className="flex items-baseline gap-2 mb-4">
               <span className="text-3xl font-bold">{stats.training?.accuracy_pct ?? 0}%</span>
               <span className="text-sm text-muted-foreground">точность</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                  <span>Всего попыток:</span>
                  <span className="font-medium">{stats.training?.attempts ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span>Правильных ответов:</span>
                  <span className="font-medium text-green-600">{stats.training?.correct ?? 0}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                      className="h-full bg-primary" 
                      style={{ width: `${stats.training?.accuracy_pct ?? 0}%` }}
                  />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Загрузка статистики...
        </div>
      )}
    </div>
  );
}

