export const usageExceededThreshold = ({
  audience,
  usage,
}: {
  audience: number;
  usage: number;
}): boolean => {
  return (
    (audience === 0 && usage >= 3) ||
    (audience === 1 && usage >= 100) ||
    (audience === 2 && usage >= 500)
  );
};
