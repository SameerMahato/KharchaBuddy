#!/bin/bash

# Start all services in development mode using tmux

set -e

SESSION="kharchabuddy"

# Check if tmux session exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  echo "Creating new tmux session: $SESSION"
  
  # Create new session
  tmux new-session -d -s $SESSION -n "gateway"
  
  # Gateway
  tmux send-keys -t $SESSION:gateway "cd gateway && npm run dev" C-m
  
  # Auth Service
  tmux new-window -t $SESSION -n "auth"
  tmux send-keys -t $SESSION:auth "cd services/auth-service && npm run dev" C-m
  
  # Expense Service
  tmux new-window -t $SESSION -n "expense"
  tmux send-keys -t $SESSION:expense "cd services/expense-service && npm run dev" C-m
  
  # Budget Service
  tmux new-window -t $SESSION -n "budget"
  tmux send-keys -t $SESSION:budget "cd services/budget-service && npm run dev" C-m
  
  # AI CFO Service
  tmux new-window -t $SESSION -n "ai-cfo"
  tmux send-keys -t $SESSION:ai-cfo "cd services/ai-cfo-service && npm run dev" C-m
  
  # Prediction Engine
  tmux new-window -t $SESSION -n "prediction"
  tmux send-keys -t $SESSION:prediction "cd services/prediction-engine && npm run dev" C-m
  
  # Social Finance
  tmux new-window -t $SESSION -n "social"
  tmux send-keys -t $SESSION:social "cd services/social-finance && npm run dev" C-m
  
  # Wealth Builder
  tmux new-window -t $SESSION -n "wealth"
  tmux send-keys -t $SESSION:wealth "cd services/wealth-builder && npm run dev" C-m
  
  # Tax Optimizer
  tmux new-window -t $SESSION -n "tax"
  tmux send-keys -t $SESSION:tax "cd services/tax-optimizer && npm run dev" C-m
  
  # Integration Service
  tmux new-window -t $SESSION -n "integration"
  tmux send-keys -t $SESSION:integration "cd services/integration && npm run dev" C-m
  
  # Frontend
  tmux new-window -t $SESSION -n "frontend"
  tmux send-keys -t $SESSION:frontend "cd frontend && npm run dev" C-m
  
  echo "All services started in tmux session: $SESSION"
  echo "Attach to session with: tmux attach -t $SESSION"
  echo "Navigate windows with: Ctrl+b then window number (0-10)"
  echo "Detach with: Ctrl+b then d"
else
  echo "Session $SESSION already exists. Attach with: tmux attach -t $SESSION"
fi
