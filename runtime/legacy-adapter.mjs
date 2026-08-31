export function createLegacyAdapter({ handler = null, output = process.stdout } = {}) {
  return async function legacy(input) {
    if (typeof handler === "function") return Boolean(await handler(input));
    output.write(`Legacy command preserved but not exposed by the runtime adapter: ${input}\n`);
    return true;
  };
}
