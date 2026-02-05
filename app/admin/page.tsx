"use client"

import React, { useEffect, useState } from 'react'
import type { TaskSchemaRequest, TaskSchema, Theme as TaskTheme, Difficulty as TaskDifficulty } from '@/lib/client'
import TaskForm from '@/components/admin/TaskForm'
import TaskList from '@/components/admin/TaskList'
import UsersList from '@/components/admin/UsersList'
import UserDetails from '@/components/admin/UserDetails'
import { useToast } from '@/components/ui/toast'
import {
  getTasksApiTasksGet,
  postTasksApiTasksUploadPost,
  updateTaskApiTasksTaskIdPatch,
  deleteTaskApiTasksTaskIdDelete,
  getTasksToJsonApiTasksExportGet,
  postTasksApiTasksUploadImportJsonPost,
  getTasksToCsvApiTasksExportCsvGet,
  importTasksApiTasksUploadImportCsvPost,
  getAllUsersApiUserGet,
  getUserStatsApiStatsUsersUserIdGet,
  checkRoleApiAuthRolePost
} from '@/lib/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import useUserStore from '@/lib/store/userStore'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  type AdminTask = {
    id?: string
    title?: string
    task_text?: string
    subject?: string
    theme?: string
    difficulty?: string
    hint?: string
    answer?: string
    is_published?: boolean
  }

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const token = useUserStore((s) => s.token)
  const router = useRouter()
  
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<AdminTask | null>(null)
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const { toast } = useToast()
  
 
  const [qTitle, setQTitle] = useState('')
  const [qStatement, setQStatement] = useState('')
  const [qSubject, setQSubject] = useState('')
  const [qTheme, setQTheme] = useState('')
  const [qDifficulty, setQDifficulty] = useState('')

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        if (!token) {
          if (mounted) setIsAdmin(false)
          return
        }
        const resp: unknown = await checkRoleApiAuthRolePost({ body: { token } })
        const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
        const role =
          data && typeof data === "object" && "role" in (data as Record<string, unknown>)
            ? ((data as Record<string, unknown>).role as string)
            : typeof data === "string"
            ? data
            : null
        if (mounted) setIsAdmin(role === 'admin')
        if (mounted && role === 'admin') loadTasks()
      } catch (e) {
        console.error('Role check failed', e)
        if (mounted) setIsAdmin(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [token, router])

  const loadTasks = async () => {
    try {
      const resp: unknown = await getTasksApiTasksGet()
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      setTasks(Array.isArray(data) ? (data as AdminTask[]) : [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const body: TaskSchemaRequest = {
        title: String(selected.title ?? ''),
        subject: String(selected.subject ?? ''),
        theme: (String(selected.theme ?? 'информатика') as unknown) as TaskTheme,
        difficulty: (String(selected.difficulty ?? 'лёгкий') as unknown) as TaskDifficulty,
        task_text: String(selected.task_text ?? ''),
        hint: selected.hint ?? undefined,
        answer: selected.answer ?? undefined,
        is_published: selected?.is_published ?? undefined,
      }
      await postTasksApiTasksUploadPost({ body })
      toast({ title: 'Создано', variant: 'success' })
      setSelected(null)
      loadTasks()
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      toast({ title: msg || "Ошибка", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    if (!selected?.id) return
    setLoading(true)
    try {
      const body: TaskSchema = {
        id: String(selected.id),
        title: String(selected.title ?? ''),
        subject: String(selected.subject ?? ''),
        theme: (String(selected.theme ?? 'информатика') as unknown) as TaskTheme,
        difficulty: (String(selected.difficulty ?? 'лёгкий') as unknown) as TaskDifficulty,
        task_text: String(selected.task_text ?? ''),
        hint: selected.hint ?? undefined,
        answer: selected.answer ?? undefined,
        is_published: selected?.is_published ?? undefined,
      }
      await updateTaskApiTasksTaskIdPatch({ path: { task_id: body.id }, body })
      toast({ title: 'Обновлено', variant: 'success' })
      loadTasks()
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      toast({ title: msg || "Ошибка", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить задачу?')) return
    try {
      await deleteTaskApiTasksTaskIdDelete({ path: { task_id: id } })
      toast({ title: 'Удалено', variant: 'success' })
      loadTasks()
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      toast({ title: msg || "Ошибка", variant: "destructive" })
    }
  }

  const handleExport = async () => {
    try {
      const resp: unknown = await getTasksToJsonApiTasksExportGet()
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tasks.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast({ title: 'Ошибка экспорта', variant: 'destructive' })
    }
  }

  const handleImport = async () => {
    if (!jsonFile) return toast({ title: 'Выберите файл', variant: 'destructive' })
    const fd = new FormData()
    fd.append('file', jsonFile)
    try {
      await postTasksApiTasksUploadImportJsonPost({ body: { file: jsonFile } })
      toast({ title: 'Импорт завершён', variant: 'success' })
      loadTasks()
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      toast({ title: msg || "Ошибка импорта", variant: "destructive" })
    }
  }

  const handleExportCsv = async () => {
    try {
      const resp: unknown = await getTasksToCsvApiTasksExportCsvGet()
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      const blob = new Blob([String(data ?? '')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tasks.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast({ title: 'Ошибка экспорта CSV', variant: 'destructive' })
    }
  }

  const handleImportCsv = async () => {
    if (!csvFile) return toast({ title: 'Выберите CSV файл', variant: 'destructive' })
    try {
      await importTasksApiTasksUploadImportCsvPost({ body: { file: csvFile } })
      toast({ title: 'CSV импорт завершён', variant: 'success' })
      loadTasks()
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      toast({ title: msg || "Ошибка импорта CSV", variant: "destructive" })
    }
  }

  if (isAdmin === null) return <div className="p-4">Проверка...</div>
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h2 className="text-2xl mb-4 font-bold">Нет доступа</h2>
        <div className="text-muted-foreground">Требуется роль администратора.</div>
      </div>
    )
  }

  const filtered = tasks.filter((t) => {
    const title = String(t.title ?? "").toLowerCase()
    const statement = String(t.task_text ?? "").toLowerCase()
    const subject = String(t.subject ?? "").toLowerCase()
    const theme = String(t.theme ?? "").toLowerCase()
    const difficulty = String(t.difficulty ?? "").toLowerCase()

    if (qTitle && !title.includes(qTitle.toLowerCase())) return false
    if (qStatement && !statement.includes(qStatement.toLowerCase())) return false
    if (qSubject && !subject.includes(qSubject.toLowerCase())) return false
    if (qTheme && !theme.includes(qTheme.toLowerCase())) return false
    if (qDifficulty && qDifficulty !== 'all' && !difficulty.includes(qDifficulty.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2 sm:p-4 pb-20">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          {/* Create / Edit Section */}
          <TaskForm selected={selected} setSelected={setSelected} onCreate={handleCreate} onUpdate={handleUpdate} loading={loading} />

          {/* List Section */}
          <TaskList
            filtered={filtered}
            handleExport={handleExport}
            handleExportCsv={handleExportCsv}
            jsonFile={jsonFile}
            setJsonFile={setJsonFile}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            handleImport={handleImport}
            handleImportCsv={handleImportCsv}
            setSelected={setSelected}
            handleDelete={handleDelete}
            qTitle={qTitle}
            setQTitle={setQTitle}
            qStatement={qStatement}
            setQStatement={setQStatement}
            qSubject={qSubject}
            setQSubject={setQSubject}
            qTheme={qTheme}
            setQTheme={setQTheme}
            qDifficulty={qDifficulty}
            setQDifficulty={setQDifficulty}
          />
        </TabsContent>

        <TabsContent value="users">
          <section className="h-[calc(100vh-140px)] border rounded-lg overflow-hidden bg-card">
            <UsersAdmin />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UsersAdmin() {
  const token = useUserStore((s) => s.token)
  type AdminUser = { id?: string; first_name?: string; last_name?: string; email?: string }
  type UserStats = { pvp?: { wins?: number; matches?: number; losses?: number; draws?: number }; training?: { correct?: number; attempts?: number; accuracy_pct?: number } }
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const resp: unknown = await getAllUsersApiUserGet()
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      setUsers(Array.isArray(data) ? (data as AdminUser[]) : [])
    } catch (e) {
      console.error('Failed to load users', e)
    } finally { setLoadingUsers(false) }
  }

  const showStats = async (u: AdminUser) => {
    setSelectedUser(u)
    setUserStats(null)
    try {
      const resp: unknown = await getUserStatsApiStatsUsersUserIdGet({ path: { user_id: String(u.id) }, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      setUserStats(data as UserStats)
    } catch (e) {
      console.error('Failed to load user stats', e)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full relative">
      
      {/* COLUMN 1: USERS LIST */}
      {/* На мобильном скрываем список, если выбран пользователь. На десктопе (md) показываем всегда. */}
      <UsersList users={users} loading={loadingUsers} selectedUserId={selectedUser?.id} onSelect={showStats} />

      {/* COLUMN 2: USER DETAILS */}
      {/* На мобильном показываем только если выбран пользователь. На десктопе (md) показываем всегда. */}
      <div className={`col-span-1 md:col-span-2 lg:col-span-3 h-full overflow-y-auto bg-background ${!selectedUser ? 'hidden md:block' : 'block'}`}>
        {!selectedUser ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <span>Выберите пользователя из списка слева, чтобы просмотреть подробную статистику</span>
          </div>
        ) : (
          <UserDetails user={selectedUser} stats={userStats} onBack={() => setSelectedUser(null)} />
        )}
      </div>
    </div>
  )
}