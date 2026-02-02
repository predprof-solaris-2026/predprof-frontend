"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

type User = {
  id?: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
}

type UserState = {
  token?: string | null
  adminToken?: string | null
  user?: User | null
  setToken: (token: string | null) => void
  setAdminToken: (token: string | null) => void
  setUser: (user: User | null) => void
  clear: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      adminToken: null,
      user: null,
      setToken: (token) => set(() => ({ token })),
      setAdminToken: (token) => set(() => ({ adminToken: token })),
      setUser: (user) => set(() => ({ user })),
      clear: () => set(() => ({ token: null, adminToken: null, user: null })),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useUserStore
