import { CategorySuggestion } from '@kharchabuddy/shared';
import { getRedisClient } from '../config/redis';
import { logger } from '@kharchabuddy/shared';

// Predefined categories
const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Personal Care',
  'Home & Garden',
  'Gifts & Donations',
  'Insurance',
  'Investments',
  'Other',
];

// Merchant to category mapping (rule-based fallback)
const MERCHANT_PATTERNS: Record<string, string> = {
  // Food & Dining
  'swiggy|zomato|uber eats|dominos|pizza|restaurant|cafe|food': 'Food & Dining',
  'mcdonald|kfc|burger|subway': 'Food & Dining',
  
  // Transportation
  'uber|ola|rapido|metro|petrol|diesel|fuel': 'Transportation',
  
  // Shopping
  'amazon|flipkart|myntra|ajio|shopping|mall': 'Shopping',
  
  // Entertainment
  'netflix|prime|hotstar|spotify|movie|cinema|pvr': 'Entertainment',
  
  // Bills & Utilities
  'electricity|water|gas|internet|broadband|mobile|recharge': 'Bills & Utilities',
  
  // Groceries
  'bigbasket|grofers|blinkit|dmart|supermarket|grocery': 'Groceries',
  
  // Healthcare
  'hospital|clinic|pharmacy|medicine|doctor|health': 'Healthcare',
  
  // Education
  'school|college|university|course|tuition|education': 'Education',
  
  // Travel
  'flight|hotel|booking|makemytrip|goibibo|travel': 'Travel',
};

interface CategorizationResult {
  category: string;
  subcategory?: string;
  suggestions: CategorySuggestion[];
}

export class CategorizationService {
  /**
   * Categorize a transaction using ML model or rule-based fallback
   */
  async categorizeTransaction(
    merchantOrDescription: string,
    amount: number
  ): Promise<CategorizationResult> {
    try {
      // Try ML model first (if available)
      const mlResult = await this.categorizeMl(merchantOrDescription, amount);
      
      if (mlResult && mlResult.confidence >= 0.7) {
        return {
          category: mlResult.category,
          suggestions: [mlResult],
        };
      }

      // Fallback to rule-based categorization
      const ruleBasedResult = this.categorizeRuleBased(merchantOrDescription);
      
      // If ML had low confidence, include both ML and rule-based suggestions
      const suggestions: CategorySuggestion[] = [];
      
      if (mlResult) {
        suggestions.push(mlResult);
      }
      
      suggestions.push(ruleBasedResult);
      
      // Add one more alternative suggestion
      const alternative = this.getAlternativeCategory(ruleBasedResult.category);
      suggestions.push({
        category: alternative,
        confidence: 0.3,
        reasoning: 'Alternative suggestion based on common patterns',
      });

      return {
        category: ruleBasedResult.category,
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      logger.error('Categorization failed:', error);
      
      // Ultimate fallback
      return {
        category: 'Other',
        suggestions: [
          {
            category: 'Other',
            confidence: 0.5,
            reasoning: 'Default category due to categorization error',
          },
        ],
      };
    }
  }

  /**
   * Categorize using ML model (placeholder for actual ML integration)
   */
  private async categorizeMl(
    merchantOrDescription: string,
    amount: number
  ): Promise<CategorySuggestion | null> {
    try {
      // Check cache first
      const cacheKey = `ml:category:${merchantOrDescription.toLowerCase()}`;
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // TODO: Call actual ML model endpoint
      // For now, return null to use rule-based fallback
      // const response = await fetch(process.env.ML_MODEL_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: merchantOrDescription, amount }),
      // });
      // const result = await response.json();
      
      return null;
    } catch (error) {
      logger.error('ML categorization failed:', error);
      return null;
    }
  }

  /**
   * Rule-based categorization using merchant patterns
   */
  private categorizeRuleBased(merchantOrDescription: string): CategorySuggestion {
    const text = merchantOrDescription.toLowerCase();
    
    for (const [pattern, category] of Object.entries(MERCHANT_PATTERNS)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(text)) {
        return {
          category,
          confidence: 0.8,
          reasoning: `Matched merchant pattern for ${category}`,
        };
      }
    }

    // Default to "Other" if no pattern matches
    return {
      category: 'Other',
      confidence: 0.5,
      reasoning: 'No matching pattern found, defaulting to Other',
    };
  }

  /**
   * Get an alternative category suggestion
   */
  private getAlternativeCategory(primaryCategory: string): string {
    const alternatives: Record<string, string> = {
      'Food & Dining': 'Groceries',
      'Groceries': 'Food & Dining',
      'Transportation': 'Travel',
      'Travel': 'Transportation',
      'Shopping': 'Personal Care',
      'Entertainment': 'Shopping',
      'Bills & Utilities': 'Home & Garden',
      'Healthcare': 'Personal Care',
      'Education': 'Other',
      'Other': 'Shopping',
    };

    return alternatives[primaryCategory] || 'Other';
  }

  /**
   * Update ML model with user feedback
   */
  async updateModelWithFeedback(
    merchantOrDescription: string,
    correctCategory: string
  ): Promise<void> {
    try {
      // TODO: Send feedback to ML training pipeline
      logger.info('Category feedback received', {
        merchant: merchantOrDescription,
        category: correctCategory,
      });

      // For now, just log it
      // In production, this would update a training dataset
    } catch (error) {
      logger.error('Failed to update model with feedback:', error);
    }
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return [...CATEGORIES];
  }
}

export const categorizationService = new CategorizationService();
