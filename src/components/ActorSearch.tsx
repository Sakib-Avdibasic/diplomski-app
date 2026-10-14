import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { hierarchy, pack } from "d3-hierarchy";
import {
  searchPerson,
  searchPeople,
  getTotalBoxOffice,
  IMAGE_BASE,
} from "../api/tmdb";
import "./ActorSearch.css";

interface Person {
  id: number;
  name: string;
  profile_path: string;
  value: number;
}

const SEED_ACTORS = [
  "Samuel L. Jackson",
  "Robert Downey Jr.",
  "Scarlett Johansson",
  "Tom Cruise",
  "Tom Hanks",
  "Dwayne Johnson",
  "Chris Hemsworth",
  "Chris Evans",
  "Johnny Depp",
  "Will Smith",
  "Harrison Ford",
  "Zoe Saldana",
  "Vin Diesel",
  "Bradley Cooper",
];

let defaultCloudCache: Person[] | null = null;

interface ActorSearchProps {
  onSelectActor?: (person: Person) => void;
}

const ActorSearch = ({ onSelectActor }: ActorSearchProps) => {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(600);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    const loadDefault = async () => {
      if (defaultCloudCache) {
        setPeople(defaultCloudCache);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const found = await Promise.all(
          SEED_ACTORS.map(async (name) => {
            const person = await searchPerson(name);
            if (!person || !person.profile_path) return null;
            const boxOffice = await getTotalBoxOffice(person.id);
            return {
              id: person.id,
              name: person.name,
              profile_path: person.profile_path,
              value: boxOffice || 1,
            };
          })
        );
        defaultCloudCache = found.filter(Boolean) as Person[];
        if (!cancelled) setPeople(defaultCloudCache);
      } catch (err) {
        console.error("Greška pri učitavanju glumaca:", err);
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const runSearch = async () => {
      setLoading(true);
      try {
        const results = await searchPeople(trimmed);
        if (cancelled) return;
        setPeople(
          results
            .filter((p: any) => p.profile_path)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              profile_path: p.profile_path,
              value: p.popularity || 1,
            }))
        );
      } catch (err) {
        console.error("Greška pri pretrazi:", err);
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(
      trimmed === "" ? loadDefault : runSearch,
      trimmed === "" ? 0 : 400
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
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
        placeholder="Pretraži glumca…"
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
                  } as CSSProperties
                }
                onClick={() => onSelectActor?.(person)}
                title={person.name}
              >
                <img src={`${IMAGE_BASE}${person.profile_path}`} alt={person.name} />
                <span className="actor-search__name">{person.name}</span>
              </button>
            );
          })}

        {!loading && people.length === 0 && (
          <p className="actor-search__status">Nema pronađenih glumaca.</p>
        )}
      </div>
    </div>
  );
};

export default ActorSearch;