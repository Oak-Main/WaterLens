// Loaded only by the smoke-test server. An offline Census response exercises
// the bundled gazetteer and avoids sending the fixture address to a provider.
const fetchNormally = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const target = new URL(typeof input === "object" && "url" in input ? input.url : input);
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
    return fetchNormally(input, init);
  }
  return Promise.resolve(new Response(null, { status: 503 }));
};
