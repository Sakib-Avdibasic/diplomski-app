import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  getPersonDetails,
  getPersonDirectingCredits,
  getMovieDetailsWithCredits,
  IMAGE_BASE,
} from "../api/tmdb";
import "./ActorProfile.css"; 

const MAX_MOVIES = 10;
const TOP_BILLED = 5; 
const MAX_ACTORS_SHOWN = 8;

const GRID = "rgba(242,240,232,0.08)";
const AXIS = "#6E6E6E";
const GREEN = "#2E6F40";
const LIGHT_GREEN = "#A3C9A8";

const axisTick = { fontFamily: "IBM Plex Mono", fontSize: 11, fill: AXIS };

const tooltipProps = {
  contentStyle: {
    background: "#0A0A0A",
    border: "1px solid rgba(242,240,232,0.14)",
    borderRadius: 0,
    fontFamily: "IBM Plex Mono",
    fontSize: "0.8rem",
  },
  labelStyle: { color: "#F2F0E8" },
  itemStyle: { color: "#F2F0E8" },
};

interface DirectorProfileProps {
  directorId: number;
}

const DirectorProfile = ({ directorId }: DirectorProfileProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [director, setDirector] = useState<any>(null);
  const [actorData, setActorData] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  const [boxOfficeData, setBoxOfficeData] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const details = await getPersonDetails(directorId);
        const directed = await getPersonDirectingCredits(directorId);

        const topMovies = directed
          .filter((m: any) => m.popularity && m.release_date)
          .sort((a: any, b: any) => b.popularity - a.popularity)
          .slice(0, MAX_MOVIES);

        const fullMovies = await Promise.all(
          topMovies.map((m: any) => getMovieDetailsWithCredits(m.id))
        );

        if (cancelled) return;

        const actorCounts: Record<string, number> = {};
        fullMovies.forEach((movie: any) => {
          movie.credits.cast.slice(0, TOP_BILLED).forEach((a: any) => {
            actorCounts[a.name] = (actorCounts[a.name] || 0) + 1;
          });
        });

        const genreCounts: Record<string, number> = {};
        fullMovies.forEach((movie: any) => {
          movie.genres.forEach((g: any) => {
            genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
          });
        });

        const sortedByDate = [...fullMovies].sort(
          (a: any, b: any) =>
            new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        );

        setDirector(details);
        setActorData(
          Object.entries(actorCounts)
            .map(([actor, films]) => ({ actor, films }))
            .sort((a, b) => b.films - a.films)
            .slice(0, MAX_ACTORS_SHOWN)
        );
        setGenreData(
          Object.entries(genreCounts).map(([genre, count]) => ({ genre, count }))
        );
        setBoxOfficeData(
          sortedByDate.map((m: any) => ({
            movie: m.title,
            boxOffice: +(m.revenue / 1_000_000).toFixed(1),
          }))
        );
        setRatingData(
          sortedByDate.map((m: any) => ({ movie: m.title, rating: m.vote_average }))
        );
      } catch (err) {
        console.error("Greška pri učitavanju režisera:", err);
        if (!cancelled) setError("Podaci trenutno nisu dostupni. Pokušaj ponovo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [directorId]);

  if (loading) return <div className="actor-profile__status">Učitavanje…</div>;
  if (error) return <div className="actor-profile__status">{error}</div>;
  if (!director) return null;

  return (
    <div className="actor-profile">
      <div className="actor-profile__header">
        <img
          src={
            director.profile_path
              ? `${IMAGE_BASE}${director.profile_path}`
              : "https://placehold.co/300x400"
          }
          alt={director.name}
          className="actor-profile__photo"
        />
        <div className="actor-profile__info">
          <h1>{director.name}</h1>
          <p>{director.biography || "Biografija nije dostupna."}</p>
        </div>
      </div>

      <div className="actor-profile__charts">
        <div className="chart-card">
          <h2>Saradnja s glumcima</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={actorData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="actor" tick={axisTick} stroke={AXIS} />
              <YAxis allowDecimals={false} tick={axisTick} stroke={AXIS} />
              <Tooltip {...tooltipProps} cursor={{ fill: "rgba(242,240,232,0.06)" }} />
              <Bar dataKey="films" name="Filmova" fill={GREEN} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Žanrovi filmova</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={genreData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="genre" tick={axisTick} stroke={AXIS} />
              <YAxis allowDecimals={false} tick={axisTick} stroke={AXIS} />
              <Tooltip {...tooltipProps} cursor={{ fill: "rgba(242,240,232,0.06)" }} />
              <Bar dataKey="count" name="Filmova" fill={LIGHT_GREEN} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Zarada filmova (mil $)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={boxOfficeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="movie" tick={{ ...axisTick, fontSize: 10 }} stroke={AXIS} />
              <YAxis tick={axisTick} stroke={AXIS} />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="boxOffice"
                name="Zarada"
                stroke={GREEN}
                strokeWidth={2}
                dot={{ r: 3, fill: GREEN, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>TMDB ocjene filmova</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="movie" tick={{ ...axisTick, fontSize: 10 }} stroke={AXIS} />
              <YAxis domain={[0, 10]} tick={axisTick} stroke={AXIS} />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="rating"
                name="Ocjena"
                stroke={LIGHT_GREEN}
                strokeWidth={2}
                dot={{ r: 3, fill: LIGHT_GREEN, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DirectorProfile;