import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { subscribeGenreRevenue, type GenreRevenueEntry } from "../api/tmdb";
import { shouldUseBillions, formatMoney } from "../utils/formatMoney";
import GenreBackground from "./GenreBackground";
import ErrorBoundary from "./ErrrorBoundary";
import "./GenreTrends.css";

const START_YEAR = new Date().getFullYear() - 19;
const END_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

interface MovieBreakdown {
  title: string;
  revenue: number;
}

interface YearData {
  year: number;
  revenue: number;
  movies: MovieBreakdown[];
}

interface GenreTrendsProps {
  genreId: number;
  genreName: string;
}

const buildYearData = (entries: GenreRevenueEntry[]): YearData[] => {
  const byYear = new Map<number, MovieBreakdown[]>();
  entries.forEach((e) => {
    const list = byYear.get(e.year) ?? [];
    list.push({ title: e.title, revenue: e.revenue });
    byYear.set(e.year, list);
  });

  return YEARS.map((year) => {
    const movies = byYear.get(year) ?? [];
    const revenue = +movies.reduce((sum, m) => sum + m.revenue, 0).toFixed(1);
    return { year, revenue, movies };
  });
};

const CustomTooltip = ({ active, payload, useBillions }: any) => {
  if (!active || !payload?.length) return null;
  const data: YearData | undefined = payload[0]?.payload;
  if (!data || !Array.isArray(data.movies)) return null;

  return (
    <div className="genre-trends__tooltip">
      <div className="genre-trends__tooltip-year">{data.year}</div>
      <div className="genre-trends__tooltip-total">
        Ukupno: {formatMoney(data.revenue ?? 0, useBillions)}
      </div>
      {data.movies.length > 0 ? (
        <ul className="genre-trends__tooltip-list">
          {[...data.movies]
            .sort((a, b) => b.revenue - a.revenue)
            .map((m) => (
              <li key={m.title}>
                <span>{m.title}</span>
                <span>{formatMoney(m.revenue, useBillions)}</span>
              </li>
            ))}
        </ul>
      ) : (
        <p className="genre-trends__tooltip-empty">Nema filmova za ovu godinu.</p>
      )}
    </div>
  );
};

const GenreTrends = ({ genreId, genreName }: GenreTrendsProps) => {
  const [data, setData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setData([]);
    setLoading(true);
    setDone(false);

    return subscribeGenreRevenue(genreId, START_YEAR, END_YEAR, (entries, finished) => {
      setData(buildYearData(entries));
      setDone(finished);
      if (entries.length > 0 || finished) setLoading(false);
    });
  }, [genreId]);

  const hasData = data.some((d) => d.movies.length > 0);
  const allValues = data.flatMap((d) => [d.revenue, ...d.movies.map((m) => m.revenue)]);
  const useBillions = shouldUseBillions(allValues);
  const unitLabel = useBillions ? "Zarada (mlrd $)" : "Zarada (mil $)";

  return (
    <div className="genre-trends">
      <GenreBackground genreId={genreId} />

      <div className="genre-trends__panel">
        <h1>{genreName}</h1>

        <div className="genre-trends__chart-card">
          {loading ? (
            <p className="genre-trends__status">Učitavanje…</p>
          ) : !hasData ? (
            <p className="genre-trends__status">Nema dostupnih podataka za ovaj žanr.</p>
          ) : (
            <>
              <ErrorBoundary
                fallback={
                  <p className="genre-trends__status">
                    Došlo je do greške prilikom prikazivanja grafika.
                  </p>
                }
              >
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,240,232,0.08)" />
                    <XAxis
                      dataKey="year"
                      stroke="#6E6E6E"
                      tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#6E6E6E"
                      tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                      tickFormatter={(v) => (useBillions ? (v / 1000).toFixed(1) : v)}
                      label={{ value: unitLabel, angle: -90, fill: "#6E6E6E", fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip useBillions={useBillions} />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2E6F40"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#2E6F40", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ErrorBoundary>
              {!done && (
                <p className="genre-trends__progress">Učitavanje preostalih filmova…</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenreTrends;