import { deflateRawSync } from "node:zlib";

/**
 * A minimal zip writer (store or deflate, UTF-8 names, no zip64).
 *
 * Why not a library: the export needs only "write these files in order into a
 * stream", the format is stable and public, and every maintained zip package
 * adds a dependency (and its own transitive tree) to the one route that holds
 * the creator's whole data. node:zlib already supplies deflate. Archives that
 * would need zip64 (4 GB, 65,535 entries) are refused rather than corrupted.
 */
const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date) {
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const date = ((Math.max(d.getUTCFullYear(), 1980) - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { time, date };
}

interface Central {
  name: Buffer;
  crc: number;
  csize: number;
  size: number;
  offset: number;
  method: number;
  time: number;
  date: number;
}

export class ZipWriter {
  private offset = 0;
  private entries: Central[] = [];
  constructor(private readonly now = new Date()) {}

  /** Returns the bytes to emit for one file. */
  file(path: string, data: Uint8Array): Buffer {
    if (this.entries.length >= 65_535 || data.length >= 0xffffffff) throw new Error("zip64 is not supported");
    const name = Buffer.from(path, "utf8");
    const raw = Buffer.from(data);
    const deflated = raw.length > 64 ? deflateRawSync(raw) : raw;
    const method = deflated === raw ? 0 : 8;
    const { time, date } = dosDateTime(this.now);
    const crc = crc32(raw);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(0x0800, 6); // UTF-8 names
    h.writeUInt16LE(method, 8);
    h.writeUInt16LE(time, 10);
    h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(deflated.length, 18);
    h.writeUInt32LE(raw.length, 22);
    h.writeUInt16LE(name.length, 26);
    this.entries.push({ name, crc, csize: deflated.length, size: raw.length, offset: this.offset, method, time, date });
    const out = Buffer.concat([h, name, deflated]);
    this.offset += out.length;
    if (this.offset >= 0xffffffff) throw new Error("zip64 is not supported");
    return out;
  }

  /** The central directory and end record; call once, last. */
  finish(): Buffer {
    const parts: Buffer[] = [];
    let size = 0;
    for (const e of this.entries) {
      const c = Buffer.alloc(46);
      c.writeUInt32LE(0x02014b50, 0);
      c.writeUInt16LE(20, 4);
      c.writeUInt16LE(20, 6);
      c.writeUInt16LE(0x0800, 8);
      c.writeUInt16LE(e.method, 10);
      c.writeUInt16LE(e.time, 12);
      c.writeUInt16LE(e.date, 14);
      c.writeUInt32LE(e.crc, 16);
      c.writeUInt32LE(e.csize, 20);
      c.writeUInt32LE(e.size, 24);
      c.writeUInt16LE(e.name.length, 28);
      c.writeUInt32LE(e.offset, 42);
      parts.push(c, e.name);
      size += c.length + e.name.length;
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(size, 12);
    end.writeUInt32LE(this.offset, 16);
    return Buffer.concat([...parts, end]);
  }
}
