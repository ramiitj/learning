import type { ComponentPlugin } from "@lm/engine";
import { sortContract, type SortConfig } from "./contract";
import { messages } from "./messages";
import { Sort, SortClassroom, type SortState } from "./Sort";

export const sort: ComponentPlugin<SortConfig & Record<string, unknown>, SortState> = {
  ...sortContract,
  personal: Sort,
  classroom: SortClassroom,
  messages,
  summarize: (state, config, t, ui) => {
    const items = config.items;
    const placed = state?.placed;
    if (!items || !placed) return null;
    const n = Object.keys(placed).length;
    if (n === 0) return null;
    const counts = config.groups.map((g) => `${t.text(g)}: ${items.filter((i) => placed[i.id] === g).length}`).join(", ");
    return ui("summary", { n, counts });
  },
};

export type { SortConfig, SortItem } from "./contract";
export type { SortState } from "./Sort";
