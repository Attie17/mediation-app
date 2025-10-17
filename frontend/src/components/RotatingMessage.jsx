import React from 'react';
import { getRandomMessage } from '../utils/messages';
import { useAuth } from '../context/AuthContext';

export default function RotatingMessage() {
  const [text, setText] = React.useState('');
  const [paused, setPaused] = React.useState(false);
  const { user } = useAuth();
  const role = user?.role || 'divorcee';
  const name = user?.preferredName || user?.name || user?.email?.split('@')[0] || 'there';

  React.useEffect(() => {
    setText(getRandomMessage(role, name));
    const t = setInterval(() => {
      if (!paused) setText(getRandomMessage(role, name));
    }, 10000);
    return () => clearInterval(t);
  }, [role, name, paused]);

  return (
    <p className="italic opacity-90" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {text}
    </p>
  );
}
