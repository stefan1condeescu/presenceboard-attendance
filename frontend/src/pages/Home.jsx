import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Layout from "../components/Layout.jsx";

const FALLBACK_QUOTE = {
  text: "Small systems are easiest to trust when every flow can be explained.",
  author: "PresenceBoard",
  source: "Local fallback",
  external: false,
};

export default function Home() {
  const [quote, setQuote] = useState(FALLBACK_QUOTE);
  const [quoteStatus, setQuoteStatus] = useState("idle");

  const loadQuote = useCallback(async () => {
    try {
      setQuoteStatus("loading");
      const res = await api.get("/quotes/random");
      setQuote(res?.data || FALLBACK_QUOTE);
      setQuoteStatus("ready");
    } catch {
      setQuote(FALLBACK_QUOTE);
      setQuoteStatus("fallback");
    }
  }, []);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  return (
    <Layout>
      <section className="home-shell">
        <div className="hero-copy">
          <p className="eyebrow">Attendance tracking for classes, workshops, and small teams</p>
          <h1 className="hero-title">PresenceBoard</h1>
          <p className="hero-subtitle">
            Create event series, share QR check-ins, and export clean attendance lists without paper sheets.
          </p>
        </div>

        <div className="quote-strip" aria-live="polite">
          <div>
            <p className="role-kicker">{quote.external ? "External quote API" : "Quote API fallback"}</p>
            <blockquote>"{quote.text}"</blockquote>
            <p className="quote-author">
              {quote.author} · {quote.source}
            </p>
          </div>
          <button className="btn btn-muted" onClick={loadQuote} disabled={quoteStatus === "loading"}>
            {quoteStatus === "loading" ? "Loading..." : "New quote"}
          </button>
        </div>

        <div className="role-grid" aria-label="Choose your role">
          <Link to="/participant" className="role-option">
            <span className="role-kicker">I have a code</span>
            <strong>Check in as participant</strong>
            <span>Scan a QR code or enter the event code manually.</span>
          </Link>

          <Link to="/organizer/login" className="role-option role-option-primary">
            <span className="role-kicker">I manage events</span>
            <strong>Open organizer dashboard</strong>
            <span>Create groups, generate sessions, and export attendance.</span>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
