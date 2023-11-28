export type UnionOmit<T, K extends number | string | symbol> = T extends unknown
  ? Omit<T, K>
  : never;
