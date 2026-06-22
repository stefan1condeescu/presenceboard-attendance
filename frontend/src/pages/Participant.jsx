import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function Participant() {
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState(searchParams.get("code") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = accessCode.trim() && name.trim() && email.trim();

  function showError(text) {
    setStatus("error");
    setMessage(text);
  }

  function showSuccess(text) {
    setStatus("success");
    setMessage(text);
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setStatus("");
    setMessage("");

    const payload = {
      accessCode: accessCode.trim().toUpperCase(),
      participantName: name.trim(),
      participantEmail: email.trim(),
    };

    if (payload.accessCode.length < 4) {
      showError("The event code looks too short.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/attendance", payload);
      showSuccess(res.message || "Attendance confirmed. You are checked in.");
    } catch (error) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <section className="page-head">
        <div>
          <p className="eyebrow">Participant check-in</p>
          <h1 className="section-title">Confirm attendance</h1>
          <p className="section-subtitle">Scan a QR code or enter the event code shared by your organizer.</p>
        </div>

        <Link to="/participant/scan" className="btn">
          Scan QR
        </Link>
      </section>

      <form className="card form-card" onSubmit={handleConfirm}>
        <div className="field">
          <label htmlFor="access-code">Event code</label>
          <input
            id="access-code"
            className="input code-input"
            placeholder="Example: XJ4D92"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="participant-name">Full name</label>
          <input
            id="participant-name"
            className="input"
            placeholder="Example: Alex Morgan"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="participant-email">Email</label>
          <input
            id="participant-email"
            className="input"
            type="email"
            placeholder="Example: alex@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="form-actions">
          <Link to="/" className="btn btn-muted">
            Back
          </Link>

          <button className="btn btn-primary" disabled={!isValid || submitting}>
            {submitting ? "Checking in..." : "Confirm attendance"}
          </button>
        </div>

        {message && (
          <div className={`alert ${status === "success" ? "alert-success" : "alert-error"}`}>
            {message}
          </div>
        )}
      </form>
    </Layout>
  );
}
