export function cc(...classes: unknown[]) {
  //Concate Classes
  return classes.filter(c => typeof c === "string").join(" ");
}
