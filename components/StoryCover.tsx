import { coverLabel, coverSeed, coverTone } from '@/lib/images';

const PALETTE = {
  debunk: { deep: '#3f1216', mid: '#7f1d1d', ink: '#fecaca', line: '#f87171' },
  confirmation: { deep: '#052e22', mid: '#065f46', ink: '#d1fae5', line: '#34d399' },
  mixed: { deep: '#3a2a12', mid: '#92400e', ink: '#ffedd5', line: '#ffc56d' },
  neutral: { deep: '#0b1b33', mid: '#1e3a5f', ink: '#e0f2fe', line: '#7dd3fc' },
};

export default function StoryCover({
  slug,
  eventType,
  verdictType,
  title,
}: {
  slug: string;
  eventType: string | null;
  verdictType: string | null;
  title: string;
}) {
  const tone = coverTone(eventType, verdictType);
  const label = coverLabel(eventType, verdictType);
  const seed = coverSeed(slug);
  const palette = PALETTE[tone];
  const shift = seed % 48;
  const rings = [0, 1, 2, 3].map((index) => 90 + ((seed >> (index * 3)) % 70) + index * 78);
  return (
    <svg className="cover" viewBox="0 0 1600 900" role="img" aria-label={`${label} illustration for ${title}`}>
      <defs>
        <linearGradient id={`${slug}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.deep} />
          <stop offset="1" stopColor={palette.mid} />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${slug}-sky)`} />
      {Array.from({ length: 14 }, (_, index) => (
        <line
          key={`h-${index}`}
          x1="0"
          x2="1600"
          y1={40 + index * 62 + (shift % 18)}
          y2={28 + index * 62}
          stroke={palette.line}
          strokeOpacity={index % 3 === 0 ? 0.45 : 0.18}
          strokeWidth={index % 4 === 0 ? 2 : 1}
        />
      ))}
      {Array.from({ length: 18 }, (_, index) => (
        <line
          key={`v-${index}`}
          y1="0"
          y2="900"
          x1={index * 96 + shift}
          x2={index * 96 + shift - 24}
          stroke={palette.line}
          strokeOpacity="0.14"
        />
      ))}
      {rings.map((radius, index) => (
        <circle
          key={radius}
          cx={280 + (seed % 220)}
          cy={620 - index * 28}
          r={radius}
          fill="none"
          stroke={palette.ink}
          strokeOpacity={0.22 + index * 0.05}
          strokeWidth="2"
        />
      ))}
      <text x="72" y="790" fill={palette.ink} fontFamily="IBM Plex Sans, Segoe UI, sans-serif" fontSize="54" fontWeight="700">
        {label}
      </text>
    </svg>
  );
}
