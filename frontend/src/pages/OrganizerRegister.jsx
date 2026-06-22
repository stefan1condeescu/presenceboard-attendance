import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function OrganizerRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const isValid = name.trim() && email.trim() && password.trim();

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");

    try {
      setSubmitting(true);
      await api.post("/organizers/register", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      const loginRes = await api.post("/organizers/login", {
        email: email.trim(),
        password: password.trim(),
      });

      localStorage.setItem("token", loginRes.token);
      localStorage.setItem("organizer", JSON.stringify(loginRes.organizer));

      navigate("/organizer/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">New organizer</p>
          <h1 className="section-title">Create an account</h1>
          <p className="section-subtitle">A lightweight account is enough to keep your event groups private.</p>
        </div>

        <form className="card form-card" onSubmit={handleRegister}>
          <div className="field">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              className="input"
              placeholder="Alex Morgan"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="input"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="form-actions">
            <Link to="/organizer/login" className="btn btn-muted">
              I already have an account
            </Link>

            <button className="btn btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Creating..." : "Create account"}
            </button>
          </div>

          {message && <div className="alert alert-error">{message}</div>}
        </form>
      </section>
    </Layout>
  );
}
