import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import Layout from "../components/Layout.jsx";

function extractCode(decodedText) {
  try {
    const url = new URL(decodedText);
    return url.searchParams.get("code") || decodedText;
  } catch {
    return decodedText;
  }
}

export default function ParticipantScan() {
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const startedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (startedRef.current) return;
      startedRef.current = true;
      setError("");

      try {
        qrRef.current = new Html5Qrcode("qr-reader");

        await qrRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (cancelled) return;

            try {
              await qrRef.current?.stop();
              await qrRef.current?.clear();
            } catch {
              // The scanner may already be stopped after a successful read.
            }

            navigate(`/participant?code=${encodeURIComponent(extractCode(decodedText))}`);
          },
        );
      } catch (scanError) {
        console.error("Could not start camera:", scanError);

        if (!cancelled) {
          setError("Could not start the camera. Check browser permissions or use manual code entry.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;

      (async () => {
        try {
          await qrRef.current?.stop();
          await qrRef.current?.clear();
        } catch {
          // Cleanup is best-effort because browsers differ in camera teardown timing.
        }
      })();
    };
  }, [navigate]);

  return (
    <Layout>
      <section className="page-head">
        <div>
          <p className="eyebrow">QR scanner</p>
          <h1 className="section-title">Scan event QR</h1>
          <p className="section-subtitle">Point your camera at the organizer's QR code.</p>
        </div>
      </section>

      <div className="card qr-card">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="qr-frame">
          <div id="qr-reader" />
        </div>

        <div className="form-actions">
          <Link to="/participant" className="btn btn-muted">
            Enter code manually
          </Link>
          <Link to="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
