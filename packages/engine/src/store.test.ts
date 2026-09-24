import { LessonStore, type StorageLike } from "./store";

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe("LessonStore", () => {
  it("shares state between blocks and undoes the last change anywhere", () => {
    const s = new LessonStore("k", { storage: memory() });
    s.setBlock("b1", { items: ["a"] });
    s.setBlock("b2", 5);
    expect(s.getBlock("b1")).toEqual({ items: ["a"] });
    expect(s.undo()).toBe("b2");
    expect(s.getBlock("b2")).toBeUndefined();
    expect(s.undo()).toBe("b1");
    expect(s.canUndo()).toBe(false);
  });

  it("coalesces rapid changes to one block into one undo step", () => {
    const s = new LessonStore("k", { storage: memory() });
    s.setBlock("knob", 1, { coalesce: true });
    s.setBlock("knob", 2, { coalesce: true });
    s.setBlock("knob", 3, { coalesce: true });
    s.undo();
    expect(s.getBlock("knob")).toBeUndefined();
  });

  it("makes reset undoable", () => {
    const s = new LessonStore("k", { storage: memory() });
    s.setBlock("b1", "made something");
    s.resetBlock("b1");
    expect(s.getBlock("b1")).toBeUndefined();
    s.undo();
    expect(s.getBlock("b1")).toBe("made something");
  });

  it("remembers progress on the device and survives a reload", () => {
    const storage = memory();
    const a = new LessonStore("lesson:x", { storage });
    a.setBlock("b1", 42);
    a.setDepth("deeper");
    const b = new LessonStore("lesson:x", { storage });
    expect(b.getBlock("b1")).toBe(42);
    expect(b.getState().depth).toBe("deeper");
  });

  it("keeps working when storage is unavailable or corrupt", () => {
    const broken: StorageLike = { getItem: () => "{not json", setItem: () => { throw new Error("full"); }, removeItem: () => {} };
    const s = new LessonStore("k", { storage: broken });
    s.setBlock("b1", 1);
    expect(s.getBlock("b1")).toBe(1);
  });

  it("resetAll clears work but keeps settings", () => {
    const s = new LessonStore("k", { storage: memory() });
    s.setDepth("deepest");
    s.markHowToSeen("sort");
    s.setBlock("b1", 1);
    s.resetAll();
    expect(s.getState().blocks).toEqual({});
    expect(s.getState().depth).toBe("deepest");
    expect(s.getState().seenHowTo).toEqual(["sort"]);
    expect(s.canUndo()).toBe(false);
  });
});
