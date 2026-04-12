import { logger } from './logger';

export async function publishEvent(topic: string, event: any): Promise<void> {
  try {
    const producer = (global as any).kafkaProducer;
    await producer.send({
      topic,
      messages: [
        {
          key: event.userId,
          value: JSON.stringify(event),
        },
      ],
    });
    logger.debug('Event published', { topic, userId: event.userId });
  } catch (error) {
    logger.error('Failed to publish event', { topic, error });
  }
}
