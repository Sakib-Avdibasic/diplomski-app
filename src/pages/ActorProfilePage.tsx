import { useParams, Navigate } from "react-router-dom";
import ActorProfile from "../components/ActorProfile";

const ActorProfilePage = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/glumci" replace />;

  return <ActorProfile actorId={Number(id)} />;
};

export default ActorProfilePage;