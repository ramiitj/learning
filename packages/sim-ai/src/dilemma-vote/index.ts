import type { ComponentPlugin } from "@lm/engine";
import { dilemmaVoteContract, type DilemmaVoteConfig } from "./contract";
import { messages } from "./messages";
import { DilemmaVote, DilemmaVoteClassroom, type DilemmaVoteState } from "./DilemmaVote";

export const dilemmaVote: ComponentPlugin<DilemmaVoteConfig & Record<string, unknown>, DilemmaVoteState> = {
  ...dilemmaVoteContract,
  personal: DilemmaVote,
  classroom: DilemmaVoteClassroom,
  messages,
  summarize: (state, config, t, ui) => {
    const option = config.options.find((o) => o.id === state?.choice);
    return state?.committed && option ? ui("summary", { option: t.text(option.labelKey) }) : null;
  },
};

export * from "./contract";
export * from "./DilemmaVote";
