"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AdminUser = { id?: string; first_name?: string; last_name?: string; email?: string };

export default function UsersList({
  users,
  loading,
  selectedUserId,
  onSelect,
}: {
  users: AdminUser[];
  loading: boolean;
  selectedUserId?: string | null;
  onSelect: (u: AdminUser) => void;
}) {
  return (
    <div className="col-span-1 border-r h-full flex flex-col min-h-0">
      <div className="p-4 border-b bg-muted/10">
        <h3 className="text-lg font-semibold">Пользователи ({users.length})</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && <div className="p-4 text-center text-muted-foreground">Загрузка...</div>}
        {users.map((u) => (
          <div
            key={u.id}
            className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedUserId === u.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
            onClick={() => onSelect(u)}
          >
            <div className="font-medium truncate">{u.first_name} {u.last_name}</div>
            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

