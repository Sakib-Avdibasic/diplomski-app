import { useParams, Navigate } from "react-router-dom";
import GenreTrends from "../components/GenreTrends";

const GenreTrendsPage = () => {
  const { genreId, genreName } = useParams();

  if (!genreId || !genreName) {
    return <Navigate to="/genres" replace />;
  }

  return (
    <GenreTrends
      genreId={Number(genreId)}
      genreName={decodeURIComponent(genreName)}
    />
  );
};

export default GenreTrendsPage;