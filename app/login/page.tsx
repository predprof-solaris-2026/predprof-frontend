"use client"

import React, { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, Loader2 } from "lucide-react"
import useUserStore from "@/lib/store/userStore"
import { setTokenCookie } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
  registrationUserApiUserCreatePost,
  logInUserApiUserLoginPost,
} from "@/lib/client"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setToken = useUserStore((s) => s.setToken)
  const setUser = useUserStore((s) => s.setUser)
  const router = useRouter()
  type LocalUser = { id?: string; email?: string; first_name?: string; last_name?: string }
  
  function validateEmail(e: string) {
    return /\S+@\S+\.\S+/.test(e)
  }

  const handleRegister = async () => {
    setError(null)
    if (!firstName || !lastName) return setError("Укажите имя и фамилию")
    if (!validateEmail(email)) return setError("Неверный email")
    if (password.length < 6) return setError("Пароль должен быть не менее 6 символов")

    setLoading(true)
    try {
      await registrationUserApiUserCreatePost({
        body: { first_name: firstName, last_name: lastName, password, email },
      })
      
      const loginResp: unknown = await logInUserApiUserLoginPost({ body: { username: email, password } })
      const loginData = loginResp && typeof loginResp === "object" && "data" in (loginResp as Record<string, unknown>) ? (loginResp as Record<string, unknown>).data : loginResp
      const token = (loginData as Record<string, unknown>)?.access_token ?? (loginData as Record<string, unknown>)?.token ?? null
      if (token) {
        setTokenCookie(String(token))
        setToken(String(token))
        const u = (loginData as Record<string, unknown>)?.user ?? (loginData as Record<string, unknown>)?.user_info ?? (loginData as Record<string, unknown>)?.profile ?? null
        if (u) setUser(u as unknown as LocalUser)
        router.push("/profile")
        return
      } else {
        setError("Не удалось получить токен после регистрации")
      }
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      setError(msg || "Ошибка регистрации")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setError(null)
    if (!validateEmail(email)) return setError("Неверный email")
    if (!password) return setError("Укажите пароль")

    setLoading(true)
    try {
      const resp: unknown = await logInUserApiUserLoginPost({ body: { username: email, password } })
      const data = resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data : resp
      const token = (data as Record<string, unknown>)?.access_token ?? (data as Record<string, unknown>)?.token ?? null
      if (token) {
        setTokenCookie(String(token))
        setToken(String(token))
        const u = (data as Record<string, unknown>)?.user ?? (data as Record<string, unknown>)?.user_info ?? (data as Record<string, unknown>)?.profile ?? null
        if (u) setUser(u as unknown as LocalUser)
        router.push("/profile")
        return
      }
    } catch (e: unknown) {
      const msg = typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message) : String(e)
      setError(msg || "Ошибка входа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login"
              ? "Введите данные для входа в систему"
              : "Заполните форму для регистрации"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(val) => setMode(val as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-login"
                    placeholder="name@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-login">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-login"
                    type="password"
                    placeholder="••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            
            <TabsContent value="register" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname">Имя</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstname"
                      placeholder="Иван"
                      className="pl-9"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Фамилия</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastname"
                      placeholder="Иванов"
                      className="pl-9"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-register">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-register"
                    placeholder="name@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-register">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-register"
                    type="password"
                    placeholder="••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>

        <CardFooter>
          {mode === "login" ? (
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Войти
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Зарегистрироваться
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}