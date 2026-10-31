
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>This section is being developed.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route path="/plans" element={<Placeholder title="Plans" />} />
          <Route path="/customers" element={<Placeholder title="Customers" />} />
          <Route path="/quotations" element={<Placeholder title="Quotations" />} />
          <Route path="/subscriptions" element={<Placeholder title="Subscriptions" />} />
          <Route path="/invoices" element={<Placeholder title="Invoices" />} />
          <Route path="/payments" element={<Placeholder title="Payments" />} />
          <Route path="/reports" element={<Placeholder title="Reports" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
