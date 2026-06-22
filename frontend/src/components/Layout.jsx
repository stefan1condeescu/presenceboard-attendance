import { Link } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="PresenceBoard home">
            <span className="brand-mark">PB</span>
            <span>PresenceBoard</span>
          </Link>

          <nav className="nav-actions" aria-label="Primary navigation">
            <Link to="/participant" className="btn btn-quiet">
              Participant
            </Link>
            <Link to="/organizer/login" className="btn btn-quiet">
              Organizer
            </Link>
          </nav>
        </div>
      </header>

      <main className="container">{children}</main>
    </>
  );
}
