'use client';

export default function TVVideo2() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <video
        src="/tv/video-2.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
