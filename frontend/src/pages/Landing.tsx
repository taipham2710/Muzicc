import { Link } from "react-router-dom";

type PublicSong = {
  id: number;
  title: string;
  artist: string;
  is_public: boolean;
};

const mockSongs: PublicSong[] = [
  { id: 1, title: "Song One", artist: "Artist A", is_public: true },
  { id: 2, title: "Song Two", artist: "Artist B", is_public: true },
  { id: 3, title: "Song Three", artist: "Artist C", is_public: true },
  { id: 4, title: "Song Four", artist: "Artist D", is_public: true },
  { id: 5, title: "Song Five", artist: "Artist E", is_public: true },
  { id: 6, title: "Song Six", artist: "Artist F", is_public: true },
  { id: 7, title: "Song Seven", artist: "Artist G", is_public: true },
  { id: 8, title: "Song Eight", artist: "Artist H", is_public: true },
  { id: 9, title: "Song Nine", artist: "Artist I", is_public: true },
  { id: 10, title: "Song Ten", artist: "Artist J", is_public: true },
];

export default function Landing() {
  return (
    <div style={{ padding: "2rem" }}>
      {/* INTRO */}
      <section>
        <h1>Muzicc</h1>
        <p>
          Đây là ứng dụng web nhằm phục vụ sở thích nghe nhạc <b>không quảng cáo</b>.
        </p>
        <p>
          Bạn hãy tạo tài khoản để có thể trải nghiệm đầy đủ tính năng.
        </p>

        <div style={{ marginTop: "1rem" }}>
          <Link to="/login">
            <button>Sign in</button>
          </Link>
          <Link to="/register" style={{ marginLeft: "1rem" }}>
            <button>Sign up</button>
          </Link>
        </div>
      </section>

      <hr style={{ margin: "2rem 0" }} />

      {/* PUBLIC SONG LIST */}
      <section>
        <h2>Public songs</h2>

        <ul>
          {mockSongs.map((song) => (
            <li key={song.id} style={{ marginBottom: "0.5rem" }}>
              {song.title} — {song.artist}{" "}
              <span style={{ opacity: 0.6 }}>(public)</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
