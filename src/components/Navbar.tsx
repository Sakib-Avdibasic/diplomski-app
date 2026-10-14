import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar__list">
        <li><Link
                key={"/"}
                to={"/"}
              >Naslovna</Link></li>
        <li><Link
                key={"/glumci"}
                to={"/glumci"}
              >Glumci</Link>
              </li>
        <li><Link
                key={"/reziseri"}
                to={"/reziseri"}
              >Režiseri</Link></li>
        <li><Link
                key={"/studiji"}
                to={"/studiji"}
              >Studiji</Link></li>
        <li><Link
                key={"/zanrovi"}
                to={"/zanrovi"}
              >Žanrovi</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;