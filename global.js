console.log("IT’S ALIVE!");

/** $$: querySelectorAll → real Array */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}