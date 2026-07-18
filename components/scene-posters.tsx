export function HeroPoster() {
  return (
    <div className="scene-poster hero-poster" aria-hidden>
      <span className="poster-sun" />
      <span className="mountain mountain-one" />
      <span className="mountain mountain-two" />
      <span className="mountain mountain-three" />
      <span className="poster-grid" />
    </div>
  );
}

export function MissionPoster() {
  return (
    <div className="scene-poster mission-poster" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => <span key={index} className={`poster-node node-${index + 1}`} />)}
      <i />
    </div>
  );
}

export function GlobePoster() {
  return (
    <div className="scene-poster globe-poster" aria-hidden>
      <span />
      <i className="globe-axis-one" />
      <i className="globe-axis-two" />
      <b className="globe-point-one" />
      <b className="globe-point-two" />
      <b className="globe-point-three" />
    </div>
  );
}
