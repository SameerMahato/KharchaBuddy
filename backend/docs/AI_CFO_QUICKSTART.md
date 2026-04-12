# AI CFO Service - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Environment Variables

Add to `backend/.env`:

```env
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key-here  # Optional fallback
```

### Step 2: Start the Server

```bash
cd backend
npm start
```

Server runs on `http://localhost:5000`

### Step 3: Test with cURL

#### Get Daily Brief

```bash
curl -X GET http://localhost:5000/api/ai-cfo/daily-brief \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Chat with AI CFO

```bash
curl -X POST http://localhost:5000/api/ai-cfo/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "How much did I spend this month?"
  }'
```

#### Check Spending Decision

```bash
curl -X POST http://localhost:5000/api/ai-cfo/should-spend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 5000,
    "category": "Shopping",
    "description": "New laptop"
  }'
```

## 📊 Quick Examples

### Example 1: Morning Routine

```javascript
// Get daily brief when user logs in
const brief = await fetch('/api/ai-cfo/daily-brief', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(brief.data.summary);
// "Good morning! You've spent ₹450 today..."

console.log(brief.data.financialHealthScore);
// 87
```

### Example 2: Before Making Purchase

```javascript
// Check before spending
const decision = await fetch('/api/ai-cfo/should-spend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 2500,
    category: 'Entertainment'
  })
}).then(r => r.json());

if (decision.data.approved) {
  console.log('✅', decision.data.reason);
} else {
  console.log('❌', decision.data.reason);
  console.log('Suggestions:', decision.data.suggestions);
}
```

### Example 3: Chat Conversation

```javascript
// Start conversation
const response1 = await fetch('/api/ai-cfo/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'How am I doing financially?'
  })
}).then(r => r.json());

console.log(response1.data.message);
const conversationId = response1.data.conversationId;

// Continue conversation
const response2 = await fetch('/api/ai-cfo/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'What should I focus on?',
    conversationId
  })
}).then(r => r.json());

console.log(response2.data.message);
```

## 🎯 Common Use Cases

### Use Case 1: Daily Dashboard Widget

Show daily brief on dashboard:

```javascript
import { useEffect, useState } from 'react';

function DashboardWidget() {
  const [brief, setBrief] = useState(null);

  useEffect(() => {
    fetch('/api/ai-cfo/daily-brief', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setBrief(data.data));
  }, []);

  if (!brief) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>Financial Health: {brief.financialHealthScore}/100</h3>
      <p>{brief.summary}</p>
      <div>
        <span>Today's Budget: ₹{brief.todaysBudget}</span>
        <span>Spent: ₹{brief.todaySpent}</span>
      </div>
      {brief.alerts.map(alert => (
        <div className="alert">{alert.message}</div>
      ))}
    </div>
  );
}
```

### Use Case 2: Expense Form with AI Advice

Add AI advice to expense form:

```javascript
function ExpenseForm() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [advice, setAdvice] = useState(null);

  const checkSpending = async () => {
    const response = await fetch('/api/ai-cfo/should-spend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: parseFloat(amount), category })
    });
    const data = await response.json();
    setAdvice(data.data);
  };

  return (
    <form>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="Food">Food</option>
        <option value="Shopping">Shopping</option>
        {/* ... */}
      </select>
      <button type="button" onClick={checkSpending}>
        Check with AI
      </button>

      {advice && (
        <div className={advice.approved ? 'success' : 'warning'}>
          <p>{advice.reason}</p>
          <p>Budget Impact: {advice.budgetImpact.percentageUsed}%</p>
        </div>
      )}

      <button type="submit">Add Expense</button>
    </form>
  );
}
```

### Use Case 3: AI Chat Assistant

Full chat interface:

```javascript
function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);

  const sendMessage = async () => {
    setMessages([...messages, { role: 'user', content: input }]);
    
    const response = await fetch('/api/ai-cfo/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: input, conversationId })
    });
    
    const data = await response.json();
    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: data.data.message }
    ]);
    setConversationId(data.data.conversationId);
    setInput('');
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## 🔧 Troubleshooting

### Issue: "Failed to chat with AI CFO"

**Solution**: Check if OpenAI API key is set correctly in `.env`

```bash
# Verify environment variable
echo $OPENAI_API_KEY

# Test with fallback mode (remove API keys temporarily)
# Should return rule-based response
```

### Issue: "Unauthorized"

**Solution**: Ensure JWT token is valid and included in Authorization header

```javascript
// Check token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Verify token is not expired
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

### Issue: Slow responses

**Solution**: Use streaming for better UX

```javascript
// Instead of regular chat
const response = await fetch('/api/ai-cfo/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ message: 'Give me detailed advice' })
});

// Stream response
const reader = response.body.getReader();
// ... handle streaming
```

## 📈 Next Steps

1. **Add to Dashboard**: Integrate Daily Brief Widget
2. **Enhance Expense Form**: Add spending decision check
3. **Create Chat Page**: Full AI assistant interface
4. **Add Notifications**: Alert users based on AI recommendations
5. **Track Patterns**: Show user their spending patterns
6. **Personalize**: Use personality data to customize UI

## 📚 Documentation

- [Full API Documentation](./AI_CFO_API.md)
- [Implementation Guide](./AI_CFO_README.md)
- [Frontend Integration](./AI_CFO_FRONTEND_INTEGRATION.md)

## 🎉 You're Ready!

The AI CFO Service is now fully operational. Start with the daily brief, then add chat, and finally integrate spending decisions into your expense workflow.

**Happy coding!** 🚀
