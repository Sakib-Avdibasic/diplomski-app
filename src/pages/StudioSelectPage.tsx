import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchCompany, LOGO_BASE, resolveStudio } from "../api/tmdb";
import "./StudioSelectPage.css";

const SEED_STUDIOS = [
  "Warner Bros. Pictures",
  "Universal Pictures",
  "Paramount Pictures",
  "Walt Disney Pictures",
  "Columbia Pictures",
  "20th Century Studios",
  "New Line Cinema",
  "Lionsgate",
  "DreamWorks Pictures",
  "A24",
  "Metro-Goldwyn-Mayer",
  "Legendary Pictures",
];

interface Studio {
  id: number;
  name: string;
  logo_path: string | null;
}

const StudioSelectPage = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.all(
  SEED_STUDIOS.map((name) => resolveStudio(name).catch(() => null))
);
      setStudios(results.filter(Boolean) as Studio[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="studio-select">
      <div className="studio-select__header">
        <h1>Studiji</h1>
        <p>Ko stoji iza najvećih filmova, i šta najčešće prave.</p>
      </div>

      {loading ? (
        <p className="studio-select__status">Učitavanje…</p>
      ) : (
        <div className="studio-select__grid">
  {studios.map((s) => (
    <button
      key={s.id}
      className="studio-select__card"
      onClick={() => navigate(`/studiji/${s.id}`)}
    >
      {s.logo_path ? (
        <div className="studio-select__logo-plate">
          <img
            className="studio-select__logo"
            src={`${LOGO_BASE}${s.logo_path}`}
            alt={s.name}
          />
        </div>
      ) : (
        <span className="studio-select__name studio-select__name--fallback">
          {s.name}
        </span>
      )}
    </button>
  ))}
</div>
      )}
    </div>
  );
};

export default StudioSelectPage;