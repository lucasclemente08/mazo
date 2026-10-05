import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Table } from './pages/Table';
import { getLocalSession } from './services/gameService';

export const App: React.FC = () => {
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check URL path /r/:code
    const path = window.location.pathname;
    const match = path.match(/^\/r\/([A-Za-z0-9]{4})/);
    if (match) {
      setActiveRoomCode(match[1].toUpperCase());
      return;
    }

    // 2. Check localStorage session for instant reconnection
    const session = getLocalSession();
    if (session && session.roomCode) {
      setActiveRoomCode(session.roomCode);
    }
  }, []);

  const handleRoomJoined = (code: string) => {
    window.history.pushState({}, '', `/r/${code}`);
    setActiveRoomCode(code);
  };

  const handleLeave = () => {
    window.history.pushState({}, '', '/');
    setActiveRoomCode(null);
  };

  return (
    <div className="min-h-screen bg-[#0c2317] font-sans antialiased text-white select-none">
      {activeRoomCode ? (
        <Table roomCode={activeRoomCode} onLeave={handleLeave} />
      ) : (
        <Home
          onRoomCreated={handleRoomJoined}
          onRoomJoined={handleRoomJoined}
        />
      )}
    </div>
  );
};

export default App;
