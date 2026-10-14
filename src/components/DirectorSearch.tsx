import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack } from "d3-hierarchy";
import {
  searchPerson,
  searchPeople,
  getTotalBoxOfficeForDirector,
  IMAGE_BASE,
} from "../api/tmdb";
import "./ActorSearch.css"; 

interface Person {
  id: number;
  name: string;
  profile_path: string;
  value: number;
}

const SEED_DIRECTORS = [
  "Steven Spielberg",
  "Christopher Nolan",
  "James Cameron",
  "Peter Jackson",
  "Michael Bay",
  "Ridley Scott",
  "Tim Burton",
  "David Fincher",
  "Quentin Tarantino",
  "Martin Scorsese",
  "Denis Villeneuve",
  "Jon Favreau",
];

interface DirectorSearchProps {
  onSelectDirector?: (person: Person) => void;
}

const DirectorSearch = ({ onSelectDirector }: DirectorSearchProps) => {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(600);

  const loadDefaultCloud = async () => {
    setLoading(true);
    const found = await Promise.all(
      SEED_DIRECTORS.map(async (name) => {
        const person = await searchPerson(name);
        if (!person || !person.profile_path) return null;
        const boxOffice = await getTotalBoxOfficeForDirector(person.id);
        return {
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          value: boxOffice || 1,
        };
      })
    );
    setPeople(found.filter(Boolean) as Person[]);
    setLoading(false);
  };

  useEffect(() => {
    loadDefaultCloud();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim() === "") {
      loadDefaultCloud();
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchPeople(query);
      const mapped = results
        .filter((p: any) => p.profile_path)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          profile_path: p.profile_path,
          value: p.popularity || 1,
        }));
      setPeople(mapped);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) setSize(containerRef.current.offsetWidth);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const packedNodes = useMemo(() => {
    if (people.length === 0) return [];
    const root = hierarchy({ children: people } as any).sum((d: any) =>
      Math.sqrt(d.value)
    );
    const layout = pack().size([size, size]).padding(14);
    return layout(root).leaves();
  }, [people, size]);

  return (
    <div className="actor-search">
      <input
        type="text"
        className="actor-search__input"
        placeholder="Pretraži režisera…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div
        className="actor-search__cloud"
        ref={containerRef}
        style={{ height: size || 600 }}
      >
        {loading && <p className="actor-search__status">Učitavanje…</p>}

        {!loading &&
          packedNodes.map((node: any) => {
            const person = node.data as Person;
            const hoverGrow = 14;
            const hoverScale = (node.r + hoverGrow) / node.r;
            return (
              <button
                key={person.id}
                className="actor-search__dot"
                style={
                  {
                    width: node.r * 2,
                    height: node.r * 2,
                    left: node.x - node.r,
                    top: node.y - node.r,
                    "--hover-scale": hoverScale,
                  } as React.CSSProperties
                }
                onClick={() => onSelectDirector?.(person)}
                title={person.name}
              >
                <img
                  src={`${IMAGE_BASE}${person.profile_path}`}
                  alt={person.name}
                />
                <span className="actor-search__name">{person.name}</span>
              </button>
            );
          })}

        {!loading && people.length === 0 && (
          <p className="actor-search__status">Nema pronađenih režisera.</p>
        )}
      </div>
    </div>
  );
};

export default DirectorSearch;