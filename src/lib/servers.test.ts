import { test } from "node:test";
import assert from "node:assert/strict";
import { isDiscordInvite, normalizeAddress, serverSchema } from "./servers.ts";

test("normalizeAddress canonicalizes the port and strips a trailing dot before it", () => {
  assert.equal(normalizeAddress("a.com:025565"), "a.com:25565");
  assert.equal(normalizeAddress("a.com.:25565"), "a.com:25565");
});

test("isDiscordInvite only allows https discord invite links", () => {
  assert.equal(isDiscordInvite("https://discord.gg/abc-1"), true);
  assert.equal(isDiscordInvite("https://discord.com/invite/abc"), true);
  assert.equal(isDiscordInvite("javascript:alert(1)"), false);
  assert.equal(isDiscordInvite("https://evil.com/x"), false);
});

const valid = {
  name: "Cool Server",
  address: "play.example.com",
  edition: "java",
  description: "A friendly survival server.",
  play_styles: ["survival"],
  discord_invite: "",
};

test("normalizeAddress lowercases and strips a trailing dot", () => {
  assert.equal(normalizeAddress("Play.Example.com"), "play.example.com");
  assert.equal(normalizeAddress("play.example.com."), "play.example.com");
});

test("normalizeAddress keeps a valid port and accepts IPv4", () => {
  assert.equal(normalizeAddress("play.example.com:25565"), "play.example.com:25565");
  assert.equal(normalizeAddress("1.2.3.4:19132"), "1.2.3.4:19132");
});

test("normalizeAddress rejects scheme, path, spaces, bad port and empty", () => {
  for (const bad of ["https://play.example.com", "play.example.com/path", "play example.com", "play.example.com:99999", ""]) {
    assert.equal(normalizeAddress(bad), null, bad);
  }
});

test("serverSchema accepts a valid server and normalizes it", () => {
  const r = serverSchema.safeParse({ ...valid, address: "Play.Example.com" });
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.address, "play.example.com");
    assert.equal(r.data.discord_invite, null);
  }
});

test("serverSchema rejects bad fields", () => {
  const bad: Record<string, unknown>[] = [
    { name: "" },
    { name: "x".repeat(49) },
    { description: "x".repeat(201) },
    { play_styles: [] },
    { play_styles: ["nope"] },
    { edition: "xbox" },
    { discord_invite: "https://evil.com/x" },
    { address: "https://play.example.com" },
  ];
  for (const patch of bad) {
    assert.equal(serverSchema.safeParse({ ...valid, ...patch }).success, false, JSON.stringify(patch));
  }
});

test("serverSchema accepts a discord invite and drops unknown keys like status", () => {
  const r = serverSchema.safeParse({ ...valid, discord_invite: "https://discord.gg/abc-123", status: "approved" });
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.discord_invite, "https://discord.gg/abc-123");
    assert.equal("status" in r.data, false);
  }
});
