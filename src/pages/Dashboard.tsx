
import { useEffect, useState } from "react";
import {
  Users,
  Repeat,
  IndianRupee,
  Receipt,
} from "lucide-react";

import api from "../services/api";
import StatCard from "../components/StatCard";
import type {
  DashboardSummary,
  Subscription,
} from "../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryResponse, subscriptionResponse] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/subscriptions/recent"),
        ]);

        setSummary(summaryResponse.data);
        setSubscriptions(subscriptionResponse.data);
      } catch {
        setError("Unable to load dashboard data. Please check your backend connection.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="page-message">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page-message error-message">{error}</div>;
  }

  if (!summary) {
    return <div className="page-message">No dashboard data available.</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your subscription overview.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={summary.totalCustomers}
          description="Registered customers"
          icon={<Users size={22} />}
          color="#e8edff"
        />

        <StatCard
          title="Active Subscriptions"
          value={summary.activeSubscriptions}
          description="Currently active plans"
          icon={<Repeat size={22} />}
          color="#e3f8ef"
        />

        <StatCard
          title="Monthly Revenue"
          value={`₹${summary.monthlyRevenue.toLocaleString("en-IN")}`}
          description="Revenue this month"
          icon={<IndianRupee size={22} />}
          color="#fff3df"
        />

        <StatCard
          title="Pending Invoices"
          value={summary.pendingInvoices}
          description="Awaiting payment"
          icon={<Receipt size={22} />}
          color="#fce8ed"
        />
      </div>

      <section className="table-section">
        <div className="section-heading">
          <h2>Recent Subscriptions</h2>
          <span>{subscriptions.length} records</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Next Billing</th>
              </tr>
            </thead>

            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>{subscription.customerName}</td>
                    <td>{subscription.planName}</td>
                    <td>
                      ₹{subscription.amount.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${subscription.status.toLowerCase()}`}
                      >
                        {subscription.status}
                      </span>
                    </td>
                    <td>
                      {new Date(
                        subscription.nextBillingDate
                      ).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
