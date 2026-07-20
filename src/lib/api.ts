import axios from "axios"

export const TOKEN_KEY = "tw_token"

const client = axios.create({
  baseURL: "/api/v1",
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

import type { ReferralInfo, Boost } from "./types"

export async function getReferralInfo(): Promise<ReferralInfo> {
  const r = await client.get<ReferralInfo>("/referrals/me")
  return r.data
}

export async function getActiveBoosts(): Promise<Boost[]> {
  const r = await client.get<Boost[]>("/referrals/active")
  return r.data
}

export async function applyBoost(type: "order" | "response", target_id: number, level: number): Promise<Boost> {
  const r = await client.post<Boost>("/referrals/apply", { type, target_id, level })
  return r.data
}

export default client
