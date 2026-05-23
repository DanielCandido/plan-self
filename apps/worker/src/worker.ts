import { Worker } from 'bullmq';
import { loadRootEnv, loadWorkerConfig } from '@plan-self/config';

loadRootEnv();
const workerConfig = loadWorkerConfig();

const connection = {
  url: workerConfig.redisUrl,
};

const worker = new Worker(
  'automation',
  async (job) => {
    if (job.name === 'task-template') {
      return { created: true, taskTemplateId: job.data.templateId };
    }
    return { skipped: true };
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`job ${job?.id} failed`, err);
});
