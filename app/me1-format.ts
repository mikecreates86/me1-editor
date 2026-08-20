import { ME1_BASE_TEMPLATE, ME1_CLEAN_INPUT_KEY } from "./me1-template";

export type MixValue = { level: number; pan: number; muted: boolean };
export type GroupMember = { source: number; level: number; pan: number };
export type Assignment =
  | ({ kind: "input"; source: number } & MixValue)
  | ({ kind: "group"; members: GroupMember[] } & MixValue)
  | ({ kind: "auto" | "aux" | "signal" | "unassigned" } & MixValue);
export type KeyName = { mode: "console" | "custom"; customName: string };
export type EditorPreset = {
  name: string;
  assignments: Assignment[];
  keyNames: KeyName[];
  sourceFile?: { name: string; bytes: Uint8Array; sourceKind: "preset" | "config" };
  original?: { assignments: Assignment[]; keyNames: KeyName[] };
  formatStatus: "template" | "decoded-me1";
};

const KEY_START = 7;
const KEY_SIZE = 205;
const LEVEL_OFFSET = 194;
const NAME_OFFSET = 197;
const LEVEL_OFF = 0x8001;
const AUDIBLE_LEVEL_POINTS = [[1, 0xce00], [25, 0xd862], [50, 0xe4b1], [75, 0xf2ec], [100, 0xff9f]] as const;
const AUDIBLE_STEPS = 129;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function interpolate(value: number, points: readonly (readonly [number, number])[], reverse = false) {
  const pairs = reverse ? points.map(([x, y]) => [y, x] as const) : points;
  const v = clamp(value, pairs[0][0], pairs[pairs.length - 1][0]);
  for (let i = 1; i < pairs.length; i++) {
    const [x1, y1] = pairs[i - 1]; const [x2, y2] = pairs[i];
    if (v <= x2) return y1 + ((v - x1) / (x2 - x1)) * (y2 - y1);
  }
  return pairs[pairs.length - 1][1];
}
const decodeLevel = (raw: number) => raw < AUDIBLE_LEVEL_POINTS[0][1] ? 0 : Math.round(interpolate(raw, AUDIBLE_LEVEL_POINTS, true));
const encodeLevel = (level: number) => {
  const value = clamp(Math.round(level), 0, 100);
  if (value === 0) return LEVEL_OFF;
  const exact = AUDIBLE_LEVEL_POINTS.find(([percent]) => percent === value);
  if (exact) return exact[1];
  const raw = interpolate(value, AUDIBLE_LEVEL_POINTS);
  const minimum = AUDIBLE_LEVEL_POINTS[0][1];
  const maximum = AUDIBLE_LEVEL_POINTS[AUDIBLE_LEVEL_POINTS.length - 1][1];
  const step = Math.round(((raw - minimum) * AUDIBLE_STEPS) / (maximum - minimum));
  return Math.round(minimum + (step * (maximum - minimum)) / AUDIBLE_STEPS);
};
const decodePan = (raw: number) => clamp(Math.round(((raw - 37) / 37) * 100), -100, 100);
const encodePan = (pan: number) => clamp(Math.round(37 + (pan / 100) * 37), 0, 74);
const read16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const write16 = (b: Uint8Array, o: number, n: number) => { b[o] = (n >> 8) & 255; b[o + 1] = n & 255; };

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const decodeTemplate = () => {
  const bytes = decodeBase64(ME1_BASE_TEMPLATE);
  const cleanKey = decodeBase64(ME1_CLEAN_INPUT_KEY);
  for (let key = 0; key < 16; key++) bytes.set(cleanKey, KEY_START + key * KEY_SIZE);
  return bytes;
};

export const blankPreset = (): EditorPreset => {
  const preset = parseME1("NEWMIX.ME1", decodeTemplate());
  return {
    ...preset,
    name: "NEWMIX",
    assignments: Array.from({ length: 16 }, (_, i) => ({ kind: "input" as const, source: i + 1, level: 50, pan: 0, muted: false })),
    keyNames: Array.from({ length: 16 }, () => ({ mode: "console" as const, customName: "" })),
    formatStatus: "template",
  };
};

export function parseME1(fileName: string, bytes: Uint8Array): EditorPreset {
  if (bytes.byteLength !== 4096 && bytes.byteLength !== 73728) throw new Error("ME-1 files must be exactly 4 KB (preset) or 72 KB (configuration).");
  const sourceKind = bytes.byteLength === 4096 ? "preset" : "config";
  const data = bytes.slice(0, 4096);
  const assignments: Assignment[] = [];
  const keyNames: KeyName[] = [];
  for (let key = 0; key < 16; key++) {
    const start = KEY_START + key * KEY_SIZE;
    const flags = data[start]; const source = data[start + 1];
    const mix = { level: decodeLevel(read16(data, start + LEVEL_OFFSET)), pan: decodePan(data[start + LEVEL_OFFSET + 2]), muted: Boolean(flags & 0x08) };
    let assignment: Assignment;
    if (flags & 0x40) assignment = { kind: "auto", ...mix };
    else if (flags & 0x20) {
      const members: GroupMember[] = [];
      for (let input = 0; input < 40; input++) {
        const member = start + 2 + input * 4;
        if (data[member] & 0x04) members.push({ source: input + 1, level: decodeLevel(read16(data, member + 1)), pan: decodePan(data[member + 3]) });
      }
      assignment = { kind: "group", members, ...mix };
    } else if (source === 0xff) assignment = { kind: "unassigned", ...mix };
    else if (source === 40) assignment = { kind: "aux", ...mix };
    else if (source > 39) assignment = { kind: "signal", ...mix };
    else assignment = { kind: "input", source: source + 1, ...mix };
    assignments.push(assignment);
    const customName = new TextDecoder().decode(data.slice(start + NAME_OFFSET, start + NAME_OFFSET + 6)).replace(/\0/g, "").trimEnd();
    keyNames.push({ mode: flags & 0x10 ? "custom" : "console", customName });
  }
  const cloneAssignments = JSON.parse(JSON.stringify(assignments)) as Assignment[];
  const cloneNames = JSON.parse(JSON.stringify(keyNames)) as KeyName[];
  return { name: fileName.replace(/\.me1$/i, "").slice(0, 8).toUpperCase(), assignments, keyNames, sourceFile: { name: fileName, bytes: data, sourceKind }, original: { assignments: cloneAssignments, keyNames: cloneNames }, formatStatus: "decoded-me1" };
}

export function writeME1(preset: EditorPreset): Uint8Array {
  if (!preset.sourceFile) throw new Error("No ME-1 template is available for this preset.");
  const data = preset.sourceFile.bytes.slice();
  for (let key = 0; key < 16; key++) {
    const start = KEY_START + key * KEY_SIZE; const assignment = preset.assignments[key]; const name = preset.keyNames[key]; const original = preset.original?.assignments[key]; const originalName = preset.original?.keyNames[key];
    let flags = data[start];
    if (!original || assignment.kind !== original.kind || (assignment.kind === "input" && original.kind === "input" && assignment.source !== original.source)) {
      flags &= ~0x61;
      if (assignment.kind === "group") flags |= 0x20;
      if (assignment.kind === "auto") flags |= 0x40;
      if (assignment.kind === "aux") flags |= 0x01;
      data[start + 1] = assignment.kind === "input" ? assignment.source - 1 : assignment.kind === "group" || assignment.kind === "unassigned" ? 0xff : assignment.kind === "aux" ? 40 : assignment.kind === "signal" ? 47 : 0;
    }
    if (!original || assignment.muted !== original.muted) flags = assignment.muted ? flags | 0x08 : flags & ~0x08;
    if (!originalName || name.mode !== originalName.mode) flags = name.mode === "custom" ? flags | 0x10 : flags & ~0x10;
    data[start] = flags;
    for (let input = 0; input < 40; input++) {
      const offset = start + 2 + input * 4; const member = assignment.kind === "group" ? assignment.members.find((m) => m.source === input + 1) : undefined; const oldMember = original?.kind === "group" ? original.members.find((m) => m.source === input + 1) : undefined;
      const startingFreshGroup = assignment.kind === "group" && original?.kind !== "group";
      if (startingFreshGroup || Boolean(member) !== Boolean(oldMember)) data[offset] = member ? data[offset] | 0x04 : data[offset] & ~0x04;
      if (member && (!oldMember || member.level !== oldMember.level)) write16(data, offset + 1, encodeLevel(member.level));
      if (member && (!oldMember || member.pan !== oldMember.pan)) data[offset + 3] = encodePan(member.pan);
    }
    if (!original || assignment.level !== original.level) write16(data, start + LEVEL_OFFSET, encodeLevel(assignment.level));
    if (!original || assignment.pan !== original.pan) data[start + LEVEL_OFFSET + 2] = encodePan(assignment.pan);
    if (!originalName || name.customName !== originalName.customName) { const chars = name.customName.padEnd(6, " ").slice(0, 6); for (let i = 0; i < 6; i++) data[start + NAME_OFFSET + i] = chars.charCodeAt(i); data[start + NAME_OFFSET + 6] = 0; }
  }
  return data;
}

export function exportEditorDraft(preset: EditorPreset): Blob {
  return new Blob([JSON.stringify({ schema: "me1-editor-draft/v2", name: preset.name, assignments: preset.assignments, keyNames: preset.keyNames }, null, 2)], { type: "application/json" });
}
