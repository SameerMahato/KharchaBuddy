import { chat } from '../services/aiCFOService';

// Mock dependencies
jest.mock('../services/memoryService');
jest.mock('../services/snapshotService');
jest.mock('../utils/cache');
jest.mock('../utils/eventPublisher');

describe('AI CFO Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should return a response for a valid chat request', async () => {
      const request = {
        userId: 'user123',
        message: 'How much did I spend this month?',
      };

      const response = await chat(request);

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('conversationId');
      expect(response).toHaveProperty('provider');
      expect(typeof response.response).toBe('string');
    });

    it('should generate a conversation ID if not provided', async () => {
      const request = {
        userId: 'user123',
        message: 'Test message',
      };

      const response = await chat(request);

      expect(response.conversationId).toMatch(/^conv_/);
    });

    it('should use provided conversation ID', async () => {
      const conversationId = 'conv_existing_123';
      const request = {
        userId: 'user123',
        message: 'Test message',
        conversationId,
      };

      const response = await chat(request);

      expect(response.conversationId).toBe(conversationId);
    });

    it('should handle errors gracefully', async () => {
      const request = {
        userId: 'user123',
        message: 'Test message',
      };

      // Should not throw even if LLMs fail
      const response = await chat(request);
      expect(response).toHaveProperty('response');
      expect(response.provider).toBe('fallback');
    });
  });
});
