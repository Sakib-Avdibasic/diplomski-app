import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar__list">
        <li><a href="/">Naslovna</a></li>
        <li><a href="/glumci">Glumci</a></li>
        <li><a href="/reziseri">Režiseri</a></li>
        <li><a href="/studiji">Studiji</a></li>
        <li><a href="/zanrovi">Žanrovi</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;