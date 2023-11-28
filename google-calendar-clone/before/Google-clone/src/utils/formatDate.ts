import { zhCN } from "date-fns/locale";

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("sp", options).format(date);
}
