import { time } from 'console';
import { useState, useEffect } from 'react';
import { timeAgo } from '../utils/utils';

interface Props {
    timestamp: string
}
export const Timestamp: React.FC<Props> = ({timestamp}) => {
    const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
        const diff = timeAgo(timestamp)
        setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return <p className="mb-2">Scores updated {elapsed}</p>;
}