export default function Particles({ color = '#00b4ff', count = 14 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 0, overflow: 'hidden'
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{
          position: 'absolute',
          width: `${2 + (i % 4)}px`,
          height: `${2 + (i % 4)}px`,
          borderRadius: '50%',
          background: i % 2 === 0 ? color : '#ffffff44',
          left: `${5 + i * 6.5}%`,
          bottom: '-10px',
          animation: `particleFloat ${8 + (i * 1.3)}s linear infinite`,
          animationDelay: `${-(i * 1.1)}s`,
          opacity: 0.3,
        }} />
      ))}
    </div>
  );
}
