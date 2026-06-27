export type CompanyPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type UserRole = 'owner' | 'admin' | 'agent'
export type ConversationStatus = 'open' | 'closed' | 'pending'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'template'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface Company {
  id: string
  name: string
  email: string
  plan: CompanyPlan
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WhatsappNumber {
  id: string
  companyId: string
  phoneNumberId: string
  wabaId: string
  phoneNumber: string
  displayName: string
  isActive: boolean
  webhookVerifyToken: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  companyId: string
  phone: string
  name: string
  email?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  companyId: string
  contactId: string
  contact: Contact
  whatsappNumberId: string
  whatsappNumber: WhatsappNumber
  status: ConversationStatus
  lastMessageAt: string
  assignedUserId?: string
  assignedUser?: User
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  companyId: string
  direction: MessageDirection
  type: MessageType
  content: string
  whatsappMessageId?: string
  status: MessageStatus
  metadata?: Record<string, any>
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface AuthResponse {
  accessToken: string
  user: User
  company?: Company
}
