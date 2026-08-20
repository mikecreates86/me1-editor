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
fixtures and add focused round-trip tests before relying on the current stale
starter test.
