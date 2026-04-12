import { Kafka, Producer, Consumer } from 'kafkajs';
import { logger } from '@kharchabuddy/shared';

let kafka: Kafka;
let producer: Producer;
let consumer: Consumer;

export async function initializeKafka(): Promise<void> {
  try {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9093').split(',');
    
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'expense-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    producer = kafka.producer();
    await producer.connect();
    logger.info('Kafka producer connected');

    consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'expense-service-group',
    });
    await consumer.connect();
    logger.info('Kafka consumer connected');
  } catch (error) {
    logger.error('Failed to initialize Kafka:', error);
    throw error;
  }
}

export function getKafkaProducer(): Producer {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }
  return producer;
}

export function getKafkaConsumer(): Consumer {
  if (!consumer) {
    throw new Error('Kafka consumer not initialized');
  }
  return consumer;
}

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  }
  if (consumer) {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
}
