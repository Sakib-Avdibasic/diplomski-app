import { useEffect, useState } from "react";
import { getGenreBackdrop } from "../api/tmdb";
import "./GenreBackground.css";

interface GenreBackgroundProps {
  genreId: number | null;
}

const GenreBackground = ({ genreId }: GenreBackgroundProps) => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);

  useEffect(() => {
    if (genreId == null) return;

    let cancelled = false;
    getGenreBackdrop(genreId).then((url) => {
      if (cancelled) return;
      setPreviousUrl(currentUrl);
      setCurrentUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [genreId]);

  return (
    <div className="genre-bg">
      {previousUrl && (
        <div
          className="genre-bg__layer genre-bg__layer--under"
          style={{ backgroundImage: `url(${previousUrl})` }}
        />
      )}
      {currentUrl && (
        <div
          key={currentUrl}
          className="genre-bg__layer genre-bg__layer--fade-in"
          style={{ backgroundImage: `url(${currentUrl})` }}
        />
      )}
      <div className="genre-bg__overlay" />
    </div>
  );
};

export default GenreBackground;