import cron from "node-cron";
import { runBillingCycle } from "./modules/subscriptions/subscriptions.service";

export function initializeRecurringBillingJob() {
  // Run once daily at 00:05 AM
  cron.schedule("5 0 * * *", async () => {
    console.log("⏰ [Cron] Running scheduled automated recurring billing cycle...");
    try {
      const results = await runBillingCycle("SYSTEM_CRON");
      console.log(
        `✅ [Cron] Recurring billing completed: ${results.invoicesGenerated} invoices generated, ${results.skipped} skipped, ${results.failed} failed.`
      );
    } catch (err) {
      console.error("❌ [Cron] Recurring billing job failed:", err);
    }
  });

  console.log("⏰ [Cron] Scheduled automated recurring billing job initialized (Daily at 00:05 AM)");
}

