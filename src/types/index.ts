export type CompanyPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type UserRole = 'owner' | 'admin' | 'agent'
export type ConversationStatus = 'open' | 'closed' | 'pending'
export type AiState = 'waiting_name' | 'human_requested' | null
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
  allowedNumberIds: string[] | null
  canConfigureBot: boolean
  canSendBroadcast: boolean
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
  systemPrompt: string | null
  botHistoryLimit: number
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  companyId: string
  phone: string
  name: string
  email?: string
  companyName?: string
  notes?: string
  birthDate?: string | null
  externalId?: string | null
  tags?: Tag[]
  metadata?: Record<string, any>
  automationOptOut?: boolean
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  companyId: string
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
  aiState: AiState
  lastMessageAt: string
  lastInboundAt: string | null
  assignedUserId?: string
  assignedUser?: User
  tags: Tag[]
  campaignPrompt: string | null
  campaignBroadcastId: string | null
  campaignExpiresAt: string | null
  waitingReply: boolean
  createdAt: string
  updatedAt: string
}

export type AiPromptSource = 'campaign' | 'system' | 'default'

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
  aiPromptSource: AiPromptSource | null
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  createdAt: string
  updatedAt: string
}

export type ConversationEventType =
  | 'campaign_activated'
  | 'campaign_reset_human'
  | 'campaign_reset_manual'
  | 'campaign_expired'

export interface ConversationEvent {
  id: string
  conversationId: string
  type: ConversationEventType
  metadata: Record<string, any> | null
  createdAt: string
}

export interface SavedMessage {
  id: string
  companyId: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export type BroadcastType = 'text' | 'template'
export type BroadcastMode = 'standard' | 'csv'
export type BroadcastStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'paused' | 'failed'
export type RecipientStatus = 'pending' | 'sent' | 'failed'

export interface IntentRule {
  intent: string
  tagId: string
}

export interface Broadcast {
  id: string
  companyId: string
  whatsappNumberId: string
  whatsappNumber?: WhatsappNumber
  name: string
  type: BroadcastType
  mode: BroadcastMode
  message: string | null
  templateName: string | null
  templateLanguage: string | null
  campaignPromptId: string | null
  campaignPrompt: string | null
  intentRules: IntentRule[] | null
  tagId: string | null
  tag?: Tag | null
  status: BroadcastStatus
  totalCount: number
  sentCount: number
  failedCount: number
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ResponseSentiment = 'positive' | 'negative' | 'neutral'

export interface BroadcastRecipient {
  id: string
  broadcastId: string
  contactId: string
  contact: Contact
  status: RecipientStatus
  error: string | null
  sentAt: string | null
  respondedAt: string | null
  responseSentiment: ResponseSentiment | null
  createdAt: string
}

export interface BroadcastResponseEntry {
  recipientId: string
  contactId: string
  contactName: string
  contactPhone: string
  sentAt: string | null
  respondedAt: string
  responseTimeMinutes: number | null
  conversationId: string | null
  conversationStatus: string | null
  sentiment: ResponseSentiment | null
  messages: { content: string; createdAt: string }[]
}

export interface BroadcastNoResponseEntry {
  recipientId: string
  contactId: string
  contactName: string
  contactPhone: string
  sentAt: string | null
  conversationId: string | null
  conversationStatus: string | null
}

export interface BroadcastResponses {
  stats: {
    total: number
    sent: number
    failed: number
    responded: number
    responseRate: number
    avgResponseMinutes: number | null
    sentiment: { positive: number; negative: number; neutral: number }
  }
  responses: BroadcastResponseEntry[]
  noResponse: BroadcastNoResponseEntry[]
}

export interface WhatsappTemplate {
  id: string
  companyId: string
  whatsappNumberId: string
  metaId: string
  name: string
  language: string
  status: string
  category: string | null
  bodyText: string | null
  variablesCount: number
  syncedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CampaignPrompt {
  id: string
  companyId: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PromptVersion {
  id: string
  promptId: string
  name: string
  content: string
  savedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export type AutomationTriggerType = 'birthday' | 'payment_overdue' | 'repurchase'
export type AutomationExecutionStatus = 'sent' | 'failed'

export interface AutomationRule {
  id: string
  companyId: string
  name: string
  type: AutomationTriggerType
  whatsappNumberId: string
  whatsappNumber?: WhatsappNumber
  triggerOffsetDays: number
  messageType: 'text' | 'template'
  messageTemplate: string | null
  templateName: string | null
  templateLanguage: string | null
  templateVariables: string[] | null
  campaignPromptId: string | null
  campaignPrompt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AutomationExecution {
  id: string
  companyId: string
  ruleId: string
  rule?: { id: string; name: string; type: AutomationTriggerType }
  contactId: string
  contact?: Contact
  dedupeKey: string
  conversationId: string | null
  resolvedMessage: string | null
  resolvedTemplateVariables: string[] | null
  status: AutomationExecutionStatus
  error: string | null
  // joined from messages:
  messageStatus?: string | null
  responded?: boolean
  createdAt: string
}

export interface UpcomingDispatch {
  date: string
  rule: { id: string; name: string; type: AutomationTriggerType }
  contact: { id: string; name: string; phone: string }
  wouldSkip: boolean
}

export interface AutomationStats {
  sent: number
  failed: number
  delivered: number
  read: number
  responded: number
}

export interface AudienceContact {
  contactId: string
  contactName: string
  contactPhone: string
  status: 'will_send' | 'already_sent' | 'opted_out'
  extra?: string
}

export interface AutomationAudience {
  contacts: AudienceContact[]
  total: number
  willSend: number
}

export interface ContactProductSetting {
  id: string
  companyId: string
  contactId: string
  productId: string
  product?: Product
  repurchaseIntervalDays: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  companyId: string
  name: string
  defaultPrice: number | null
  repurchaseIntervalDays: number | null
  createdAt: string
  updatedAt: string
}

export type PaymentStatus = 'paid' | 'pending'

export interface Sale {
  id: string
  externalId: string | null
  companyId: string
  contactId: string
  contact?: Contact
  productId: string
  product?: Product
  saleDate: string
  quantity: number
  unitPrice: number
  totalValue: number
  paymentStatus: PaymentStatus
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FollowOnType = 'meeting' | 'call' | 'message' | 'message_manual'
export type FollowOnStatus = 'pending' | 'done' | 'cancelled'

export interface FollowOn {
  id: string
  companyId: string
  conversationId: string
  assignedUserId: string | null
  assignedUser?: User | null
  type: FollowOnType
  scheduledAt: string
  note: string | null
  message: string | null
  templateName: string | null
  templateLanguage: string | null
  templateVariables: string[] | null
  status: FollowOnStatus
  sentAt: string | null
  createdAt: string
  updatedAt: string
  // joined on frontend
  conversation?: Conversation
}

export interface AppNotification {
  id: string
  companyId: string
  userId: string
  title: string
  body: string | null
  conversationId: string | null
  followOnId: string | null
  readAt: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  user: User
  company?: Company
}
