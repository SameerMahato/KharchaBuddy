// Shared TypeScript Types for KharchaBuddy AI Financial Operating System

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  monthlyIncome: number;
  currency: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  financialGoals: FinancialGoal[];
  aiPersonality: 'professional' | 'friendly' | 'casual';
  nudgeFrequency: 'high' | 'medium' | 'low';
  communicationChannels: ('email' | 'sms' | 'push')[];
  connectedBanks: BankConnection[];
  upiIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  category: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  date: Date;
  source: 'manual' | 'bank_api' | 'upi' | 'sms' | 'email';
  sourceId?: string;
  autoCategories: CategorySuggestion[];
  isAnomaly: boolean;
  anomalyScore?: number;
  receiptUrl?: string;
  receiptData?: ReceiptData;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawTransaction {
  amount: number;
  currency?: string;
  merchant?: string;
  timestamp: Date;
  source: 'manual' | 'bank_api' | 'upi' | 'sms' | 'email';
  sourceId?: string;
  rawText?: string;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: Date;
  items: ReceiptItem[];
  taxAmount?: number;
  totalAmount: number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// ============================================================================
// Budget Types
// ============================================================================

export interface Budget {
  id: string;
  userId: string;
  name: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  categories: CategoryBudget[];
  totalAmount: number;
  isAdaptive: boolean;
  adaptationRules: AdaptationRule[];
  adjustmentHistory: BudgetAdjustment[];
  smartSavingEnabled: boolean;
  smartSavingConfig?: SmartSavingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryBudget {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  isFlexible: boolean;
}

export interface AdaptationRule {
  trigger: 'overspend' | 'underspend' | 'pattern_change';
  action: 'increase' | 'decrease' | 'reallocate';
  threshold: number;
  enabled: boolean;
}

export interface BudgetAdjustment {
  timestamp: Date;
  reason: string;
  changes: CategoryChange[];
  triggeredBy: 'system' | 'user' | 'ai';
}

export interface CategoryChange {
  category: string;
  oldAllocation: number;
  newAllocation: number;
  change: number;
  reason: string;
}

export interface SmartSavingConfig {
  enabled: boolean;
  aggressiveness: 'low' | 'medium' | 'high';
  targetSavingsRate: number;
  protectedCategories: string[];
}

// ============================================================================
// AI CFO Types
// ============================================================================

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'archived';
  messages: Message[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  model?: string;
  actions?: Action[];
  feedback?: 'positive' | 'negative';
  feedbackComment?: string;
}

export interface ConversationContext {
  conversationId: string;
  previousMessages: Message[];
  userProfile: UserProfile;
  currentFinancialState: FinancialSnapshot;
}

export interface AIResponse {
  message: string;
  suggestions: Suggestion[];
  actions: Action[];
  confidence: number;
}

export interface Suggestion {
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Action {
  type: string;
  label: string;
  data?: Record<string, any>;
}

export interface DailyBrief {
  summary: string;
  todaysBudget: number;
  upcomingBills: Bill[];
  recommendations: Recommendation[];
  alerts: Alert[];
  financialHealthScore: number;
}

export interface Bill {
  name: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  message: string;
  actionable: boolean;
  actions?: Action[];
}

export interface Alert {
  type: 'info' | 'warning' | 'danger';
  category: string;
  message: string;
  percentage?: number;
}

export interface FinancialSnapshot {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  goals: FinancialGoal[];
  budgetStatus: Record<string, number>;
}

// ============================================================================
// Prediction Types
// ============================================================================

export interface ExpensePrediction {
  category: string;
  amount: number;
  probability: number;
  expectedDate: Date;
  reasoning: string;
}

export interface CashFlowForecast {
  predictions: DailyPrediction[];
  confidence: number;
  factors: ForecastFactor[];
  warnings: Warning[];
}

export interface DailyPrediction {
  date: Date;
  expectedIncome: number;
  expectedExpenses: number;
  netCashFlow: number;
  balance: number;
  confidenceInterval: [number, number];
}

export interface ForecastFactor {
  name: string;
  impact: number;
}

export interface Warning {
  date: Date;
  type: 'negative_balance' | 'low_balance';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface SpendingPattern {
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  averageAmount: number;
  timeOfDay?: string;
  dayOfWeek?: string;
  seasonality?: string;
}

// ============================================================================
// Anomaly Detection Types
// ============================================================================

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyType: 'fraud' | 'unusual_amount' | 'unusual_merchant' | 'unusual_time' | 'duplicate';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  suggestedAction: string;
}

export interface SpendingBaseline {
  mean: number;
  stdDev: number;
  knownMerchants: string[];
  lastTransactionTime: number;
  isEstablished: boolean;
  model: any;
}

// ============================================================================
// Loan & Social Finance Types
// ============================================================================

export interface Loan {
  id: string;
  userId: string;
  friendId?: string;
  friendName: string;
  amount: number;
  remainingAmount: number;
  currency: string;
  type: 'given' | 'received';
  dateGiven: Date;
  expectedReturnDate?: Date;
  dateReturned?: Date;
  isPaidBack: boolean;
  isReturnedOnTime?: boolean;
  partialPayments: PartialPayment[];
  trustScoreAtTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  reminderConfig?: ReminderConfig;
  remindersSent: ReminderLog[];
  description: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartialPayment {
  amount: number;
  date: Date;
  notes: string;
}

export interface TrustScore {
  friendId: string;
  score: number;
  factors: TrustFactor[];
  history: TrustEvent[];
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TrustFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface TrustEvent {
  timestamp: Date;
  type: string;
  impact: number;
}

export interface ReminderConfig {
  frequency: 'daily' | 'weekly' | 'biweekly';
  tone: 'friendly' | 'neutral' | 'firm';
  escalation: boolean;
  channels: ('sms' | 'email' | 'push')[];
}

export interface ReminderLog {
  sentAt: Date;
  channel: 'sms' | 'email' | 'push';
  tone: 'friendly' | 'neutral' | 'firm';
  response?: string;
}

// ============================================================================
// Financial Goal Types
// ============================================================================

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'retirement';
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: Date;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoContribute: boolean;
  monthlyContribution?: number;
  milestones: Milestone[];
  contributions: Contribution[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Milestone {
  percentage: number;
  amount: number;
  targetDate: Date;
  achieved: boolean;
  achievedDate?: Date;
}

export interface Contribution {
  amount: number;
  date: Date;
  source: 'manual' | 'auto' | 'roundup';
}

// ============================================================================
// Bank Integration Types
// ============================================================================

export interface BankConnection {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'credit';
  status: 'active' | 'inactive' | 'error';
  lastSynced: Date;
}

export interface BankCredentials {
  bankId: string;
  authMethod: 'oauth' | 'credentials' | 'netbanking';
  credentials: Record<string, string>;
}

export interface WebhookPayload {
  source: string;
  eventType: string;
  data: any;
  timestamp: Date;
  signature: string;
}

// ============================================================================
// Tax Optimization Types
// ============================================================================

export interface TaxAnalysis {
  financialYear: string;
  estimatedIncome: number;
  currentDeductions: Deduction[];
  potentialSavings: number;
  recommendations: TaxRecommendation[];
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

export interface Deduction {
  section: string;
  category: string;
  amount: number;
  date: Date;
}

export interface TaxRecommendation {
  section: string;
  suggestion: string;
  potentialSaving: number;
  deadline?: Date;
}

export interface Section80COptimization {
  totalLimit: number;
  utilized: number;
  remaining: number;
  suggestions: Investment80C[];
  deadline: Date;
}

export interface Investment80C {
  instrument: string;
  amount: number;
  taxSaving: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// Scenario Simulation Types
// ============================================================================

export interface Scenario {
  name: string;
  timeHorizon: number;
  assumptions: Assumption[];
  changes: FinancialChange[];
}

export interface Assumption {
  type: 'income' | 'expense' | 'investment_return' | 'inflation';
  value: number;
}

export interface FinancialChange {
  type: string;
  amount: number;
  frequency?: string;
  investmentType?: string;
}

export interface SimulationResult {
  scenario: Scenario;
  projections: MonthlyProjection[];
  finalBalance: number;
  totalSavings: number;
  totalInvestmentGains: number;
  insights: string[];
  risks: string[];
}

export interface MonthlyProjection {
  month: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  balance: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: string;
  type: string;
  userId: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TransactionCreatedEvent extends Event {
  type: 'transaction.created';
  data: {
    transactionId: string;
    amount: number;
    category: string;
    timestamp: Date;
  };
}

export interface BudgetAdjustedEvent extends Event {
  type: 'budget.adjusted';
  data: {
    budgetId: string;
    adjustment: BudgetAdjustment;
  };
}

export interface AnomalyDetectedEvent extends Event {
  type: 'anomaly.detected';
  data: {
    transactionId: string;
    anomalyResult: AnomalyResult;
  };
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'push')[];
  data?: Record<string, any>;
  sentAt?: Date;
  deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'>;
  createdAt: Date;
}

// ============================================================================
// User Memory Types
// ============================================================================

export interface UserMemory {
  userId: string;
  spendingPatterns: SpendingPattern[];
  preferences: UserPreference[];
  interactions: Interaction[];
  personality: FinancialPersonality;
  embeddings: MemoryEmbedding[];
  lastUpdated: Date;
}

export interface UserPreference {
  key: string;
  value: any;
  confidence: number;
  learnedFrom: string[];
  lastUpdated: Date;
}

export interface Interaction {
  timestamp: Date;
  type: 'chat' | 'decision' | 'feedback' | 'action';
  content: string;
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface FinancialPersonality {
  spendingStyle: 'frugal' | 'balanced' | 'liberal';
  planningHorizon: 'short' | 'medium' | 'long';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  decisionMaking: 'analytical' | 'intuitive' | 'mixed';
  financialLiteracy: 'beginner' | 'intermediate' | 'advanced';
}

export interface MemoryEmbedding {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
