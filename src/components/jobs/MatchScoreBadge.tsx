interface MatchScoreBadgeProps {
  score: number;
  reason?: string;
}

export function MatchScoreBadge({ score, reason }: MatchScoreBadgeProps) {
  if (!score) return null;

  const color =
    score >= 8 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 6 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${color}`}
      title={reason}
    >
      {score}/10
      {reason && <span className="hidden sm:inline font-normal opacity-80">· {reason}</span>}
    </span>
  );
}
