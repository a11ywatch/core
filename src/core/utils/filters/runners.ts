// check to see if runners are duplicated
export const filterRunnerDuplicates = (runners: string[]): string[] => {
  if (runners.length === 2) {
    if (runners[0] === runners[1]) {
      return [runners[0]];
    }
  }
  if (runners.length >= 3) {
    return [...new Set(runners)];
  }
  return runners;
};
