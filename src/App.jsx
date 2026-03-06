import { useState } from 'react'
import { useOuting } from './hooks/useOuting'
import Dashboard from './components/Dashboard'
import HistoryView from './components/HistoryView'
import PastOutingView from './components/PastOutingView'

function App() {
  const outing = useOuting();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'history', 'past-outing'
  const [selectedOutingId, setSelectedOutingId] = useState(null);

  const goToHistory = () => setView('history');
  const goToDashboard = () => setView('dashboard');
  const viewOuting = (id) => {
    setSelectedOutingId(id);
    setView('past-outing');
  };

  return (
    <>
      <nav style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
        {view === 'dashboard' && !outing.isTracking && (
          <button className="btn btn-secondary" onClick={goToHistory} style={{ padding: '8px 16px' }}>
            📜 History
          </button>
        )}
      </nav>

      {view === 'dashboard' && <Dashboard outing={outing} />}
      {view === 'history' && <HistoryView onBack={goToDashboard} onSelectOuting={viewOuting} />}
      {view === 'past-outing' && <PastOutingView outingId={selectedOutingId} onBack={goToHistory} />}
    </>
  )
}

export default App
