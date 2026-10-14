import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ActorsPage from "./pages/ActorsPage";
import ActorProfilePage from "./pages/ActorProfilePage";
import DirectorsPage from "./pages/DirectorsPage";
import GenreSelectPage from "./pages/GenreSelectPage";
import GenreTrendsPage from "./pages/GenreTrendsPage";
import HomePage from "./pages/HomePage";
import StudioProfilePage from "./pages/StudioProfilePage";
import StudioSelectPage from "./pages/StudioSelectPage";
import DirectorProfilePage from "./pages/DirectorProfilePage";
import ScrollToTop from "./utils/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/glumci" element={<ActorsPage />} />
        <Route path="/glumci/:id" element={<ActorProfilePage />} />
        <Route path="/reziseri" element={<DirectorsPage />} />
        <Route path="/reziseri/:id" element={<DirectorProfilePage />} />
        <Route path="/zanrovi" element={<GenreSelectPage />} />
        <Route path="/zanrovi/:genreId/:genreName" element={<GenreTrendsPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/studiji" element={<StudioSelectPage />} />
        <Route path="/studiji/:id" element={<StudioProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;