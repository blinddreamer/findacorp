import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BrandMark from './components/BrandMark';
import Btn from './components/Btn';
import { useAuth, clearAccessToken } from './auth/useAuth';
import { logout } from './api/authApi';
import { globalSearch, type GlobalSearchResult } from './api/profileApi';
import { getUnreadCount } from './api/applicationApi';
import AuthCallback from './auth/AuthCallback';
import LandingScreen from './screens/LandingScreen';
import PilotProfileScreen from './screens/PilotProfileScreen';
import CorpListingScreen from './screens/CorpListingScreen';
import SearchPilotsScreen from './screens/SearchPilotsScreen';
import SearchCorpsScreen from './screens/SearchCorpsScreen';
import InboxScreen from './screens/InboxScreen';

const FACTION = 'caldari';

export default function App() {
  const auth = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-faction', FACTION);
    document.documentElement.setAttribute('data-density', 'balanced');
    document.documentElement.setAttribute('data-card', 'elevated');
  }, []);

  return (
    <div className="shell">
      <TopNav auth={auth} />
      <main>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/pilots/:characterId" element={<PilotProfileScreen />} />
          <Route path="/corps/:corpId" element={<CorpListingScreen />} />
          <Route path="/search/pilots" element={<SearchPilotsScreen />} />
          <Route path="/search/corps" element={<SearchCorpsScreen />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}

function NavPortrait({ characterId, name }: { characterId: number | null; name: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = characterId ? `https://images.evetech.net/characters/${characterId}/portrait?size=64` : null;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ?? 'pilot'}
        onError={() => setFailed(true)}
        style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-elev)', display: 'grid', placeItems: 'center',
    }}>
      <span className="mono" style={{ fontSize: 10, color: 'var(--accent-text)' }}>P</span>
    </div>
  );
}

interface NavAuth {
  token: string | null;
  characterId: number | null;
  characterName: string | null;
}

function TopNav({ auth }: { auth: NavAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { path: '/', label: 'Home' },
    { path: '/search/corps', label: 'Find a corp' },
    { path: '/search/pilots', label: 'HR · find pilots' },
    ...(auth.characterId ? [{ path: `/pilots/${auth.characterId}`, label: 'My profile' }] : []),
  ];

  return (
    <nav className="topnav">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span className="brand-mark"><BrandMark /></span>
        <span>DRYDOCK</span>
      </div>
      <div className="nav-links">
        {links.map(l => (
          <div key={l.path} className={`nav-link ${currentPath === l.path ? 'active' : ''}`} onClick={() => navigate(l.path)}>
            {l.label}
          </div>
        ))}
      </div>
      <div className="nav-right">
        <SearchBar navigate={navigate} />
        {auth.token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InboxButton navigate={navigate} currentPath={currentPath} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', border: '1px solid var(--border-soft)', borderRadius: 999 }}>
              <NavPortrait characterId={auth.characterId} name={auth.characterName} />
              <span style={{ fontSize: 12.5 }}>{auth.characterName}</span>
            </div>
            <Btn sm onClick={async () => {
              try { await logout(); } catch { /* best-effort */ }
              clearAccessToken();
              navigate('/');
            }}>
              Log out
            </Btn>
          </div>
        ) : (
          <Btn sm primary onClick={() => { window.location.href = '/auth/login'; }}>
            Log in with EVE SSO
          </Btn>
        )}
      </div>
    </nav>
  );
}

function InboxButton({ navigate, currentPath }: { navigate: (p: string) => void; currentPath: string }) {
  const { data: count = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });

  return (
    <Btn sm ghost onClick={() => navigate('/inbox')} style={currentPath === '/inbox' ? { borderColor: 'var(--accent)' } : undefined}>
      Inbox
      {count > 0 && (
        <span className="mono" style={{ color: 'var(--accent-text)', marginLeft: 5 }}>{count}</span>
      )}
    </Btn>
  );
}

function SearchBar({ navigate }: { navigate: (p: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await globalSearch(q);
      setResults(res);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function handleSelect(r: GlobalSearchResult) {
    navigate(r.type === 'pilot' ? `/pilots/${r.id}` : `/corps/${r.id}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setResults([]); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) handleSelect(results[activeIdx]);
  }

  // ⌘K / Ctrl+K focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click-outside closes
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const showDropdown = open && (results.length > 0 || query.length > 0);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="input"
          placeholder="Search pilots, corps…"
          style={{ width: 260, paddingRight: 52 }}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <span className="kbd-hint" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          ⌘K
        </span>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {results.length === 0 && query.trim() && (
            <div className="mono" style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-dim)' }}>
              No results for "{query}"
            </div>
          )}
          {results.map((r, i) => (
            <SearchResultRow
              key={`${r.type}-${r.id}`}
              result={r}
              active={i === activeIdx}
              onClick={() => handleSelect(r)}
              onHover={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  result, active, onClick, onHover,
}: {
  result: GlobalSearchResult;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : 'transparent',
        borderBottom: '1px solid var(--border-soft)',
        transition: 'background 0.1s',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: result.type === 'corp' ? 4 : 999,
        background: 'var(--bg-elev)', display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--accent-text)' }}>
          {result.type === 'pilot' ? 'P' : 'C'}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.name}</div>
        {result.ticker && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>{result.ticker}</div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{result.type}</div>
    </div>
  );
}
