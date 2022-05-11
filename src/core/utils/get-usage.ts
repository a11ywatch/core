const DEFAULT_MAX_LIMIT = 500; // default max for paid accs not entreprise.

// return truthy if api usage exceeds the limit [TODO: allow unlimited]
export const usageExceededThreshold = ({
  audience,
  usage,
  usageLimit,
}: {
  audience: number;
  usage: number;
  usageLimit?: number; // custom max limit for user
}): boolean => {
  if (audience === 0 && usage >= 3) {
    return true;
  }
  if (audience === 1 && usage >= 100) {
    return true;
  }
  if (audience === 2 && usage >= DEFAULT_MAX_LIMIT) {
    return true;
  }

  const maxLimit = usageLimit || DEFAULT_MAX_LIMIT;

  if (audience === 3 && usage >= maxLimit) {
    return true;
  }

  return false;
};
