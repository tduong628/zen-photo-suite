
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div
      className="rounded-full w-10 h-10 animate-spin"
      style={{ border: '4px solid var(--color-surface-sunken)', borderTopColor: 'var(--color-accent)' }}
    ></div>
  );
};

export default Loader;
