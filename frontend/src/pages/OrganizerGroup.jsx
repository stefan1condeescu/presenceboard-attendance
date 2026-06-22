import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api, getToken } from "../api/client.js";

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
  });
}

function participantLink(code) {
  return `${window.location.origin}/participant?code=${encodeURIComponent(code)}`;
}

function sortEventsByStartTime(eventList) {
  return [...eventList].sort((first, second) => {
    const firstDate = new Date(first.startTime).getTime();
    const secondDate = new Date(second.startTime).getTime();

    if (Number.isNaN(firstDate) || Number.isNaN(secondDate) || firstDate === secondDate) {
      return Number(first.id) - Number(second.id);
    }

    return firstDate - secondDate;
  });
}

function eventDisplayTitle(event, fallbackGroupTitle, fallbackIndex) {
  const groupTitle = fallbackGroupTitle || event.EventGroup?.title || "Event";
  const sequenceNumber = Number(event.sequenceNumber);

  if (Number.isInteger(sequenceNumber) && sequenceNumber > 0) {
    return `${groupTitle} #${sequenceNumber}`;
  }

  return `${groupTitle} #${fallbackIndex + 1}`;
}

export default function OrganizerGroup() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [groupEditing, setGroupEditing] = useState(false);
  const [groupTitleInput, setGroupTitleInput] = useState("");
  const [groupDescriptionInput, setGroupDescriptionInput] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function showError(text) {
    setStatus("error");
    setMessage(text);
  }

  function showSuccess(text) {
    setStatus("success");
    setMessage(text);
  }

  async function loadData({ silent = false } = {}) {
    if (!silent) {
      setMessage("");
      setStatus("");
    }

    try {
      setLoading(true);
      const [groupRes, eventsRes] = await Promise.all([
        api.get(`/event-groups/${groupId}`, { auth: true }),
        api.get("/events", { auth: true }),
      ]);

      setGroup(groupRes?.data ?? groupRes);
      const list = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data || [];
      setEvents(sortEventsByStartTime(list.filter((event) => Number(event.eventGroupId) === Number(groupId))));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/organizer/login");
      return;
    }

    loadData({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, navigate]);

  async function handleCreateEvent(event) {
    event.preventDefault();
    setMessage("");
    setStatus("");

    if (!startDate || !endDate) {
      showError("Start and end dates are required.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      showError("End date must be after start date.");
      return;
    }

    try {
      const payload = {
        eventGroupId: Number(groupId),
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
      };

      const res = await api.post("/events", payload, { auth: true });
      const created = res?.data ?? res;

      setEvents((previous) => sortEventsByStartTime([...previous, created]));
      setStartDate("");
      setEndDate("");
      showSuccess("Event created successfully.");
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleDeleteGroup() {
    const ok = window.confirm("Delete this group and all of its events?");
    if (!ok) return;

    try {
      await api.del(`/event-groups/${groupId}`, { auth: true });
      navigate("/organizer/dashboard");
    } catch (error) {
      showError(error.message);
    }
  }

  function startGroupEdit() {
    setGroupEditing(true);
    setGroupTitleInput(group?.title || "");
    setGroupDescriptionInput(group?.description || "");
    setMessage("");
    setStatus("");
  }

  function cancelGroupEdit() {
    setGroupEditing(false);
    setGroupTitleInput("");
    setGroupDescriptionInput("");
  }

  async function saveGroupEdit() {
    setMessage("");
    setStatus("");

    if (!groupTitleInput.trim()) {
      showError("Group title is required.");
      return;
    }

    try {
      const res = await api.put(
        `/event-groups/${groupId}`,
        {
          title: groupTitleInput.trim(),
          description: groupDescriptionInput.trim(),
        },
        { auth: true },
      );
      const updated = res?.data ?? res;

      setGroup(updated);
      setEvents((previous) => previous.map((event) => ({
        ...event,
        EventGroup: event.EventGroup ? { ...event.EventGroup, title: updated.title } : event.EventGroup,
      })));
      setGroupEditing(false);
      showSuccess("Group updated successfully.");
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleDeleteEvent(eventId) {
    const ok = window.confirm("Delete this event?");
    if (!ok) return;

    try {
      await api.del(`/events/${eventId}`, { auth: true });
      setEvents((previous) => previous.filter((event) => event.id !== eventId));
      showSuccess("Event deleted successfully.");
    } catch (error) {
      showError(error.message);
    }
  }

  async function copyParticipantLink(code) {
    try {
      await navigator.clipboard.writeText(participantLink(code));
      showSuccess("Participant link copied.");
    } catch {
      showError("Could not copy the link. You can still select it manually.");
    }
  }

  return (
    <Layout>
      <section className="page-head">
        {!groupEditing ? (
          <div>
            <p className="eyebrow">Event group</p>
            <h1 className="section-title">{group?.title || "Events"}</h1>
            <p className="section-subtitle">{group?.description || "Create sessions, share codes, and open the attendance view."}</p>
          </div>
        ) : (
          <div className="header-edit">
            <p className="eyebrow">Edit group</p>
            <div className="edit-grid">
              <div className="field">
                <label htmlFor="group-page-title">Title *</label>
                <input
                  id="group-page-title"
                  className="input"
                  value={groupTitleInput}
                  onChange={(event) => setGroupTitleInput(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="group-page-description">Description</label>
                <input
                  id="group-page-description"
                  className="input"
                  value={groupDescriptionInput}
                  onChange={(event) => setGroupDescriptionInput(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="button-row">
          <Link to="/organizer/dashboard" className="btn btn-muted">
            Back
          </Link>
          {!groupEditing ? (
            <>
              <button className="btn btn-muted" onClick={startGroupEdit}>
                Edit group
              </button>
              <button className="btn btn-danger" onClick={handleDeleteGroup}>
                Delete group
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={saveGroupEdit}>
                Save group
              </button>
              <button className="btn btn-muted" onClick={cancelGroupEdit}>
                Cancel
              </button>
            </>
          )}
        </div>
      </section>

      {message && (
        <div className={`alert ${status === "success" ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      <form className="card form-card wide-card" onSubmit={handleCreateEvent}>
        <div className="section-row">
          <div>
            <h2 className="item-title">Create event</h2>
            <p className="muted">For a quick demo, set the start time a few minutes in the past and the end time later today.</p>
          </div>
          <button className="btn btn-primary" disabled={!startDate || !endDate}>
            Create event
          </button>
        </div>

        <div className="grid">
          <div className="col-6">
            <div className="field">
              <label htmlFor="event-start">Start</label>
              <input
                id="event-start"
                className="input"
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="event-end">End</label>
              <input
                id="event-end"
                className="input"
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
        </div>
      </form>

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2 className="item-title">Events</h2>
            <p className="muted">{loading ? "Loading..." : `${events.length} total`}</p>
          </div>
          <button className="btn btn-muted" onClick={() => loadData()}>
            Refresh
          </button>
        </div>

        <div className="list">
          {!loading && events.length === 0 && (
            <div className="empty-state">No events yet. Create one manually or generate recurring events from the dashboard.</div>
          )}

          {events.map((event, index) => {
            const link = participantLink(event.accessCode);

            return (
              <article key={event.id} className="card item-card">
                <div className="item-main">
                  <div className="item-title">{eventDisplayTitle(event, group?.title, index)}</div>

                  <p className="muted">
                    Start: <strong>{formatDate(event.startTime)}</strong> | End: <strong>{formatDate(event.endTime)}</strong>
                  </p>
                  <div className="meta-row">
                    <span className="badge">Code {event.accessCode}</span>
                    <span className="link-text">{link}</span>
                  </div>
                </div>

                <div className="button-row">
                  <Link className="btn btn-primary" to={`/organizer/event/${event.id}`}>
                    Attendance
                  </Link>
                  <button className="btn btn-muted" onClick={() => copyParticipantLink(event.accessCode)}>
                    Copy link
                  </button>

                  <button className="btn btn-danger" onClick={() => handleDeleteEvent(event.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
