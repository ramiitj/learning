import { blankGrid, blur, cellCount, clampShade, clampSize, countChanged, fitGrid, inkCount, setCell, shift, toggleCell } from "./model";

describe("pixel-grid model", () => {
  it("clamps size to 8..16 and shades to 0..9", () => {
    expect(clampSize(undefined)).toBe(8);
    expect(clampSize(3)).toBe(8);
    expect(clampSize(40)).toBe(16);
    expect(clampShade(12)).toBe(9);
    expect(clampShade(-2)).toBe(0);
    expect(clampShade("x")).toBe(0);
  });

  it("fits a smaller preset in the centre and clamps odd values", () => {
    const g = fitGrid([[9, 20], [-1, 5]], 8);
    expect(g).toHaveLength(8);
    expect(g[3]![3]).toBe(9);
    expect(g[3]![4]).toBe(9);
    expect(g[4]![3]).toBe(0);
    expect(g[4]![4]).toBe(5);
    expect(fitGrid(undefined, 8)).toEqual(blankGrid(8));
  });

  it("setCell and toggleCell do not mutate and ignore out-of-range squares", () => {
    const g = blankGrid(8);
    const a = toggleCell(g, 1, 2);
    expect(g[1]![2]).toBe(0);
    expect(a[1]![2]).toBe(9);
    expect(toggleCell(a, 1, 2)[1]![2]).toBe(0);
    expect(setCell(g, 99, 0, 9)).toBe(g);
    expect(setCell(a, 1, 2, 9)).toBe(a);
  });

  it("blurs with a 3x3 average", () => {
    const g = blankGrid(8);
    g[4]![4] = 9;
    const b = blur(g);
    expect(b[4]![4]).toBe(1); // 9/9
    expect(b[3]![3]).toBe(1);
    expect(b[2]![2]).toBe(0);
    const flat = fitGrid(Array.from({ length: 8 }, () => Array(8).fill(6)), 8);
    expect(blur(flat)).toEqual(flat);
  });

  it("shifts by one square in each direction and loses what falls off", () => {
    const g = blankGrid(8);
    g[0]![0] = 9;
    expect(shift(g, "right")[0]![1]).toBe(9);
    expect(shift(g, "down")[1]![0]).toBe(9);
    expect(inkCount(shift(g, "left"))).toBe(0);
    expect(inkCount(shift(g, "up"))).toBe(0);
    expect(shift(g, "right")[0]![0]).toBe(0);
  });

  it("counts changed squares: a shifted stroke changes many numbers", () => {
    const g = blankGrid(8);
    for (let r = 1; r < 7; r++) g[r]![3] = 9;
    const s = shift(g, "right");
    expect(countChanged(g, s)).toBe(12);
    expect(countChanged(g, g)).toBe(0);
    expect(cellCount(g)).toBe(64);
  });
});
