import AdminLoginForm from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <main className="login-shell">
    <a href="/" className="brand"><span className="brand-mark">e</span><span>EcoTool <small>Community research</small></span></a>
    <section className="login-card"><div className="login-avatar">✳</div><span className="eyebrow">PRIVATE AREA</span><h1>Welcome back</h1><p>Sign in to review the research responses.</p><AdminLoginForm /></section>
    <a href="/" className="back-link">← Back to survey</a>
  </main>;
}
