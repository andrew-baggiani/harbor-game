// The week remembers: src/content/week/world.ts. Run with npm test.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as W from "./world.ts";

const skip = false;

test("a clean Monday leaves a clean week", { skip }, () => {
  let w = W.applyChoice(W.EMPTY_WORLD, "usb-it", "r1", 1);
  w = W.applyChoice(w, "mail-report", "r1", 2);
  for (const d of ["tuesday", "wednesday", "thursday", "friday"]) assert.equal(W.stageFor(w, d), "clean");
  assert.equal(W.changedSince(w, "tuesday"), null);
});

test("an unreported slip shows signs midweek and goes off on Friday", { skip }, () => {
  const w = W.applyChoice(W.EMPTY_WORLD, "usb-plug", "r1", 1);
  assert.equal(W.stageFor(w, "tuesday"), "planted");
  assert.equal(W.stageFor(w, "thursday"), "planted");
  assert.equal(W.stageFor(w, "friday"), "breach");
  assert.equal(W.stageFor(w, "saturday"), "clean");
  assert.ok(W.changedSince(w, "wednesday")!.lines.some((l) => l.includes("svc_backup2")));
});

test("calling it in before Friday contains it; on Friday it's too late for Friday", { skip }, () => {
  const w = W.applyChoice(W.EMPTY_WORLD, "phone-code", "r1", 1);
  const early = W.applyReport(w, "tuesday", "hotline", 5);
  assert.equal(W.stageFor(early, "friday"), "contained");
  const late = W.applyReport(w, "friday", "card", 5);
  assert.equal(W.stageFor(late, "friday"), "breach");
  assert.equal(late.calls.length, 1);
});

test("a new Monday run starts a new week", { skip }, () => {
  let w = W.applyChoice(W.EMPTY_WORLD, "signin-yes", "r1", 1);
  w = W.applyReport(w, "tuesday", "hotline", 2);
  w = W.applyChoice(w, "door-shut", "r2", 3);
  assert.equal(W.planted(w), false);
  assert.equal(w.reported, null);
  assert.equal(W.stageFor(w, "friday"), "clean");
});

test("only Monday choices move the world; calls with nothing planted are check-ins", { skip }, () => {
  const w = W.applyChoice(W.EMPTY_WORLD, "fri-hour-pay", "r1", 1);
  assert.equal(w, W.EMPTY_WORLD);
  const c = W.applyReport(W.EMPTY_WORLD, "wednesday", "hotline", 1);
  assert.equal(c.reported, null);
  assert.equal(c.calls[0].planted, false);
});
