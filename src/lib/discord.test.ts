import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAnnouncement, postAnnouncement } from "./discord.ts";

const server = { id: "abc", name: "@everyone join", address: "play.x.com", edition: "both", description: "<@&123> hi" };

test("buildAnnouncement never allows mentions", () => {
  assert.deepEqual(buildAnnouncement(server, "Bob", "https://x.test").allowed_mentions, { parse: [] });
});

test("buildAnnouncement links to the server anchor", () => {
  assert.equal(buildAnnouncement(server, "Bob", "https://x.test").embeds[0].url, "https://x.test/servers#abc");
});

test("buildAnnouncement shows the edition label and omits empty description", () => {
  const e = buildAnnouncement({ ...server, description: null }, "Bob", "https://x.test").embeds[0];
  assert.ok(e.fields.some((f) => f.value === "Both"));
  assert.equal("description" in e, false);
});

test("buildAnnouncement truncates over-long title and description", () => {
  const e = buildAnnouncement({ ...server, name: "n".repeat(300), description: "d".repeat(5000) }, "Bob", "https://x.test").embeds[0];
  assert.equal(e.title.length, 256);
  assert.equal(e.description?.length, 4096);
});

async function withFetch(stub: typeof fetch, run: () => Promise<void>) {
  const orig = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await run();
  } finally {
    globalThis.fetch = orig;
  }
}

test("postAnnouncement maps responses and failures to error strings", async () => {
  const p = buildAnnouncement(server, "Bob", "https://x.test");
  await withFetch(async () => new Response("", { status: 429 }), async () => assert.equal(await postAnnouncement("https://h", p), "HTTP 429"));
  await withFetch(async () => new Response(null, { status: 204 }), async () => assert.equal(await postAnnouncement("https://h", p), null));
  await withFetch(async () => { throw new TypeError("fail"); }, async () => assert.equal(await postAnnouncement("https://h", p), "network"));
  await withFetch(async () => { throw new DOMException("x", "TimeoutError"); }, async () => assert.equal(await postAnnouncement("https://h", p), "timeout"));
});
