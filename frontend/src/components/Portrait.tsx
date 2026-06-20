import { useState } from 'react';

interface PortraitProps {
  id?: number;
  name?: string;
}

export default function Portrait({ id, name }: PortraitProps) {
  const [failed, setFailed] = useState(false);
  const src = id ? `https://images.evetech.net/characters/${id}/portrait?size=256` : null;

  return (
    <div className="portrait">
      <div className="corner-tick tl" />
      <div className="corner-tick tr" />
      <div className="corner-tick bl" />
      <div className="corner-tick br" />
      {src && !failed ? (
        <img
          src={src}
          alt={name ?? `Pilot ${id}`}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div className="id-tag">id:{id}</div>
      )}
    </div>
  );
}
