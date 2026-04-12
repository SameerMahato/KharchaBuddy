# AI CFO Service

Conversational AI interface that acts as a personal CFO for users.

## Features

- **Conversational Interface**: Natural language chat with streaming responses
- **User Memory**: Personalized responses based on user history and preferences
- **Daily Briefs**: Automated financial summaries and insights
- **Spending Advisor**: Real-time spending decision support
- **Multi-LLM Support**: OpenAI GPT-4 and Google Gemini with fallback
- **Context-Aware**: Loads user financial data for informed responses
- **Caching**: Response caching for common queries

## API Endpoints

### Chat
- `POST /api/chat` - Send message to AI CFO
- `POST /api/chat/stream` - Stream AI CFO responses
- `GET /api/conversations/:userId` - Get conversation history
- `DELETE /api/conversations/:conversationId` - Delete conversation

### Daily Brief
- `GET /api/brief/:userId` - Get daily financial brief
- `POST /api/brief/:userId/generate` - Generate new daily brief

### User Memory
- `GET /api/memory/:userId` - Get user memory
- `POST /api/memory/:userId` - Update user memory
- `DELETE /api/memory/:userId` - Clear user memory

### Health
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Environment Variables

See `.env.example` for required configuration.

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Architecture

- **LLM Integration**: OpenAI GPT-4o-mini (primary), Google Gemini Pro (fallback)
- **Memory System**: MongoDB for conversation history and user memory
- **Caching**: Redis for response caching (30-min TTL)
- **Event Publishing**: Kafka for conversation events
- **Monitoring**: Prometheus metrics for LLM latency and usage

## Performance

- Target response time: < 3s
- Streaming response: < 500ms first token
- Cache hit rate: > 40%
- Uptime: 99.9%
