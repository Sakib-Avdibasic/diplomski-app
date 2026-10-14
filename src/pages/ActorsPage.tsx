import { useNavigate } from "react-router-dom";
import ActorSearch from "../components/ActorSearch";

const ActorsPage = () => {
  const navigate = useNavigate();

  return (
    <ActorSearch
      onSelectActor={(person) => navigate(`/glumci/${person.id}`)}
    />
  );
};

export default ActorsPage;