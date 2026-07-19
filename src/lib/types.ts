export type Role = "customer" | "executor" | "admin"

export interface User {
  id: number
  phone: string
  name: string
  username?: string | null
  role: Role
  city_id?: number | null
  city_name?: string | null
  rating: number
  is_blocked: boolean
  block_reason?: string | null
  created_at: string
}

export type OrderStatus =
  | "pending_moderation"
  | "open"
  | "in_progress"
  | "done"
  | "cancelled"
  | "rejected"

export interface Order {
  id: number
  customer_id: number
  customer_name?: string | null
  city_id: number
  city_name?: string | null
  title: string
  description: string
  address: string
  datetime: string
  budget: number
  hourly_rate?: number | null
  hours?: number | null
  workers_needed: number
  accepted_count: number
  status: OrderStatus
  moderation_comment?: string | null
  responses_count: number
  created_at: string
  my_response_status?: ResponseStatus | null
}

export type ResponseStatus = "pending" | "accepted" | "rejected"

export interface OrderResponse {
  id: number
  order_id: number
  executor_id: number
  executor_name?: string | null
  executor_rating?: number | null
  executor_phone?: string | null
  comment?: string | null
  status: ResponseStatus
  created_at: string
}

export interface Review {
  id: number
  order_id: number
  from_user_id: number
  from_user_name?: string | null
  to_user_id: number
  rating: number
  comment?: string | null
  created_at: string
}

export interface Chat {
  id: number
  order_id: number
  order_title?: string | null
  other_user_id?: number | null
  other_user_name?: string | null
  last_message?: string | null
  last_message_at?: string | null
  unread_count: number
  created_at: string
}

export interface Message {
  id: number
  chat_id: number
  sender_id: number
  sender_name?: string | null
  text: string
  type: string
  order_id?: number | null
  order_title?: string | null
  order_description?: string | null
  order_address?: string | null
  order_city?: string | null
  order_budget?: number | null
  order_datetime?: string | null
  is_read: boolean
  created_at: string
}

export interface City {
  id: number
  name: string
  slug: string
  is_active: boolean
}
