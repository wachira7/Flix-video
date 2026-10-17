// src/jobs/worker.js
// Drop-in replacement for BullMQ's Worker. Each job file still calls
// `new Worker('notifications', processor)`, but instead of opening its own
// Redis connections it registers with one shared BullMQ worker that serves
// the single jobs queue (see queues.js) and dispatches by logical queue.
const { EventEmitter } = require('events');
const { Worker: BullWorker } = require('bullmq');
const logger = require('../utils/logger');
const { connection, JOBS_QUEUE, NAME_SEPARATOR } = require('./queues');

const processors = new Map();
let sharedWorker = null;

function logicalNameOf(job) {
  const index = job.name.indexOf(NAME_SEPARATOR);
  return index === -1 ? null : job.name.slice(0, index);
}

function startSharedWorker() {
  sharedWorker = new BullWorker(
    JOBS_QUEUE,
    async (job) => {
      const entry = processors.get(logicalNameOf(job));
      if (!entry) throw new Error(`No processor for job "${job.name}"`);
      return entry.processor(job);
    },
    {
      connection,
      concurrency: 6,           // One slot per former worker, so a slow cleanup can't hold up emails
      stalledInterval: 300000,  // Check for stalled jobs every 5 min (default is 30s)
      drainDelay: 30,           // Wait 30s when queue empty before polling again
      lockDuration: 60000,      // Allow longer jobs, e.g. analytics over many users
    }
  );

  // Forward lifecycle events to the logical worker that owns the job
  sharedWorker.on('completed', (job, result) => {
    processors.get(logicalNameOf(job))?.emitter.emit('completed', job, result);
  });
  sharedWorker.on('failed', (job, err) => {
    const entry = job && processors.get(logicalNameOf(job));
    if (entry) entry.emitter.emit('failed', job, err);
    else logger.error('Background job failed', { job: job?.name, error: err.message });
  });
  sharedWorker.on('error', (err) => {
    logger.error('Background worker error', { error: err.message });
  });
}

class Worker extends EventEmitter {
  constructor(name, processor) {
    super();
    this.name = name;
    processors.set(name, { processor, emitter: this });
    if (!sharedWorker) startSharedWorker();
  }

  // Closing any logical worker stops the shared one; safe to call repeatedly
  async close() {
    if (sharedWorker) {
      const worker = sharedWorker;
      sharedWorker = null;
      await worker.close();
    }
  }
}

module.exports = { Worker };
