import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar__list">
        <li><Link data-discover="true"
                key={"/"}
                to={"/"}
              >Naslovna</Link></li>
        <li><Link data-discover="true"
                key={"/glumci"}
                to={"/glumci"}
              >Glumci</Link>
              </li>
        <li><Link data-discover="true"
                key={"/reziseri"}
                to={"/reziseri"}
              >Režiseri</Link></li>
        <li><Link data-discover="true"
                key={"/studiji"}
                to={"/studiji"}
              >Studiji</Link></li>
        <li><Link data-discover="true"
                key={"/zanrovi"}
                to={"/zanrovi"}
              >Žanrovi</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;