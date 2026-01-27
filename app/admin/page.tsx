"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
  getTasksApiTasksGet,
  postTasksApiTasksUploadPost,
  updateTaskApiTasksTaskIdPatch,
  deleteTaskApiTasksTaskIdDelete,
  getTasksToJsonApiTasksExportGet,
  postTasksApiTasksUploadImportJsonPost,
} from '@/lib/client'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const { toast } = useToast()
  const [qTitle, setQTitle] = useState('')
  const [qStatement, setQStatement] = useState('')
  const [qSubject, setQSubject] = useState('')
  const [qTheme, setQTheme] = useState('')
  const [qDifficulty, setQDifficulty] = useState('')

  useEffect(() => {
    // check admin
    fetch('/api/admin/me').then((r) => {
      if (r.ok) setIsAdmin(true)
      else setIsAdmin(false)
    }).catch(() => setIsAdmin(false))
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const resp = await getTasksApiTasksGet()
      const data = (resp as any)?.data || []
      setTasks(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogin = async () => {
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (res.ok) {
      setIsAdmin(true)
      toast({ title: 'Вход выполнен', variant: 'success' })
    } else {
      toast({ title: 'Неверный пароль', variant: 'destructive' })
    }
  }

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await postTasksApiTasksUploadPost({ body: selected })
      toast({ title: 'Создано', variant: 'success' })
      setSelected(null)
      loadTasks()
    } catch (e: any) {
      toast({ title: e?.message || 'Ошибка', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    if (!selected?.id) return
    setLoading(true)
    try {
      await updateTaskApiTasksTaskIdPatch({ path: { task_id: selected.id }, body: selected })
      toast({ title: 'Обновлено', variant: 'success' })
      loadTasks()
    } catch (e: any) {
      toast({ title: e?.message || 'Ошибка', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить задачу?')) return
    try {
      await deleteTaskApiTasksTaskIdDelete({ path: { task_id: id } })
      toast({ title: 'Удалено', variant: 'success' })
      loadTasks()
    } catch (e: any) {
      toast({ title: e?.message || 'Ошибка', variant: 'destructive' })
    }
  }

  const handleExport = async () => {
    try {
      const resp = await getTasksToJsonApiTasksExportGet()
      const blob = new Blob([JSON.stringify((resp as any)?.data || {}, null, 2)], { type: 'application/json' })
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
      await postTasksApiTasksUploadImportJsonPost({ body: { file: jsonFile as any } })
      toast({ title: 'Импорт завершён', variant: 'success' })
      loadTasks()
    } catch (e: any) {
      toast({ title: e?.message || 'Ошибка импорта', variant: 'destructive' })
    }
  }

  if (isAdmin === null) return <div>Проверка...</div>

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl mb-4">Админ вход</h2>
        <div className="space-y-2">
          <Label>Пароль</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleLogin}>Войти</Button>
          </div>
        </div>
      </div>
    )
  }

  const filtered = tasks.filter((t) => {
    const title = (t.title || '').toString().toLowerCase()
    const statement = (t.task_text || t.task_text || '').toString().toLowerCase()
    const subject = (t.subject || '').toString().toLowerCase()
    const theme = (t.theme || '').toString().toLowerCase()
    const difficulty = (t.difficulty || '').toString().toLowerCase()

    if (qTitle && !title.includes(qTitle.toLowerCase())) return false
    if (qStatement && !statement.includes(qStatement.toLowerCase())) return false
    if (qSubject && !subject.includes(qSubject.toLowerCase())) return false
    if (qTheme && !theme.includes(qTheme.toLowerCase())) return false
    if (qDifficulty && qDifficulty !== 'all' && !difficulty.includes(qDifficulty.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="p-4 border rounded">
        <h3 className="text-xl mb-3">Создать / Редактировать</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Заголовок</Label>
            <Input value={selected?.title || ''} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Предмет</Label>
            <Input value={selected?.subject || ''} onChange={(e) => setSelected({ ...selected, subject: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Тема</Label>
            <Input value={selected?.theme || ''} onChange={(e) => setSelected({ ...selected, theme: e.target.value })} />
          </div>
          <div className="space-y-1">
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
          <div className="col-span-2 space-y-1">
            <Label>Условие</Label>
            <Textarea value={selected?.task_text || ''} onChange={(e) => setSelected({ ...selected, task_text: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Подсказка</Label>
            <Input value={selected?.hint || ''} onChange={(e) => setSelected({ ...selected, hint: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Ответ</Label>
            <Input value={selected?.answer || ''} onChange={(e) => setSelected({ ...selected, answer: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleCreate} disabled={loading}>Создать</Button>
          <Button onClick={handleUpdate} disabled={loading}>Сохранить</Button>
          <Button variant="outline" onClick={() => setSelected(null)}>Сбросить</Button>
        </div>
      </section>

      <section className="p-4 border rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">Задачи</h2>
          <div className="flex gap-2">
            <Button onClick={handleExport}>Экспорт</Button>
            <Input
              id="jsonFileInput"
              name="jsonFileInput"
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => setJsonFile(e.currentTarget.files?.[0] ?? null)}
            />
          <Button>
            <label htmlFor="jsonFileInput" className="cursor-pointer">
              {jsonFile ? jsonFile.name : 'Файл не выбран'}
            </label>
          </Button>
            <Button onClick={handleImport}>Импорт</Button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 mb-4">
          <div className="col-span-2 space-y-1">
            <Label>По заголовку</Label>
            <Input value={qTitle} onChange={(e) => setQTitle(e.target.value)} placeholder="Поиск по заголовку" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>По условию</Label>
            <Input value={qStatement} onChange={(e) => setQStatement(e.target.value)} placeholder="Поиск по условию" />
          </div>
          <div className="space-y-1">
            <Label>Предмет</Label>
            <Input value={qSubject} onChange={(e) => setQSubject(e.target.value)} placeholder="Предмет" />
          </div>
          <div className="space-y-1">
            <Label>Тема</Label>
            <Input value={qTheme} onChange={(e) => setQTheme(e.target.value)} placeholder="Тема" />
          </div>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <div className="space-y-1">
            <Label>Сложность</Label>
            <Select value={qDifficulty} onValueChange={(v) => setQDifficulty(v)}>
              <SelectTrigger className="w-40">
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
          <Button variant="outline" onClick={() => { setQTitle(''); setQStatement(''); setQSubject(''); setQTheme(''); setQDifficulty('') }} className='w-fit'>Сбросить фильтры</Button>
        </div>

        <div className="space-y-3">
          {filtered.map((t: any) => (
            <div key={t.id} className="p-3 border rounded flex justify-between items-start">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-muted-foreground">{t.subject} — {t.theme}</div>
                <div className="text-sm text-muted-foreground">{t.task_text?.slice(0, 200)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setSelected(t)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>Удалить</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
