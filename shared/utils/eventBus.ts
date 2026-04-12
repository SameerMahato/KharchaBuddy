import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from './logger';
import { Event } from '../types';

class EventBus {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'kharchabuddy-api',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async connect() {
    try {
      this.producer = this.kafka.producer({
        idempotent: true,
        maxInFlightRequests: 5,
        transactionalId: `${process.env.SERVICE_NAME}-producer`
      });
      
      await this.producer.connect();
      logger.info('Event bus producer connected');
    } catch (error) {
      logger.error('Failed to connect event bus producer', { error });
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }
      
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        logger.info(`Consumer ${groupId} disconnected`);
      }
      
      logger.info('Event bus disconnected');
    } catch (error) {
      logger.error('Failed to disconnect event bus', { error });
    }
  }

  async publish(event: Event): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not connected');
    }

    try {
      await this.producer.send({
        topic: event.type,
        messages: [
          {
            key: event.userId,
            value: JSON.stringify(event),
            headers: {
              'event-id': event.id,
              'event-type': event.type,
              'user-id': event.userId,
              'timestamp': event.timestamp.toISOString()
            }
          }
        ]
      });

      logger.info('Event published', {
        eventType: event.type,
        eventId: event.id,
        userId: event.userId
      });
    } catch (error) {
      logger.error('Failed to publish event', {
        eventType: event.type,
        error
      });
      throw error;
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (event: Event) => Promise<void>
  ): Promise<void> {
    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const event = JSON.parse(message.value!.toString()) as Event;
            
            logger.info('Event received', {
              topic,
              partition,
              eventType: event.type,
              eventId: event.id
            });

            await handler(event);
          } catch (error) {
            logger.error('Failed to process event', {
              topic,
              partition,
              error
            });
            // Event will be retried by Kafka
          }
        }
      });

      this.consumers.set(groupId, consumer);
      logger.info(`Subscribed to topic ${topic} with group ${groupId}`);
    } catch (error) {
      logger.error('Failed to subscribe to topic', { topic, groupId, error });
      throw error;
    }
  }
}

export const eventBus = new EventBus();
