import { test } from "node:test";
import assert from "node:assert/strict";
import { applicationSchema, reasonSchema } from "./owners.ts";

const valid = {
  server_name: "Cool Server",
  server_address: "Play.Example.com:25565",
  edition: "java",
  server_about: "A friendly survival server.",
  play_styles: ["survival"],
  play_styles_other: "",
  player_base_size: "10-50",
  community_size: "50-200",
  running_since: "2024-01-15",
  discord_link: "https://discord.gg/abc-123",
  why_join: "We want more players.",
};

const failedKeys = (patch: Record<string, unknown>) => {
  const r = applicationSchema.safeParse({ ...valid, ...patch });
  return r.success ? [] : r.error.issues.map((i) => i.path[0]);
};

test("applicationSchema accepts a valid application and normalizes the address", () => {
  const r = applicationSchema.safeParse(valid);
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.server_address, "play.example.com:25565");
    assert.equal(r.data.play_styles_other, null);
    assert.equal(r.data.running_since, "2024-01-15");
  }
});

test("applicationSchema rejects a non-Discord link", () => {
  assert.ok(failedKeys({ discord_link: "https://evil.com/x" }).includes("discord_link"));
});

test("applicationSchema rejects a future running_since", () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  assert.ok(failedKeys({ running_since: tomorrow }).includes("running_since"));
  assert.ok(failedKeys({ running_since: "2024-02-31" }).includes("running_since"));
});

test("applicationSchema rejects unknown size bucket and over-long why_join", () => {
  const keys = failedKeys({ community_size: "1000", why_join: "x".repeat(501) });
  assert.ok(keys.includes("community_size"));
  assert.ok(keys.includes("why_join"));
});

test("applicationSchema rejects whitespace-only required text", () => {
  for (const k of ["server_name", "server_about", "why_join"]) assert.ok(failedKeys({ [k]: "   " }).includes(k), k);
});

test("reasonSchema trims and rejects empty", () => {
  assert.equal(reasonSchema.safeParse("  ").success, false);
  assert.equal(reasonSchema.parse(" spam "), "spam");
});
