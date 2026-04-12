# Budget Service

Autonomous budget management with adaptive adjustments and behavioral nudging.

## Features

- **Adaptive Budgeting**: Automatically adjusts budget allocations based on spending patterns
- **Behavioral Nudging**: Sends timely reminders when approaching budget limits
- **Smart Saving Mode**: Identifies saving opportunities and automates transfers
- **Budget Performance Analysis**: Tracks utilization and provides insights
- **Event-Driven**: Reacts to transaction events in real-time

## API Endpoints

### Budgets

- `POST /api/budgets` - Create a new budget
- `GET /api/budgets` - Get all user budgets
- `GET /api/budgets/active` - Get active budget for current period
- `GET /api/budgets/:budgetId` - Get specific budget
- `POST /api/budgets/:budgetId/adjust` - Manually trigger budget adjustment
- `GET /api/budgets/analysis` - Get budget performance analysis
- `POST /api/budgets/smart-saving/enable` - Enable smart saving mode

### Nudges

- `GET /api/nudges` - Get user nudges
- `GET /api/nudges/effectiveness` - Get nudge effectiveness metrics
- `PATCH /api/nudges/:nudgeId/read` - Mark nudge as read
- `PATCH /api/nudges/:nudgeId/acted` - Mark nudge as acted upon
- `DELETE /api/nudges/:nudgeId` - Dismiss nudge

## Environment Variables

```
PORT=3002
MONGODB_URI=mongodb://admin:password123@localhost:27017/kharchabuddy?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
KAFKA_BROKER=localhost:9092
SENTRY_DSN=your_sentry_dsn
NODE_ENV=development
```

## Running the Service

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Architecture

The Budget Service follows an event-driven architecture:

1. Listens to `transaction.created` and `expense.created` events
2. Updates budget spending in real-time
3. Checks thresholds and sends nudges when needed
4. Automatically adjusts budgets based on patterns
5. Publishes `budget.adjusted` events

## Adaptive Budget Algorithm

The service implements intelligent budget adjustments:

- **Overspend Detection**: If category spending exceeds 120% of allocation, increase by 15%
- **Underspend Detection**: If category spending is below 50% of allocation, decrease by 10%
- **Rebalancing**: Maintains total budget amount by redistributing across flexible categories
- **Optimistic Locking**: Uses version numbers to prevent concurrent modification conflicts

## Behavioral Nudging

Nudges are sent at strategic thresholds:

- **75% threshold**: Gentle reminder with suggestions
- **90% threshold**: Firm warning with actionable options
- **Daily limit**: Maximum 3 nudges per day to avoid fatigue
- **Deduplication**: Prevents duplicate nudges for same threshold

## Smart Saving Mode

When enabled, the service:

- Analyzes spending patterns to identify saving opportunities
- Suggests reductions in flexible categories
- Targets savings rate based on aggressiveness level (5%/10%/20%)
- Protects user-specified essential categories
- Automates fund transfers to savings accounts
