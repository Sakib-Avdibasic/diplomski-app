import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  getCompanyDetails,
  getStudioGenreDistribution,
  getStudioTopMovies,
  LOGO_BASE,
} from "../api/tmdb";
import "./StudioProfilePage.css";

const COLORS = ["#2E6F40", "#6E6E6E", "#A3C9A8", "#45A049", "#8C8C8C", "#1E4B2C", "#B5D6B8", "#4F4F4F"];

interface GenreSlice {
  genre: string;
  count: number;
}

const StudioProfilePage = () => {
  const { id } = useParams();
  const [studio, setStudio] = useState<any>(null);
  const [genreData, setGenreData] = useState<GenreSlice[]>([]);
  const [topMovies, setTopMovies] = useState<{ title: string; year: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [details, genres, movies] = await Promise.all([
          getCompanyDetails(Number(id)),
          getStudioGenreDistribution(Number(id)),
          getStudioTopMovies(Number(id)),
        ]);
        if (cancelled) return;
        setStudio(details);
        setGenreData(genres);
        setTopMovies(movies);
      } catch (err) {
        console.error("Greška pri učitavanju studija:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return <Navigate to="/studiji" replace />;
  if (loading) return <p className="studio-profile__status">Učitavanje…</p>;
  if (!studio) return <p className="studio-profile__status">Studio nije pronađen.</p>;

  return (
    <div className="studio-profile">
      <div className="studio-profile__header">
        {studio.logo_path && (
          <img
            className="studio-profile__logo"
            src={`${LOGO_BASE}${studio.logo_path}`}
            alt={studio.name}
          />
        )}
        <div>
          <h1>{studio.name}</h1>
          <p className="studio-profile__meta">
            {studio.origin_country && `${studio.origin_country} · `}
            {studio.headquarters || "Sjedište nepoznato"}
          </p>
        </div>
      </div>

      <div className="studio-profile__grid">
        <div className="panel">
          <h2>Žanrovske preferencije</h2>
          {genreData.length === 0 ? (
            <p className="studio-profile__empty">Nema dovoljno podataka.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genreData}
                  dataKey="count"
                  nameKey="genre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  isAnimationActive={false}
                  label={(props: any) => {
  const { genre, percent } = props;
  return `${genre} (${((percent ?? 0) * 100).toFixed(0)}%)`;
}}
                  labelLine={false}
                >
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0A0A0A",
                    border: "1px solid var(--line)",
                    fontFamily: "IBM Plex Mono",
                    fontSize: "0.8rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h2>Istaknuti filmovi</h2>
          <ul className="studio-profile__movie-list">
            {topMovies.map((m) => (
              <li key={m.title}>
                <span>{m.title}</span>
                <span className="studio-profile__movie-year">{m.year}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudioProfilePage;