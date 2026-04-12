# AI CFO Service API Documentation

## Overview

The AI CFO Service provides conversational AI financial advisory capabilities, including personalized advice, daily briefs, spending decisions, and user memory management.

## Base URL

```
/api/ai-cfo
```

## Authentication

All endpoints require authentication. Include JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Chat with AI CFO

Send a message to the AI financial advisor and receive personalized advice.

**Endpoint:** `POST /api/ai-cfo/chat`

**Request Body:**
```json
{
  "message": "How much did I spend this month?",
  "conversationId": "optional_conversation_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "This month you've spent ₹15,450 across 45 transactions. You're at 77% of your monthly budget, which is good progress! Your biggest spending category is Food (₹5,200), followed by Transport (₹3,800).",
    "conversationId": "507f1f77bcf86cd799439011",
    "model": "gpt-4o-mini",
    "cached": false
  }
}
```

**Validation:**
- `message` is required and must be 1-1000 characters
- `conversationId` is optional (creates new conversation if not provided)

---

### 2. Chat with Streaming

Stream AI responses in real-time using Server-Sent Events (SSE).

**Endpoint:** `POST /api/ai-cfo/chat/stream`

**Request Body:**
```json
{
  "message": "Give me a detailed analysis of my spending",
  "conversationId": "optional_conversation_id"
}
```

**Response:** Server-Sent Events stream

```
data: {"chunk":"This"}

data: {"chunk":" month"}

data: {"chunk":" you've"}

data: {"chunk":" spent"}

data: {"done":true,"conversationId":"507f1f77bcf86cd799439011","model":"gpt-4o-mini"}
```

**Client Example:**
```javascript
const response = await fetch('/api/ai-cfo/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ message: 'Hello' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.chunk) {
        console.log(data.chunk);
      } else if (data.done) {
        console.log('Conversation ID:', data.conversationId);
      }
    }
  }
}
```

---

### 3. Get Daily Brief

Receive a comprehensive daily financial briefing.

**Endpoint:** `GET /api/ai-cfo/daily-brief`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Good morning! You've spent ₹450 today. Your recommended daily budget is ₹1,200. Your financial health is excellent! Keep it up! 🎉",
    "todaysBudget": 1200,
    "todaySpent": 450,
    "monthlySpent": 15450,
    "monthlyBudget": 20000,
    "remainingBudget": 4550,
    "daysRemaining": 8,
    "upcomingBills": [],
    "recommendations": [
      {
        "priority": "medium",
        "message": "You're on track with your budget. Consider setting aside some savings.",
        "actionable": true
      }
    ],
    "alerts": [
      {
        "type": "warning",
        "category": "Entertainment",
        "message": "Entertainment budget is at 85%",
        "percentage": 85
      }
    ],
    "financialHealthScore": 87
  }
}
```

**Financial Health Score:**
- 80-100: Excellent
- 60-79: Good
- 40-59: Fair
- 0-39: Needs Attention

---

### 4. Spending Decision Advisor

Get advice on whether to make a purchase.

**Endpoint:** `POST /api/ai-cfo/should-spend`

**Request Body:**
```json
{
  "amount": 2500,
  "category": "Shopping",
  "description": "New laptop bag"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "approved": true,
    "reason": "This expense will use 65% of your Shopping budget. Still within limits.",
    "confidence": 0.8,
    "budgetImpact": {
      "category": "Shopping",
      "currentSpent": 1000,
      "budgetLimit": 5000,
      "afterSpending": 3500,
      "percentageUsed": 70
    },
    "alternatives": [],
    "suggestions": [
      "Monitor remaining spending in this category"
    ]
  }
}
```

**Decision Logic:**
- `approved: false` if spending exceeds budget (>100%)
- `approved: true` with warnings if 75-100% of budget
- `approved: true` if <75% of budget
- Confidence score decreases with higher budget usage

---

### 5. Get Conversations

Retrieve conversation history.

**Endpoint:** `GET /api/ai-cfo/conversations?limit=10`

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "How much did I spend this month?",
      "lastMessageAt": "2024-01-15T10:30:00Z",
      "messages": [
        {
          "role": "user",
          "content": "How much did I spend this month?",
          "timestamp": "2024-01-15T10:30:00Z"
        },
        {
          "role": "assistant",
          "content": "This month you've spent ₹15,450...",
          "timestamp": "2024-01-15T10:30:02Z",
          "model": "gpt-4o-mini"
        }
      ]
    }
  ]
}
```

---

### 6. Get Specific Conversation

Retrieve a single conversation by ID.

**Endpoint:** `GET /api/ai-cfo/conversations/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "title": "Budget advice",
    "status": "active",
    "messages": [...],
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. Archive Conversation

Archive a conversation (removes from active list).

**Endpoint:** `PUT /api/ai-cfo/conversations/:id/archive`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "archived",
    ...
  }
}
```

---

### 8. Get User Memory

Retrieve user's spending patterns and preferences.

**Endpoint:** `GET /api/ai-cfo/memory`

**Response:**
```json
{
  "success": true,
  "data": {
    "spendingPatterns": [
      {
        "category": "Food",
        "frequency": "daily",
        "averageAmount": 350
      },
      {
        "category": "Transport",
        "frequency": "weekly",
        "averageAmount": 800
      }
    ],
    "personality": {
      "spendingStyle": "balanced",
      "planningHorizon": "medium",
      "riskTolerance": "moderate",
      "decisionMaking": "analytical",
      "financialLiteracy": "intermediate"
    },
    "recentInteractions": [
      {
        "timestamp": "2024-01-15T10:30:00Z",
        "type": "chat",
        "content": "How much did I spend?",
        "sentiment": "neutral"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### 9. Analyze Spending Patterns

Trigger analysis of spending patterns (updates user memory).

**Endpoint:** `POST /api/ai-cfo/analyze-patterns`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Food",
      "frequency": "daily",
      "averageAmount": 350
    },
    {
      "category": "Transport",
      "frequency": "weekly",
      "averageAmount": 800
    }
  ]
}
```

**Pattern Frequency:**
- `daily`: 20+ transactions in last 100
- `weekly`: 8-19 transactions
- `monthly`: 3-7 transactions
- `occasional`: <3 transactions

---

### 10. Provide Feedback

Submit feedback on AI responses.

**Endpoint:** `POST /api/ai-cfo/feedback`

**Request Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "messageId": "507f1f77bcf86cd799439013",
  "feedback": "positive",
  "comment": "Very helpful advice!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

**Validation:**
- `feedback` must be "positive" or "negative"
- `comment` is optional

---

## Features

### 1. User Memory System

The AI CFO maintains a memory of:
- **Spending Patterns**: Frequency and average amounts by category
- **Preferences**: Learned from interactions
- **Interactions**: Last 100 chat interactions with sentiment
- **Financial Personality**: Spending style, risk tolerance, planning horizon

Memory is automatically updated with each interaction and used to personalize responses.

### 2. Context Management

Each chat includes:
- User's financial personality
- Current financial state (balance, expenses, budgets)
- Recent spending patterns
- Last 10 messages for conversation continuity

### 3. Response Caching

Common queries are cached for 1 hour:
- "daily brief"
- "spending summary"
- "budget status"
- "how am i doing"
- "financial health"

Cache keys include date to ensure daily invalidation.

### 4. Sentiment Analysis

User messages are analyzed for sentiment:
- **Positive**: Contains words like "good", "great", "thanks"
- **Negative**: Contains words like "worried", "problem", "bad"
- **Neutral**: Default

Sentiment is stored in user memory for personality profiling.

### 5. Fallback System

If LLM services fail or timeout (10 seconds):
1. Try OpenAI first
2. Fallback to Gemini
3. Fallback to rule-based responses

Rule-based responses use actual financial data to provide relevant information.

### 6. Streaming Support

Real-time streaming for better UX:
- Chunks sent as Server-Sent Events (SSE)
- Works with OpenAI streaming API
- Fallback to non-streaming for Gemini

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Common Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid input (missing fields, validation errors) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 404 | Not Found | Conversation or resource not found |
| 500 | Internal Server Error | Server error (logged for debugging) |

---

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Streaming**: 10 concurrent streams per user

---

## Best Practices

### 1. Conversation Management

- Reuse `conversationId` for follow-up questions
- Archive old conversations to keep list clean
- Limit to 10-20 active conversations per user

### 2. Caching

- Common queries are automatically cached
- Cache is invalidated daily
- No need to implement client-side caching for these queries

### 3. Streaming

- Use streaming for long responses or detailed analysis
- Use regular chat for quick questions
- Handle connection errors gracefully

### 4. Feedback

- Encourage users to provide feedback
- Use feedback to improve AI responses
- Track positive/negative ratios

### 5. Memory

- Analyze patterns regularly (weekly)
- Use memory data to personalize UI
- Show users their financial personality

---

## Example Workflows

### Workflow 1: Daily Check-in

```javascript
// 1. Get daily brief
const brief = await fetch('/api/ai-cfo/daily-brief', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. If alerts exist, ask for advice
if (brief.alerts.length > 0) {
  const chat = await fetch('/api/ai-cfo/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'I have budget alerts. What should I do?'
    })
  });
}
```

### Workflow 2: Purchase Decision

```javascript
// 1. Check if should spend
const decision = await fetch('/api/ai-cfo/should-spend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 5000,
    category: 'Shopping',
    description: 'New phone'
  })
});

// 2. If not approved, ask for alternatives
if (!decision.approved) {
  const chat = await fetch('/api/ai-cfo/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'I want to buy a new phone for ₹5000 but it exceeds my budget. What are my options?'
    })
  });
}
```

### Workflow 3: Financial Analysis

```javascript
// 1. Analyze patterns
await fetch('/api/ai-cfo/analyze-patterns', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Get detailed analysis via streaming
const response = await fetch('/api/ai-cfo/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Give me a detailed analysis of my spending patterns and suggest improvements'
  })
});

// 3. Stream response to UI
const reader = response.body.getReader();
// ... handle streaming
```

---

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Gemini Configuration (fallback)
GEMINI_API_KEY=...

# Cache Configuration (optional)
CACHE_TTL=3600000  # 1 hour in milliseconds
```

### Model Selection

The service automatically selects the best available model:
1. **OpenAI GPT-4o-mini**: Primary (fast, cost-effective)
2. **Google Gemini Pro**: Fallback
3. **Rule-based**: Final fallback

---

## Performance

### Response Times

- **Chat (cached)**: <50ms
- **Chat (OpenAI)**: 1-3 seconds
- **Chat (Gemini)**: 2-4 seconds
- **Chat (fallback)**: <100ms
- **Daily Brief**: <200ms
- **Spending Decision**: <100ms

### Optimization Tips

1. Use caching for common queries
2. Use streaming for long responses
3. Analyze patterns in background jobs
4. Limit conversation history to 10 messages

---

## Security

### Data Protection

- All endpoints require authentication
- User data is isolated (row-level security)
- Sensitive data is not sent to LLM providers
- Conversations are encrypted at rest

### Privacy

- User memory is private and not shared
- Conversations are not used for model training
- Financial data is anonymized in logs

---

## Support

For issues or questions:
- Check error logs in Sentry
- Review conversation history for context
- Test with fallback mode (remove API keys)
- Contact support with conversation ID

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release
- OpenAI and Gemini integration
- User memory system
- Daily brief generator
- Spending decision advisor
- Conversation persistence
- Streaming support
- Response caching
- Sentiment analysis
- Fallback system
