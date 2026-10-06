import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Table } from './pages/Table';
import { getLocalSession } from './services/gameService';
import { getPage } from './seo/content';
import { updateMetadata } from './seo/metadata';
import { SeoPage } from './seo/SeoPage';

export const App: React.FC = () => {
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const restore = (resumeSession = false) => {
    // 1. Check URL path /r/:code
    const path = window.location.pathname;
    setPath(path);
    updateMetadata(path);
    if (getPage(path) || (path !== '/' && !/^\/r\/([A-Za-z0-9]{4})\/?$/.test(path))) {
      setActiveRoomCode(null); setInvitationCode(''); return;
    }
    const match = path.match(/^\/r\/([A-Za-z0-9]{4})\/?$/);
    const session = getLocalSession();
    if (match) {
      const code = match[1].toUpperCase();
      setInvitationCode(code);
      setActiveRoomCode(session?.roomCode === code ? code : null);
      return;
    }

    // 2. Check localStorage session for instant reconnection
    setInvitationCode('');
    if (resumeSession && session && session.roomCode && !window.location.search) {
      window.history.replaceState({}, '', `/r/${session.roomCode}`);
      setActiveRoomCode(session.roomCode);
      setPath(`/r/${session.roomCode}`); updateMetadata(`/r/${session.roomCode}`);
    } else {
      setActiveRoomCode(null);
    }
    };
    restore(true);
    const handlePopState = () => restore();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleRoomJoined = (code: string) => {
    window.history.pushState({}, '', `/r/${code}`);
    setActiveRoomCode(code);
    setPath(`/r/${code}`); updateMetadata(`/r/${code}`);
  };

  const handleLeave = () => {
    window.history.pushState({}, '', '/');
    setActiveRoomCode(null);
    setInvitationCode('');
    setPath('/'); updateMetadata('/');
  };

  return (
    <div className="min-h-screen bg-[#0c2317] font-sans antialiased text-white select-none">
      {getPage(path) ? <SeoPage page={getPage(path)!} /> : path !== '/' && !/^\/r\/([A-Za-z0-9]{4})\/?$/.test(path) ?
        <main className="seo-article select-text"><h1>No encontramos esa página</h1><a href="/" className="seo-cta mt-6">Volver al inicio</a></main> : activeRoomCode ? (
        <Table key={activeRoomCode} roomCode={activeRoomCode} onLeave={handleLeave} />
      ) : (
        <Home
          initialRoomCode={invitationCode}
          onRoomCreated={handleRoomJoined}
          onRoomJoined={handleRoomJoined}
        />
      )}
    </div>
  );
};

export default App;
