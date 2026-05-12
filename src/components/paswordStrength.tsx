export function getStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-400' };
  if (score <= 2) return { score, label: 'Razoável', color: 'bg-orange-400' };
  if (score <= 3) return { score, label: 'Boa', color: 'bg-yellow-400' };
  return { score, label: 'Forte', color: 'bg-green-500' };
}
