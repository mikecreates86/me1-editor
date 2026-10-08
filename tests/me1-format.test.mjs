import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { runnerImport } from "vite";

// Load the real TypeScript format module through Vite so these tests exercise shipped code.
const { module: me1 } = await runnerImport(new URL("../app/me1-format.ts", import.meta.url).pathname);
const { PRESET_SIZE, CONFIG_SIZE, LEVEL_MAX, LEVEL_NOMINAL } = me1;

const fixture = async (path) => new Uint8Array(await readFile(new URL(`../Configs/${path}`, import.meta.url)));
const presetDir = new URL("../Configs/Emmaus/ME1PST/", import.meta.url);
const presetNames = (await readdir(presetDir)).filter((name) => /\.ME1$/i.test(name)).sort();
const configPaths = ["ME1CFG/ME.ME1", "Emmaus/ME1CFG/EMMAUS.ME1", "Reference/OFFICIAL.ME1"];

const KEY_START = 7;
const KEY_SIZE = 205;
const keyRange = (key) => [KEY_START + key * KEY_SIZE, KEY_START + (key + 1) * KEY_SIZE];
const changedOffsets = (before, after) => {
  const offsets = [];
  for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) offsets.push(i);
  return offsets;
};
const loadPreset = async (name) => me1.parseME1(name, await fixture(`Emmaus/ME1PST/${name}`));
const roundTrip = (preset) => me1.parseME1("ROUNDTRIP.ME1", me1.writeME1(preset));
const withKey = (preset, key, assignment) => ({ ...preset, assignments: preset.assignments.map((item, index) => (index === key ? assignment : item)) });

test("fixtures have the documented sizes", async () => {
  assert.equal(presetNames.length, 34);
  for (const name of presetNames) assert.equal((await fixture(`Emmaus/ME1PST/${name}`)).byteLength, PRESET_SIZE, name);
  for (const path of configPaths) assert.equal((await fixture(path)).byteLength, CONFIG_SIZE, path);
});

test("every preset fixture exports byte-identical when unchanged", async () => {
  for (const name of presetNames) {
    const bytes = await fixture(`Emmaus/ME1PST/${name}`);
    const output = me1.writeME1(me1.parseME1(name, bytes));
    assert.equal(output.byteLength, PRESET_SIZE, name);
    assert.deepEqual(changedOffsets(bytes, output), [], name);
  }
});

test("every configuration fixture exports byte-identical when unchanged", async () => {
  for (const path of configPaths) {
    const bytes = await fixture(path);
    const output = me1.writeConfiguration(me1.parseConfiguration(path.split("/").pop(), bytes));
    assert.equal(output.byteLength, CONFIG_SIZE, path);
    assert.deepEqual(changedOffsets(bytes, output), [], path);
  }
});

test("calibration fixtures decode to the values their captures describe", async () => {
  const key = async (name, index) => (await loadPreset(name)).assignments[index];
  assert.equal((await key("K1AUTO.ME1", 0)).kind, "auto");
  assert.equal((await key("K1AUX.ME1", 0)).kind, "aux");
  assert.equal((await key("K1SYN.ME1", 0)).kind, "signal");
  assert.equal((await key("K1UN.ME1", 0)).kind, "unassigned");
  assert.deepEqual(await key("K1IN1.ME1", 0), { kind: "input", source: 1, level: 0, pan: 0, muted: false });
  assert.equal((await key("K1IN40.ME1", 0)).source, 40);
  assert.equal((await key("K1MAX.ME1", 0)).level, LEVEL_MAX);
  assert.equal((await key("K1MIN.ME1", 0)).level, 0);
  assert.equal((await key("K2MAX.ME1", 1)).level, LEVEL_MAX);
  assert.equal((await key("K2MIN.ME1", 1)).level, 0);
  assert.equal((await key("K2PANL.ME1", 1)).pan, -100);
  assert.equal((await key("K2PANR.ME1", 1)).pan, 100);
  assert.equal((await key("K2PC.ME1", 1)).pan, 0);
  assert.equal((await key("K2MUT.ME1", 1)).muted, true);
  assert.equal((await key("K3MUTE.ME1", 2)).muted, true);
  assert.equal((await key("K1GRPMUT.ME1", 0)).muted, true);
  assert.deepEqual((await key("K1GRP2.ME1", 0)).members.map((member) => member.source), [1, 2]);
  const levels = (await key("K1GRPLEV.ME1", 0)).members;
  assert.deepEqual(levels.map(({ level, pan }) => [level, pan]), [[129, -100], [2, 100]]);
  assert.deepEqual((await loadPreset("K2NAME.ME1")).keyNames[1], { mode: "custom", customName: "Abc123" });
});

test("level and pan encodings round-trip across the full UI range", async () => {
  const base = await loadPreset("K1IN1.ME1");
  for (let level = 0; level <= LEVEL_MAX; level++) {
    const output = roundTrip(withKey(base, 0, { ...base.assignments[0], level }));
    assert.equal(output.assignments[0].level, level, `level ${level}`);
  }
  for (const pan of [-100, -50, 0, 50, 100]) {
    const output = roundTrip(withKey(base, 0, { ...base.assignments[0], pan }));
    assert.ok(Math.abs(output.assignments[0].pan - pan) <= 2, `pan ${pan} -> ${output.assignments[0].pan}`);
  }
});

test("editing one key rewrites only that key's record", async () => {
  const bytes = await fixture("Emmaus/ME1PST/START.ME1");
  const preset = me1.parseME1("START.ME1", bytes);
  const edited = withKey(preset, 4, { kind: "input", source: 23, level: LEVEL_NOMINAL, pan: -100, muted: true });
  edited.keyNames = preset.keyNames.map((name, index) => (index === 4 ? { mode: "custom", customName: "VOX" } : name));
  const output = me1.writeME1(edited);
  const [start, end] = keyRange(4);
  const offsets = changedOffsets(bytes, output);
  assert.ok(offsets.length > 0);
  assert.ok(offsets.every((offset) => offset >= start && offset < end), `changed outside key 5: ${offsets}`);
  const reparsed = me1.parseME1("OUT.ME1", output);
  assert.deepEqual(reparsed.assignments[4], edited.assignments[4]);
  assert.deepEqual(reparsed.keyNames[4], { mode: "custom", customName: "VOX" });
});

test("every assignment kind and group membership survives export", async () => {
  const preset = await loadPreset("START.ME1");
  const mix = { level: 90, pan: 0, muted: false };
  const kinds = [
    { kind: "input", source: 7, ...mix },
    { kind: "auto", ...mix },
    { kind: "aux", ...mix },
    { kind: "signal", ...mix },
    { kind: "unassigned", ...mix },
    { kind: "group", members: [{ source: 3, level: 50, pan: -100 }, { source: 40, level: LEVEL_MAX, pan: 100 }], ...mix },
  ];
  for (const assignment of kinds) {
    for (const key of [0, 1, 15]) {
      const output = roundTrip(withKey(preset, key, assignment));
      assert.deepEqual(output.assignments[key], assignment, `${assignment.kind} on key ${key + 1}`);
    }
  }
  const group = preset.assignments.findIndex((assignment) => assignment.kind === "group");
  const removed = roundTrip(withKey(preset, group, { ...preset.assignments[group], members: preset.assignments[group].members.slice(1) }));
  assert.deepEqual(removed.assignments[group].members, preset.assignments[group].members.slice(1));
});

test("a new preset exports 4 KB of the expected default mix", () => {
  const preset = me1.blankPreset();
  const output = me1.writeME1(preset);
  assert.equal(output.byteLength, PRESET_SIZE);
  const reparsed = me1.parseME1("NEWMIX.ME1", output);
  reparsed.assignments.forEach((assignment, index) => assert.deepEqual(assignment, { kind: "input", source: index + 1, level: LEVEL_NOMINAL, pan: 0, muted: false }));
  reparsed.keyNames.forEach((name) => assert.equal(name.mode, "console"));
});

test("a new configuration exports 72 KB with Preset 1 and empty Presets 2-16", () => {
  const configuration = me1.blankConfiguration();
  const output = me1.writeConfiguration(configuration);
  assert.equal(output.byteLength, CONFIG_SIZE);
  const reparsed = me1.parseConfiguration("NEWCONF.ME1", output);
  assert.equal(reparsed.name, "PRESET1");
  assert.deepEqual(reparsed.slots, Array.from({ length: 15 }, () => null));
  assert.deepEqual(reparsed.slotNames, Array.from({ length: 15 }, (_, index) => `P${index + 2}`));
  assert.ok(output.subarray(PRESET_SIZE * 2).every((byte) => byte === 0xff));
});

test("configuration edits change only the edited preset and its directory name", async () => {
  const bytes = await fixture("Emmaus/ME1CFG/EMMAUS.ME1");
  const configuration = me1.parseConfiguration("EMMAUS.ME1", bytes);
  const slotIndex = configuration.slots.findIndex((slot) => slot === null);
  const built = { ...me1.blankPreset(), name: "BAND" };
  const third = configuration.slots[1];
  const renamed = { ...third, assignments: third.assignments.map((assignment, key) => (key === 0 ? { ...assignment, muted: !assignment.muted } : assignment)) };
  const next = { ...configuration, slots: configuration.slots.map((slot, index) => (index === slotIndex ? built : index === 1 ? renamed : slot)) };
  const output = me1.writeConfiguration(next);
  const allowed = [
    [PRESET_SIZE + 11 + slotIndex * 10, PRESET_SIZE + 19 + slotIndex * 10],
    [PRESET_SIZE * 2 + slotIndex * PRESET_SIZE, PRESET_SIZE * 3 + slotIndex * PRESET_SIZE],
    [PRESET_SIZE * 3, PRESET_SIZE * 4],
  ];
  const offsets = changedOffsets(bytes, output);
  assert.ok(offsets.every((offset) => allowed.some(([start, end]) => offset >= start && offset < end)), `unexpected changes: ${offsets.slice(0, 10)}`);
  const reparsed = me1.parseConfiguration("EMMAUS.ME1", output);
  assert.equal(reparsed.slotNames[slotIndex], "BAND");
  assert.equal(reparsed.slotNames[1], "ALEX PRZ", "an unchanged name with a space is preserved");
  assert.equal(reparsed.slots[1].assignments[0].muted, renamed.assignments[0].muted);
  assert.deepEqual(reparsed.slots[slotIndex].assignments, built.assignments);
});

test("imports reject files that are not exactly 4 KB or 72 KB", () => {
  for (const size of [0, PRESET_SIZE - 1, PRESET_SIZE + 1, CONFIG_SIZE + 1]) {
    assert.throws(() => me1.parseME1("BAD.ME1", new Uint8Array(size)), /exactly 4 KB/);
  }
  assert.throws(() => me1.parseConfiguration("BAD.ME1", new Uint8Array(PRESET_SIZE)), /exactly 72 KB/);
});
