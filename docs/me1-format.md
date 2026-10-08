# ME-1 format notes

This is the wire-format reference for [`app/me1-format.ts`](../app/me1-format.ts).
The embedded template in [`app/me1-template.ts`](../app/me1-template.ts) and
the files under [`Configs/`](../Configs/) are authoritative bytes; this note is
not a replacement for them.

## File and key layout

- A preset is exactly 4096 bytes. A configuration is exactly 73728 bytes; the
  editor reads and writes only its first 4096 bytes.
- The file has 16 key records. `KEY_START = 7`, `KEY_SIZE = 205`.
- In each record, byte 0 is the flags byte and byte 1 is the source code.
- Group members use 40 four-byte entries beginning at record offset 2. A
  member is present when its entry flags include `0x04`; its level is a
  big-endian 16-bit value at entry offset +1 and pan is at entry offset +3.
- Key level is a big-endian 16-bit value at record offset 194. Key pan is at
  offset 196. The six-character custom name begins at offset 197.

## Configuration layout (72 KB)

- Block 0 (`0..4095`) is Preset 1, the current mix, in the 4 KB preset format.
- Block 1 (`4096..8191`) is the directory: byte 0 is `0x01`, bytes 1..8 are
  the configuration/Preset 1 name, then 15 ten-byte entries starting at byte 9
  (`0x02`, a flag byte, and an 8-byte space-padded name) for Presets 2..16.
- Blocks 2..16 hold Presets 2..16. A slot whose whole block is `0xff` is empty.
  The final 4 KB block is not interpreted and is preserved.
- Directory names may contain spaces or be blank. The writer rewrites a name
  only when the edited name differs from the decoded one, so unchanged names
  survive byte-for-byte.
- Open question: directory byte `10 + 10*i` (just before each slot name) is
  `0x01` for exactly the occupied slots in `ME.ME1` and `OFFICIAL.ME1`, but
  `EMMAUS.ME1` has occupied slots with `0x00`. The writer leaves it untouched
  for imported files and sets `0x01` for every slot, empty or not, in new
  configurations. Whether the ME-1 reads it is unverified on hardware.

## Assignment and name flags

- `0x08`: key muted.
- `0x10`: custom key name enabled; otherwise the console/source name is used.
- `0x20`: group assignment.
- `0x40`: auto assignment.
- For assignment changes, the writer clears `0x61` and then sets the kind-specific
  bits. Source codes are zero-based inputs (`0..39`), `40` for AUX, values above
  `39` for signal generator, and `0xff` for unassigned/group.

## Encoding decisions

- The UI level range is 0..130: 0 is fully off and 1..130 are the 130 audible
  ME-1 positions. Hardware calibration `1TO16.ME1` establishes `0x8001` as
  off, `0xce00` as first audible, `0xf662` as nominal 0 dB, and `0xff9f` as
  maximum (+10 dB). It also establishes `0xf4da` and `0xf727` as the encoder
  positions immediately below and above nominal. The writer uses these exact
  anchors and device-step interpolation between them; imported unchanged bytes
  are still preserved verbatim.
- Pan maps the UI range `-100..100` to the device range `0..74` using center 37.
- On import, the original first-4096-byte buffer is retained. On export, only
  changed fields are rewritten so unknown bytes survive round-trips.

## Change/verification rule

Any format change must preserve 4096-byte output, 16 keys, 40 sources, and
unknown-byte preservation. Validate against both preset and configuration
fixtures and extend [`tests/me1-format.test.mjs`](../tests/me1-format.test.mjs),
which runs the real format module against the `Configs/` fixtures.
