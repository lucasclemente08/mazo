import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Table } from './pages/Table';
import { getLocalSession } from './services/gameService';

export const App: React.FC = () => {
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState('');

  useEffect(() => {
    const restore = (resumeSession = false) => {
    // 1. Check URL path /r/:code
    const path = window.location.pathname;
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
    if (resumeSession && session && session.roomCode) {
      setActiveRoomCode(session.roomCode);
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
  };

  const handleLeave = () => {
    window.history.pushState({}, '', '/');
    setActiveRoomCode(null);
    setInvitationCode('');
  };

  return (
    <div className="min-h-screen bg-[#0c2317] font-sans antialiased text-white select-none">
      {activeRoomCode ? (
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
