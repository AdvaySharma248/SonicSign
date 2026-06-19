const EmailLog = require('../models/EmailLog');
const { emailService } = require('../services/email.service');
const { emailQueue } = require('../services/email.queue');

let isProcessing = false;

async function processEmailQueue() {
  if (isProcessing) {
    console.log('processEmailQueue: already processing, skipping.');
    return;
  }
  isProcessing = true;

  try {
    const now = new Date();
    const logs = await EmailLog.find({
      status: 'queued',
      nextAttemptAt: { $lte: now },
    }).sort({ nextAttemptAt: 1 });

    if (logs.length > 0) {
      console.log(`processEmailQueue: found ${logs.length} queued emails to process.`);
    }

    for (const log of logs) {
      console.log(`processEmailQueue: locking log ${log._id} for recipient ${log.recipient}`);
      const lockedLog = await EmailLog.findOneAndUpdate(
        { _id: log._id, status: 'queued' },
        { status: 'processing' },
        { new: true }
      );

      if (!lockedLog) {
        console.log(`processEmailQueue: log ${log._id} already locked/processed by another worker.`);
        continue;
      }

      try {
        console.log(`processEmailQueue: sending email to ${lockedLog.recipient}...`);
        const result = await emailService.sendMailFromLog(lockedLog);
        await emailQueue.markSent(lockedLog._id, result);
        await emailQueue.markDelivered(lockedLog._id);
        console.log(`processEmailQueue: successfully delivered email to ${lockedLog.recipient}`);
      } catch (error) {
        console.error(`processEmailQueue: Email delivery failed for log ${lockedLog._id}:`, error.message);

        const currentRetryCount = lockedLog.retryCount || 0;
        if (currentRetryCount < 3) {
          const delaySeconds = getNextRetryDelaySeconds(currentRetryCount);
          const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);
          await emailQueue.markRetry(lockedLog._id, error, nextAttemptAt, currentRetryCount + 1);
          console.log(`processEmailQueue: scheduled retry #${currentRetryCount + 1} for email log ${lockedLog._id} at ${nextAttemptAt}`);
        } else {
          await emailQueue.markFailed(lockedLog._id, error);
          console.error(`processEmailQueue: email log ${lockedLog._id} failed after maximum retries.`);
        }
      }
    }
  } catch (error) {
    console.error('processEmailQueue: error running email queue process:', error);
  } finally {
    isProcessing = false;
  }
}

function getNextRetryDelaySeconds(retryCount) {
  if (retryCount === 0) return 30;
  if (retryCount === 1) return 120;
  return 300;
}

module.exports = {
  processEmailQueue,
};
