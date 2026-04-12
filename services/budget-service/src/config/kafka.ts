import { Kafka, Consumer, Producer } from 'kafkajs';
import { logger } from '@kharchabuddy/shared';
import { handleTransactionCreated } from '../consumers/transaction.consumer';

const kafka = new Kafka({
  clientId: 'budget-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

let producer: Producer;
let consumer: Consumer;

export async function connectKafka(): Promise<void> {
  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: 'budget-service-group' });

  await producer.connect();
  await consumer.connect();

  logger.info('Budget Service connected to Kafka');
}

export async function consumeEvents(): Promise<void> {
  await consumer.subscribe({ topics: ['transaction.created', 'expense.created'], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return;

      try {
        const event = JSON.parse(value);
        logger.info({ topic, event }, 'Received event');

        if (topic === 'transaction.created' || topic === 'expense.created') {
          await handleTransactionCreated(event);
        }
      } catch (error) {
        logger.error({ err: error, topic }, 'Failed to process event');
      }
    },
  });
}

export async function publishEvent(topic: string, event: any): Promise<void> {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(event) }],
  });
  logger.info({ topic, event }, 'Published event');
}
