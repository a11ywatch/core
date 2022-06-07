export function arrayAverage(arr: any[] = []): number {
  let sum = 0;
  for (const i in arr) {
    sum += arr[i];
  }
  return sum / (arr?.length || 1);
}
