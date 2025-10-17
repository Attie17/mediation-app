import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLastRoute } from '../lib/storage';

export default function ContinueTile() {
  const location = useLocation();
  const [last, setLast] = React.useState(null);
  React.useEffect(() => { setLast(getLastRoute()); }, [location.pathname]);
  if (!last || last === location.pathname) return null;
  return (
    <Link to={last} className="block bg-white/10 hover:bg-white/15 rounded-md p-3 transition">
      <div className="text-sm opacity-90">Continue where you left off</div>
      <div className="text-xs opacity-80">{last}</div>
    </Link>
  );
}
