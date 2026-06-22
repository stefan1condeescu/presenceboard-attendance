import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api, getToken } from "../api/client.js";

const RECURRENCE_LABELS = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

function getStoredOrganizer() {
  try {
    return JSON.parse(localStorage.getItem("organizer") || "null");
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [organizer] = useState(getStoredOrganizer);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [durationHours, setDurationHours] = useState(2);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function showError(text) {
    setStatus("error");
    setMessage(text);
  }

  function showSuccess(text) {
    setStatus("success");
    setMessage(text);
  }

  async function loadGroups({ silent = false } = {}) {
    if (!silent) {
      setMessage("");
      setStatus("");
    }

    try {
      setLoading(true);
      const res = await api.get("/event-groups", { auth: true });
      setGroups(Array.isArray(res) ? res : res?.data || []);
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

    loadGroups({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleAddGroup(event) {
    event.preventDefault();
    setMessage("");
    setStatus("");

    if (!title.trim()) {
      showError("Group title is required.");
      return;
    }

    if (recurrence && (!startDate || !endDate)) {
      showError("Start and end dates are required when recurrence is enabled.");
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      showError("End date must be after start date.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        recurrence: recurrence || null,
        durationHours: Number(durationHours),
      };
      const res = await api.post("/event-groups", payload, { auth: true });
      const created = res?.data ?? res;

      setGroups((previous) => [created, ...previous]);
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setRecurrence("");
      setDurationHours(2);
      showSuccess(res?.message || "Group created successfully.");
    } catch (error) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(group) {
    setEditingId(group.id);
    setEditTitle(group.title || "");
    setEditDescription(group.description || "");
    setMessage("");
    setStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  async function saveEdit(groupId) {
    setMessage("");
    setStatus("");

    if (!editTitle.trim()) {
      showError("Group title is required.");
      return;
    }

    try {
      const res = await api.put(
        `/event-groups/${groupId}`,
        {
          title: editTitle.trim(),
          description: editDescription.trim(),
        },
        { auth: true },
      );
      const updated = res?.data ?? res;

      setGroups((previous) => previous.map((group) => (group.id === groupId ? updated : group)));
      setEditingId(null);
      showSuccess("Group updated successfully.");
    } catch (error) {
      showError(error.message);
    }
  }

  async function handleDeleteGroup(groupId) {
    const ok = window.confirm("Delete this group and all of its events?");
    if (!ok) return;

    setMessage("");
    setStatus("");

    try {
      await api.del(`/event-groups/${groupId}`, { auth: true });
      setGroups((previous) => previous.filter((group) => group.id !== groupId));
      showSuccess("Group deleted successfully.");
    } catch (error) {
      showError(error.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("organizer");
    navigate("/organizer/login");
  }

  return (
    <Layout>
      <section className="page-head">
        <div>
          <p className="eyebrow">Organizer dashboard</p>
          <h1 className="section-title">Event groups</h1>
          <p className="section-subtitle">
            {organizer?.name ? `Signed in as ${organizer.name}. ` : ""}
            Create a group manually or generate recurring events in one step.
          </p>
        </div>

        <div className="button-row">
          <button className="btn btn-muted" onClick={() => loadGroups()}>
            Refresh
          </button>
          <button className="btn btn-muted" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {message && (
        <div className={`alert ${status === "success" ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      <form className="card form-card wide-card" onSubmit={handleAddGroup}>
        <div className="section-row">
          <div>
            <h2 className="item-title">Create group</h2>
            <p className="muted">Use recurrence to generate weekly, biweekly, or monthly sessions.</p>
          </div>
          <button className="btn btn-primary" disabled={!title.trim() || submitting}>
            {submitting ? "Creating..." : "Create group"}
          </button>
        </div>

        <div className="grid">
          <div className="col-6">
            <div className="field">
              <label htmlFor="group-title">Title *</label>
              <input
                id="group-title"
                className="input"
                placeholder="Web Technologies - Group C"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="group-description">Description</label>
              <input
                id="group-description"
                className="input"
                placeholder="Short context for this event series"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="group-start">First event starts</label>
              <input
                id="group-start"
                className="input"
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="group-end">Generate until</label>
              <input
                id="group-end"
                className="input"
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="group-recurrence">Recurrence</label>
              <select
                id="group-recurrence"
                className="input"
                value={recurrence}
                onChange={(event) => setRecurrence(event.target.value)}
              >
                <option value="">No recurrence</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="field">
              <label htmlFor="group-duration">Event duration in hours</label>
              <input
                id="group-duration"
                className="input"
                type="number"
                min="1"
                max="12"
                value={durationHours}
                onChange={(event) => setDurationHours(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
      </form>

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2 className="item-title">Groups</h2>
            <p className="muted">{loading ? "Loading..." : `${groups.length} total`}</p>
          </div>
        </div>

        <div className="list">
          {!loading && groups.length === 0 && (
            <div className="empty-state">No groups yet. Create one above to start the demo flow.</div>
          )}

          {groups.map((group) => {
            const isEditing = editingId === group.id;

            return (
              <article key={group.id} className="card item-card">
                <div className="item-main">
                  {!isEditing ? (
                    <>
                      <div className="item-title">{group.title}</div>
                      <p className="muted">{group.description || "No description"}</p>
                      <div className="meta-row">
                        {group.recurrence && <span className="badge">{RECURRENCE_LABELS[group.recurrence] || group.recurrence}</span>}
                        <span>Start: {formatDate(group.startDate)}</span>
                        <span>End: {formatDate(group.endDate)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="edit-grid">
                      <div className="field">
                        <label htmlFor={`edit-title-${group.id}`}>Title *</label>
                        <input
                          id={`edit-title-${group.id}`}
                          className="input"
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-description-${group.id}`}>Description</label>
                        <input
                          id={`edit-description-${group.id}`}
                          className="input"
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="button-row">
                  <Link className="btn btn-primary" to={`/organizer/group/${group.id}`}>
                    Events
                  </Link>

                  {!isEditing ? (
                    <>
                      <button className="btn btn-muted" onClick={() => startEdit(group)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteGroup(group.id)}>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={() => saveEdit(group.id)}>
                        Save
                      </button>
                      <button className="btn btn-muted" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
