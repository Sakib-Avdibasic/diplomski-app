import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getTrendingMovies,
  getHomeShowcase,
  BACKDROP_BASE,
  type TrendingMovie,
  type HomeShowcase,
} from "../api/tmdb";
import "./HomePage.css";

const sections: {
  key: keyof HomeShowcase;
  name: string;
  desc: string;
  to: string;
}[] = [
  { key: "actors", name: "Glumci", desc: "Zvijezde ispred kamere.", to: "/glumci" },
  { key: "directors", name: "Režiseri", desc: "Kreativci iza kamera.", to: "/reziseri" },
  { key: "studios", name: "Studiji", desc: "Kompanije koje se brinu za finansiranje, logistiku i distribuciju filmova.", to: "/studiji" },
  { key: "genres", name: "Žanrovi", desc: "Kategorizacija filmova po temama koje obrađuju i osjećajima koje izazivaju.", to: "/zanrovi" },
];

const yearOf = (date: string) => (date ? new Date(date).getFullYear() : "");

const HomePage = () => {
  const [trending, setTrending] = useState<TrendingMovie[]>([]);
  const [showcase, setShowcase] = useState<HomeShowcase | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTrendingMovies()
      .then((m) => !cancelled && setTrending(m))
      .catch((err) => console.error("Greška pri učitavanju filmova u trendu:", err));

    getHomeShowcase()
      .then((s) => !cancelled && setShowcase(s))
      .catch((err) => console.error("Greška pri učitavanju slika:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  const heroMovie = trending.find((m) => m.backdrop_path);

  return (
    <div className="home">
      <section className="home__hero">
        {heroMovie && (
          <div
            className="home__hero-image"
            style={{ backgroundImage: `url(${BACKDROP_BASE}${heroMovie.backdrop_path})` }}
          />
        )}
        <div className="home__hero-overlay" />

        <div className="home__hero-content">
          <h1>Vizualizator filmskih trendova</h1>
          <p className="home__intro">
            Istraži uspjeh i popularnost glumaca, režisera, žanrova i filmskih studija kroz godine.
          </p>
        </div>

        {heroMovie && (
          <p className="home__caption">
            U trendu: {heroMovie.title} ({yearOf(heroMovie.release_date)})
          </p>
        )}
      </section>

      <section className="home__section">
        <h2>Istraži</h2>
        <div className="home__tiles">
          {sections.map((s) => {
            const src = showcase?.[s.key];
            return (
              <Link
                key={s.to}
                to={s.to}
                className={`home__tile${s.key === "studios" ? " home__tile--logo" : ""}`}
              >
                <div className="home__tile-media">
                  {src && <img src={src} alt="" />}
                </div>
                <div className="home__tile-overlay" />
                <div className="home__tile-text">
                  <span className="home__tile-name">{s.name}</span>
                  <span className="home__tile-desc">{s.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default HomePage;