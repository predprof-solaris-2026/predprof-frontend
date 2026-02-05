"use client"

import React, { useEffect, useState } from 'react'
import type { TaskSchemaRequest, TaskSchema, Theme as TaskTheme, Difficulty as TaskDifficulty } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Upload, FileJson, Download } from 'lucide-react' // Добавлены иконки
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
  
  // Filters
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
        const resp: any = await checkRoleApiAuthRolePost({ body: { token } })
        const data = resp?.data ?? resp
        const role = data?.role ?? (typeof data === 'string' ? data : null)
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
          <section className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Создать / Редактировать</h3>
            {/* Адаптивный грид: 1 колонка на моб, 2 на десктопе */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Заголовок</Label>
                <Input value={selected?.title || ''} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Предмет</Label>
                <Input value={selected?.subject || ''} onChange={(e) => setSelected({ ...selected, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Тема</Label>
                <Input value={selected?.theme || ''} onChange={(e) => setSelected({ ...selected, theme: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Сложность</Label>
                <Select value={selected?.difficulty || ''} onValueChange={(v) => setSelected({ ...selected, difficulty: v })}>
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
                <Textarea className="min-h-25" value={selected?.task_text || ''} onChange={(e) => setSelected({ ...selected, task_text: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Подсказка</Label>
                <Input value={selected?.hint || ''} onChange={(e) => setSelected({ ...selected, hint: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ответ</Label>
                <Input value={selected?.answer || ''} onChange={(e) => setSelected({ ...selected, answer: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Button onClick={handleCreate} disabled={loading} className="flex-1 sm:flex-none">Создать</Button>
              <Button onClick={handleUpdate} disabled={loading} className="flex-1 sm:flex-none">Сохранить</Button>
              <Button variant="outline" onClick={() => setSelected(null)} className="w-full sm:w-auto">Сбросить</Button>
            </div>
          </section>

          {/* List Section */}
          <section className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold">Список задач</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4"/> Экспорт
                </Button>
                <Button onClick={handleExportCsv} variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4"/> Экспорт CSV
                </Button>
                
                {/* Скрытые инпуты файлов */}
                <Input
                  id="jsonFileInput"
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => setJsonFile(e.currentTarget.files?.[0] ?? null)}
                />
                <Input
                  id="csvFileInput"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setCsvFile(e.currentTarget.files?.[0] ?? null)}
                />
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto flex-1 truncate" asChild>
                        <label htmlFor="jsonFileInput" className="cursor-pointer flex items-center justify-center">
                        <FileJson className="mr-2 h-4 w-4 shrink-0"/>
                        <span className="truncate">{jsonFile ? jsonFile.name : 'Выбрать JSON'}</span>
                        </label>
                    </Button>
                    <Button variant="secondary" className="w-full sm:w-auto flex-1 truncate" asChild>
                        <label htmlFor="csvFileInput" className="cursor-pointer flex items-center justify-center">
                        <FileJson className="mr-2 h-4 w-4 shrink-0"/>
                        <span className="truncate">{csvFile ? csvFile.name : 'Выбрать CSV'}</span>
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

            {/* Filters */}
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
                    <Button size="sm" className="flex-1 sm:flex-none" onClick={() => {
                        setSelected(t)
                        // Скролл вверх к форме редактрования
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}>
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
      <div className={`col-span-1 border-r h-full flex flex-col min-h-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-muted/10">
            <h3 className="text-lg font-semibold">Пользователи ({users.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loadingUsers && <div className="p-4 text-center text-muted-foreground">Загрузка...</div>}
          {users.map((u) => (
            <div 
                key={u.id} 
                className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedUser?.id === u.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                onClick={() => showStats(u)}
            >
              <div className="font-medium truncate">{u.first_name} {u.last_name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: USER DETAILS */}
      {/* На мобильном показываем только если выбран пользователь. На десктопе (md) показываем всегда. */}
      <div className={`col-span-1 md:col-span-2 lg:col-span-3 h-full overflow-y-auto bg-background ${!selectedUser ? 'hidden md:block' : 'block'}`}>
        {!selectedUser ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <span>Выберите пользователя из списка слева, чтобы просмотреть подробную статистику</span>
          </div>
        ) : (
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 md:animate-none">
            
            {/* Кнопка НАЗАД (только мобилки) */}
            <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden mb-4 -ml-2 text-muted-foreground" 
                onClick={() => setSelectedUser(null)}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
            </Button>

            <div className="mb-6 pb-4 border-b">
                <h3 className="text-2xl font-bold break-words">{selectedUser.first_name} {selectedUser.last_name}</h3>
                <div className="text-sm text-muted-foreground mt-1 break-all">{selectedUser.email}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1 select-all">ID: {selectedUser.id}</div>
            </div>
            
            {userStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg shadow-sm bg-card">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">PVP Арена</div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold">{userStats.pvp?.wins ?? 0}</span>
                    <span className="text-sm text-muted-foreground">побед из {userStats.pvp?.matches ?? 0} матчей</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-50 text-green-700 rounded border border-green-100">
                        <div className="font-bold">{userStats.pvp?.wins ?? 0}</div>
                        <div className="text-[10px] uppercase">Побед</div>
                    </div>
                    <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        <div className="font-bold">{userStats.pvp?.losses ?? 0}</div>
                        <div className="text-[10px] uppercase">Поражений</div>
                    </div>
                    <div className="p-2 bg-gray-50 text-gray-700 rounded border border-gray-100">
                        <div className="font-bold">{userStats.pvp?.draws ?? 0}</div>
                        <div className="text-[10px] uppercase">Ничьих</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg shadow-sm bg-card">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Тренировка</div>
                  <div className="flex items-baseline gap-2 mb-4">
                     <span className="text-3xl font-bold">{userStats.training?.accuracy_pct ?? 0}%</span>
                     <span className="text-sm text-muted-foreground">точность</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>Всего попыток:</span>
                        <span className="font-medium">{userStats.training?.attempts ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Правильных ответов:</span>
                        <span className="font-medium text-green-600">{userStats.training?.correct ?? 0}</span>
                    </div>
                    {/* Прогресс бар визуальный */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary" 
                            style={{ width: `${userStats.training?.accuracy_pct ?? 0}%` }}
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
        )}
      </div>
    </div>
  )
}