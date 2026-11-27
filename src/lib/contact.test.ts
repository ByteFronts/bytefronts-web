import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContactEmail, contactSchema, MESSAGE_MAX } from "./contact.ts";

const valid = { name: " Sam ", email: " sam@example.com ", topic: "partnership", subject: "Hi", message: "Hello there" };

test("valid contact input is trimmed", () => {
  const r = contactSchema.parse(valid);
  assert.equal(r.name, "Sam");
  assert.equal(r.email, "sam@example.com");
});

test("rejects bad email, unknown topic, blank and too-long text", () => {
  assert.equal(contactSchema.safeParse({ ...valid, email: "nope" }).success, false);
  assert.equal(contactSchema.safeParse({ ...valid, topic: "spam" }).success, false);
  assert.equal(contactSchema.safeParse({ ...valid, message: "   " }).success, false);
  assert.equal(contactSchema.safeParse({ ...valid, message: "x".repeat(MESSAGE_MAX + 1) }).success, false);
});

test("email subject carries the topic label and no line breaks", () => {
  const { subject, text } = buildContactEmail(contactSchema.parse({ ...valid, subject: "Hi\r\nBcc: x@y.z" }));
  assert.equal(subject, "[Partnership] Hi Bcc: x@y.z");
  assert.match(text, /^From: Sam <sam@example.com>\nTopic: Partnership\n\nHello there$/);
});
