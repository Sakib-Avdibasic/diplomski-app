import { useParams, Navigate } from "react-router-dom";
import DirectorProfile from "../components/DirectorProfile";

const DirectorProfilePage = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/reziseri" replace />;

  return <DirectorProfile directorId={Number(id)} />;
};

export default DirectorProfilePage;