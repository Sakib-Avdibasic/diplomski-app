import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
export const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
export const BACKDROP_MEDIUM = "https://image.tmdb.org/t/p/w780";
export const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
export const LOGO_BASE = "https://image.tmdb.org/t/p/w300";
export const PROFILE_LARGE = "https://image.tmdb.org/t/p/h632";

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
});

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const MAX_CONCURRENT = 15;
let active = 0;
const waiting: Array<() => void> = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      active++;
      resolve();
    });
  });
}

function release() {
  active--;
  const next = waiting.shift();
  if (next) next();
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchJson(url: string, params: Record<string, any>) {
  for (let attempt = 0; ; attempt++) {
    let wait = 0;
    await acquire();
    try {
      const res = await tmdb.get(url, { params });
      return res.data;
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt >= 3) throw err;
      const retryAfter = Number(err.response?.headers?.["retry-after"]) || 0;
      wait = Math.max(retryAfter * 1000, 500 * 2 ** attempt);
    } finally {
      release();
    }
    await sleep(wait);
  }
}

const STORAGE_PREFIX = "tmdb:v1:";

function readStored(key: string) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;
    const { v, exp } = JSON.parse(raw);
    if (Date.now() > exp) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return undefined;
    }
    return v;
  } catch {
    return undefined;
  }
}

function clearStored() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    return;
  }
}

function writeStored(key: string, value: any, ttl: number) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({ v: value, exp: Date.now() + ttl })
    );
  } catch {
    clearStored();
  }
}

const memory = new Map<string, Promise<any>>();

interface CacheOptions {
  ttl?: number;
  pick?: (data: any) => any;
}

function cachedGet(
  url: string,
  params: Record<string, any> = {},
  { ttl, pick }: CacheOptions = {}
): Promise<any> {
  const key = `${url}?${JSON.stringify(params)}`;
  const hit = memory.get(key);
  if (hit) return hit;

  const promise = (async () => {
    if (ttl) {
      const stored = readStored(key);
      if (stored !== undefined) return stored;
    }
    const data = await fetchJson(url, params);
    const value = pick ? pick(data) : data;
    if (ttl) writeStored(key, value, ttl);
    return value;
  })();

  memory.set(key, promise);
  promise.catch(() => memory.delete(key));
  return promise;
}

const trimMovie = (m: any) => ({
  id: m.id,
  title: m.title,
  release_date: m.release_date,
  genre_ids: m.genre_ids,
  popularity: m.popularity,
});

const trimCredits = (list: any[] = []) =>
  list.map((c) => ({
    id: c.id,
    title: c.title,
    release_date: c.release_date,
    popularity: c.popularity,
  }));

const trimPerson = (p: any) => ({
  id: p.id,
  name: p.name,
  profile_path: p.profile_path,
  popularity: p.popularity,
  known_for_department: p.known_for_department,
});

const GENRE_NAMES_BS: Record<number, string> = {
  28: "Akcija",
  12: "Avantura",
  16: "Animirani",
  35: "Komedija",
  80: "Krimi",
  99: "Dokumentarni",
  18: "Drama",
  10751: "Porodični",
  14: "Fantazija",
  36: "Historijski",
  27: "Horor",
  10402: "Muzički",
  9648: "Misterija",
  10749: "Romantika",
  878: "Naučna fantastika",
  10770: "TV film",
  53: "Triler",
  10752: "Ratni",
  37: "Vestern",
};

export function genreNameBs(id: number, fallback: string) {
  return GENRE_NAMES_BS[id] ?? fallback;
}

export interface TrendingMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export async function getTrendingMovies(): Promise<TrendingMovie[]> {
  return cachedGet(
    "/trending/movie/week",
    {},
    {
      ttl: HOUR,
      pick: (d) =>
        d.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          release_date: m.release_date,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
        })),
    }
  );
}

export async function getMovieRevenue(movieId: number): Promise<number> {
  return cachedGet(
    `/movie/${movieId}`,
    {},
    { ttl: WEEK, pick: (d) => (d.revenue as number) || 0 }
  );
}

export async function getMovieDetailsWithCredits(movieId: number) {
  const movie = await cachedGet(
    `/movie/${movieId}`,
    { append_to_response: "credits" },
    {
      ttl: WEEK,
      pick: (d) => ({
        id: d.id,
        title: d.title,
        release_date: d.release_date,
        revenue: d.revenue || 0,
        vote_average: d.vote_average,
        genres: d.genres,
        credits: {
          cast: (d.credits?.cast ?? [])
            .slice(0, 8)
            .map((c: any) => ({ id: c.id, name: c.name })),
          crew: (d.credits?.crew ?? [])
            .filter((c: any) => c.job === "Director")
            .map((c: any) => ({ id: c.id, name: c.name, job: c.job })),
        },
      }),
    }
  );

  return {
    ...movie,
    genres: (movie.genres ?? []).map((g: any) => ({
      id: g.id,
      name: genreNameBs(g.id, g.name),
    })),
  };
}

export interface TopGrossingMovie {
  id: number;
  title: string;
  year: number;
  revenue: number;
}

export async function getAllTimeTopGrossing(limit = 5): Promise<TopGrossingMovie[]> {
  const movies = await cachedGet(
    "/discover/movie",
    { sort_by: "revenue.desc", "vote_count.gte": 1000 },
    { ttl: DAY, pick: (d) => d.results.map(trimMovie) }
  );
  const top = movies.slice(0, limit);
  const revenues = await Promise.all(
    top.map((m: any) => getMovieRevenue(m.id).catch(() => 0))
  );
  return top.map((m: any, i: number) => ({
    id: m.id,
    title: m.title,
    year: new Date(m.release_date).getFullYear(),
    revenue: +(revenues[i] / 1_000_000).toFixed(1),
  }));
}

function getPersonBundle(personId: number) {
  return cachedGet(
    `/person/${personId}`,
    { append_to_response: "movie_credits" },
    {
      ttl: WEEK,
      pick: (d) => ({
        id: d.id,
        name: d.name,
        biography: d.biography,
        profile_path: d.profile_path,
        popularity: d.popularity,
        cast: trimCredits(d.movie_credits?.cast),
        directed: trimCredits(
          (d.movie_credits?.crew ?? []).filter((c: any) => c.job === "Director")
        ),
      }),
    }
  );
}

export async function getPersonDetails(personId: number) {
  return getPersonBundle(personId);
}

export async function getPersonMovieCredits(personId: number) {
  return (await getPersonBundle(personId)).cast;
}

export async function getPersonDirectingCredits(personId: number) {
  return (await getPersonBundle(personId)).directed;
}

export async function searchPeople(query: string) {
  return cachedGet(
    "/search/person",
    { query },
    { ttl: DAY, pick: (d) => d.results.map(trimPerson) }
  );
}

export async function searchPerson(name: string) {
  return (await searchPeople(name))[0];
}

export async function getPopularPeople() {
  return cachedGet(
    "/person/popular",
    {},
    { ttl: DAY, pick: (d) => d.results.map(trimPerson) }
  );
}

export async function getTotalBoxOffice(personId: number, maxMovies = 8) {
  const cast = await getPersonMovieCredits(personId);
  const top = cast
    .filter((m: any) => m.release_date)
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, maxMovies);

  const revenues = await Promise.all(
    top.map((m: any) => getMovieRevenue(m.id).catch(() => 0))
  );
  return revenues.reduce((sum: number, r: number) => sum + (r || 0), 0);
}

export async function getTotalBoxOfficeForDirector(personId: number, maxMovies = 8) {
  const directed = await getPersonDirectingCredits(personId);
  const top = directed
    .filter((m: any) => m.release_date)
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, maxMovies);

  const revenues = await Promise.all(
    top.map((m: any) => getMovieRevenue(m.id).catch(() => 0))
  );
  return revenues.reduce((sum: number, r: number) => sum + (r || 0), 0);
}

export async function getGenres() {
  const genres: { id: number; name: string }[] = await cachedGet(
    "/genre/movie/list",
    {},
    { ttl: WEEK, pick: (d) => d.genres }
  );
  return genres
    .map((g) => ({ id: g.id, name: genreNameBs(g.id, g.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "bs"));
}

interface DiscoverMovie {
  id: number;
  title: string;
  release_date: string;
}

export interface GenreRevenueEntry {
  id: number;
  title: string;
  year: number;
  revenue: number;
}

type GenreListener = (entries: GenreRevenueEntry[], done: boolean) => void;

interface GenreJob {
  entries: GenreRevenueEntry[];
  done: boolean;
  listeners: Set<GenreListener>;
}

const GENRE_PAGES = 5;
const genreJobs = new Map<string, GenreJob>();

function notify(job: GenreJob) {
  const snapshot = [...job.entries];
  job.listeners.forEach((fn) => fn(snapshot, job.done));
}

async function runGenreJob(
  key: string,
  job: GenreJob,
  genreId: number,
  startYear: number,
  endYear: number
) {
  const storageKey = `genre-dataset:${key}`;
  const stored = readStored(storageKey);
  if (stored !== undefined) {
    job.entries = stored;
    job.done = true;
    notify(job);
    return;
  }

  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      notify(job);
    }, 150);
  };

  const loadPage = async (page: number) => {
    let movies: DiscoverMovie[] = [];
    try {
      movies = await cachedGet(
        "/discover/movie",
        {
          with_genres: genreId,
          sort_by: "revenue.desc",
          "primary_release_date.gte": `${startYear}-01-01`,
          "primary_release_date.lte": `${endYear}-12-31`,
          page,
        },
        { ttl: DAY, pick: (d) => d.results.map(trimMovie) }
      );
    } catch {
      failures++;
      return;
    }

    await Promise.all(
      movies.map(async (m) => {
        try {
          const revenue = await getMovieRevenue(m.id);
          const year = new Date(m.release_date).getFullYear();
          if (revenue > 0 && !isNaN(year)) {
            job.entries.push({
              id: m.id,
              title: m.title,
              year,
              revenue: +(revenue / 1_000_000).toFixed(1),
            });
            schedule();
          }
        } catch {
          failures++;
        }
      })
    );
  };

  await Promise.all(Array.from({ length: GENRE_PAGES }, (_, i) => loadPage(i + 1)));

  if (timer) clearTimeout(timer);
  job.done = true;
  if (failures === 0) writeStored(storageKey, job.entries, DAY);
  else genreJobs.delete(key);
  notify(job);
}

export function subscribeGenreRevenue(
  genreId: number,
  startYear: number,
  endYear: number,
  onUpdate: GenreListener
): () => void {
  const key = `${genreId}:${startYear}:${endYear}`;
  let job = genreJobs.get(key);

  if (!job) {
    job = { entries: [], done: false, listeners: new Set() };
    genreJobs.set(key, job);
    void runGenreJob(key, job, genreId, startYear, endYear);
  }

  const current = job;
  current.listeners.add(onUpdate);
  onUpdate([...current.entries], current.done);

  return () => {
    current.listeners.delete(onUpdate);
  };
}

export async function getGenreBackdrop(genreId: number) {
  const path = await cachedGet(
    "/discover/movie",
    {
      with_genres: genreId,
      sort_by: "vote_count.desc",
      "vote_average.gte": 7,
    },
    {
      ttl: WEEK,
      pick: (d) => d.results.find((m: any) => m.backdrop_path)?.backdrop_path ?? null,
    }
  );
  return path ? `${BACKDROP_BASE}${path}` : null;
}

export async function searchCompany(name: string) {
  const results = await cachedGet(
    "/search/company",
    { query: name },
    {
      ttl: WEEK,
      pick: (d) =>
        d.results.map((c: any) => ({ id: c.id, name: c.name, logo_path: c.logo_path })),
    }
  );
  return results[0];
}

export async function getCompanyDetails(companyId: number) {
  return cachedGet(
    `/company/${companyId}`,
    {},
    {
      ttl: WEEK,
      pick: (d) => ({
        id: d.id,
        name: d.name,
        logo_path: d.logo_path,
        origin_country: d.origin_country,
        headquarters: d.headquarters,
      }),
    }
  );
}

interface DiscoverMovieWithGenres {
  id: number;
  title: string;
  genre_ids: number[];
  release_date: string;
  popularity: number;
}

export async function discoverMoviesByCompany(
  companyId: number,
  pages = 3
): Promise<DiscoverMovieWithGenres[]> {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      cachedGet(
        "/discover/movie",
        { with_companies: companyId, sort_by: "vote_count.desc", page: i + 1 },
        { ttl: DAY, pick: (d) => d.results.map(trimMovie) }
      )
    )
  );
  return responses.flat();
}

export async function getStudioGenreDistribution(companyId: number) {
  const [movies, genreList] = await Promise.all([
    discoverMoviesByCompany(companyId),
    getGenres(),
  ]);

  const genreMap = new Map(genreList.map((g) => [g.id, g.name]));
  const counts = new Map<string, number>();

  movies.forEach((m) => {
    m.genre_ids.forEach((id) => {
      const name = genreMap.get(id);
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getStudioTopMovies(companyId: number, limit = 8) {
  const movies = await discoverMoviesByCompany(companyId);
  return [...movies]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map((m) => ({ title: m.title, year: new Date(m.release_date).getFullYear() }));
}

const KNOWN_STUDIO_IDS: Record<string, number> = {
  "Warner Bros. Pictures": 174,
  "Universal Pictures": 33,
  "Paramount Pictures": 4,
  "Walt Disney Pictures": 2,
  "Columbia Pictures": 5,
  "20th Century Studios": 25,
  "New Line Cinema": 12,
  "Lionsgate": 1632,
  "DreamWorks Pictures": 7,
  "A24": 41077,
  "Metro-Goldwyn-Mayer": 21,
  "Legendary Pictures": 923,
};

export async function resolveStudio(name: string) {
  const knownId = KNOWN_STUDIO_IDS[name];
  if (knownId) return getCompanyDetails(knownId);
  return searchCompany(name);
}

const SHOWCASE_ACTOR = "Tom Hanks";
const SHOWCASE_DIRECTOR = "Steven Spielberg";
const SHOWCASE_STUDIO = "Warner Bros. Pictures";
const SHOWCASE_GENRE_ID = 878;

async function personPhoto(name: string): Promise<string | null> {
  const person = await searchPerson(name);
  return person?.profile_path ? `${PROFILE_LARGE}${person.profile_path}` : null;
}

async function studioLogo(name: string): Promise<string | null> {
  const studio = await resolveStudio(name);
  return studio?.logo_path ? `${LOGO_BASE}${studio.logo_path}` : null;
}

export interface HomeShowcase {
  actors: string | null;
  directors: string | null;
  studios: string | null;
  genres: string | null;
}

export async function getHomeShowcase(): Promise<HomeShowcase> {
  const [actors, directors, studios, genres] = await Promise.all([
    personPhoto(SHOWCASE_ACTOR).catch(() => null),
    personPhoto(SHOWCASE_DIRECTOR).catch(() => null),
    studioLogo(SHOWCASE_STUDIO).catch(() => null),
    getGenreBackdrop(SHOWCASE_GENRE_ID).catch(() => null),
  ]);

  return { actors, directors, studios, genres };
}