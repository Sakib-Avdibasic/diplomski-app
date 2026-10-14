import { useNavigate } from "react-router-dom";
import DirectorSearch
 from "../components/DirectorSearch";
const DirectorsPage = () => {
  const navigate = useNavigate();

  return (
    <DirectorSearch
      onSelectDirector={(person) => navigate(`/reziseri/${person.id}`)}
    />
  );
};

export default DirectorsPage;