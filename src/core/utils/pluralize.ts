// determine if string should be plural
export const pluralize = (count: number, text: string) =>
  `${text}${count === 1 ? "" : "s"}`;
