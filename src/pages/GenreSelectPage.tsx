import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGenres } from "../api/tmdb";
import "./GenreSelectPage.css";

interface Genre {
  id: number;
  name: string;
}

const GenreSelectPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getGenres()
      .then(setGenres)
      .catch((err) => console.error("Failed to load genres:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (genre: Genre) => {
    navigate(`/zanrovi/${genre.id}/${encodeURIComponent(genre.name)}`);
  };

  return (
    <div className="genre-select">
      <div className="genre-select__header">
        <h1>Indeks žanrova</h1>
        <p>Profitabilnost žanrova, praćena kroz posljednje dvije decenije.</p>
      </div>

      {loading ? (
        <p className="genre-select__status">Učitavanje...</p>
      ) : (
        <ul className="genre-select__list">
  {genres.map((g, i) => (
    <li key={g.id}>
      <button className="genre-select__row" onClick={() => handleSelect(g)}>
        <span className="genre-select__index">№ {String(i + 1).padStart(3, "0")}</span>
        <span className="genre-select__name">{g.name}</span>
        <span className="genre-select__arrow">Pregledaj →</span>
      </button>
    </li>
  ))}
</ul>
      )}
    </div>
  );
};

export default GenreSelectPage;