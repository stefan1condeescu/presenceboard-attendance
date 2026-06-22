import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Layout from "../components/Layout.jsx";
import { api, getToken } from "../api/client.js";
import { downloadCsv } from "../api/downloadCsv.js";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function participantLink(code) {
  return `${window.location.origin}/participant?code=${encodeURIComponent(code)}`;
}

function eventDisplayTitle(eventInfo, fallbackEventId) {
  const sequenceNumber = Number(eventInfo?.sequenceNumber);

  if (eventInfo?.eventGroupTitle && Number.isInteger(sequenceNumber) && sequenceNumber > 0) {
    return `${eventInfo.eventGroupTitle} #${sequenceNumber}`;
  }

  return fallbackEventId ? "Attendance" : "Event attendance";
}

export default function OrganizerEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventInfo, setEventInfo] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  function showError(text) {
    setStatus("error");
    setMessage(text || "Something went wrong.");
  }

  function showSuccess(text) {
    setStatus("success");
    setMessage(text || "Done.");
  }

  async function loadAttendance({ silent = false } = {}) {
    if (!silent) {
      setStatus("");
      setMessage("");
    }

    try {
      setLoading(true);
      const res = await api.get(`/attendance/events/${eventId}`, { auth: true });
      setAttendance(Array.isArray(res) ? res : res?.data || []);

      if (!Array.isArray(res) && res?.event) {
        setEventInfo(res.event);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCsv() {
    try {
      setCsvLoading(true);
      setStatus("");
      setMessage("");

      const fileLabel = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await downloadCsv(`/attendance/export/${eventId}`, `${fileLabel || `event-${eventId}`}-attendance.csv`);
      showSuccess("CSV exported successfully.");
    } catch (error) {
      showError(error.message || "Could not export CSV.");
    } finally {
      setCsvLoading(false);
    }
  }

  async function copyParticipantLink() {
    if (!eventInfo?.accessCode) return;

    try {
      await navigator.clipboard.writeText(participantLink(eventInfo.accessCode));
      showSuccess("Participant link copied.");
    } catch {
      showError("Could not copy the link. You can still select it manually.");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/organizer/login");
      return;
    }

    loadAttendance({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, navigate]);

  const checkInLink = eventInfo?.accessCode ? participantLink(eventInfo.accessCode) : "";
  const backTarget = eventInfo?.eventGroupId ? `/organizer/group/${eventInfo.eventGroupId}` : "/organizer/dashboard";
  const eventTitle = eventDisplayTitle(eventInfo, eventId);

  return (
    <Layout>
      <section className="page-head">
        <div>
          <p className="eyebrow">{eventInfo?.eventGroupTitle || "Event attendance"}</p>
          <h1 className="section-title">{eventTitle}</h1>
          <p className="section-subtitle">Share the QR code, watch check-ins arrive, and export the list.</p>
        </div>

        <div className="button-row">
          <button className="btn btn-muted" onClick={() => loadAttendance()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={handleExportCsv} disabled={csvLoading || loading}>
            {csvLoading ? "Exporting..." : "Export CSV"}
          </button>
          <Link to={backTarget} className="btn btn-muted">
            Back
          </Link>
        </div>
      </section>

      {message && (
        <div className={`alert ${status === "success" ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {eventInfo?.accessCode && (
        <section className="card qr-summary">
          <div className="qr-summary-copy">
            <h2 className="item-title">Participant check-in</h2>
            <div className="access-code">{eventInfo.accessCode}</div>
            <p className="muted">
              {formatDate(eventInfo.startTime)} | {formatDate(eventInfo.endTime)}
            </p>
            <div className={`status-pill ${eventInfo.status === "OPEN" ? "status-open" : "status-closed"}`}>
              {eventInfo.status}
            </div>
            <p className="link-text">{checkInLink}</p>
            <button className="btn btn-muted" onClick={copyParticipantLink}>
              Copy participant link
            </button>
          </div>

          <div className="qr-box">
            <QRCodeCanvas value={checkInLink} size={172} />
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2 className="item-title">Checked-in participants</h2>
            <p className="muted">{loading ? "Loading..." : `${attendance.length} records`}</p>
          </div>
        </div>

        <div className="list">
          {!loading && attendance.length === 0 && (
            <div className="empty-state">No check-ins yet. Keep this page open while participants scan the QR code.</div>
          )}

          {attendance.map((entry) => (
            <article key={entry.id} className="card item-card compact-card">
              <div className="item-main">
                <div className="item-title">{entry.participantName}</div>
                <p className="muted">{entry.participantEmail}</p>
              </div>
              <div className="meta-row">
                <span>Checked in: {formatDate(entry.checkedInAt)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
