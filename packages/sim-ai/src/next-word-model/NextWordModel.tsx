"use client";
import { useId, useMemo, useState } from "react";
import { Button, ChoiceGroup, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import { seededShuffle } from "@lm/primitives/shared/strings";
import { GlossaryRow } from "../glossary";
import type { NextWordModelConfig } from "./contract";
import { MAX_WORDS, buildModel, cleanSentence, followers, generate, isPunctuation, joinTokens, likelyName, percent, splitSentences, startableWords, topCandidates } from "./model";

export interface NextWordModelState {
  /** Sentences typed in this block (the learner's, or the class's through the teacher). */
  own?: string[];
  /** The word whose counts are on screen. */
  word?: string;
  /** The word whose model pick has been revealed. */
  shown?: string;
  /** Start word for the generated sentence. */
  writeFrom?: string;
  /** Personal: the candidate the learner committed to before looking, per current word. */
  guesses?: Record<string, string>;
  /** Classroom: show-of-hands counts per word, and whether the tally is on screen. */
  votes?: Record<string, Counts>;
  tallyShown?: boolean;
  /** For the one-line summary: what the model knew when the learner last used it. */
  stats?: { s: number; v: number };
}

type Props = BlockProps<NextWordModelConfig & Record<string, unknown>, NextWordModelState>;
const DEFAULT_MAX = 10;

/** Where the sentences come from: the earlier your-data block, else the lesson's starter sentences, then whatever was typed here. */
function baseSentences(config: NextWordModelConfig, props: Pick<Props, "readBlock" | "t">): string[] {
  let out: string[] = [];
  if (config.fromBlock) {
    const d = props.readBlock<{ items?: unknown; text?: unknown }>(config.fromBlock);
    if (Array.isArray(d?.items)) out = d.items.filter((x): x is string => typeof x === "string");
    else if (typeof d?.text === "string") out = splitSentences(d.text);
  }
  if (!out.length && config.starterSentencesKey && props.t.has(config.starterSentencesKey)) out = props.t.text(config.starterSentencesKey).split("|");
  return out.map((s) => cleanSentence(s)).filter(Boolean);
}

export function NextWordModel(props: Props) {
  return <Sim {...props} classroom={false} />;
}
export function NextWordModelClassroom(props: Props) {
  return <Sim {...props} classroom />;
}

function Sim(props: Props & { classroom: boolean }) {
  const { config, state, setState, t, ui, classroom, block } = props;
  const max = config.maxSentences ?? DEFAULT_MAX;
  const own = state?.own ?? [];
  const base = baseSentences(config, props).slice(0, max);
  const all = [...base, ...own].slice(0, max);
  const allKey = all.join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- allKey stands for the contents of `all`
  const model = useMemo(() => buildModel(all), [allKey]);
  const words = useMemo(() => startableWords(model), [model]);
  const current = state?.word && words.includes(state.word) ? state.word : (words[0] ?? "");
  const rows = current ? followers(model, current) : [];
  const top = rows[0];
  const revealed = !!current && state?.shown === current;
  // The candidates are shuffled with a fixed seed so their order never hints at which one the model picks.
  const candidates = useMemo(() => seededShuffle(current ? topCandidates(model, current, 3) : [], `${block.id}:${current}`), [model, current, block.id]);
  const guess = state?.guesses?.[current];
  const guessed = guess && candidates.some((c) => c.word === guess) ? guess : undefined;
  const written = state?.writeFrom && model.vocabulary.has(state.writeFrom) ? generate(model, state.writeFrom) : null;

  const inputId = useId();
  const selectId = useId();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const focus = useFocusAfter<HTMLDivElement>(state?.writeFrom);
  const stats = { s: model.sentences, v: model.vocabulary.size };
  const name = classroom ? likelyName(draft) : null;

  const add = () => {
    const value = cleanSentence(draft);
    if (!value) return setHint(ui("emptyHint"));
    if (all.some((s) => s.toLocaleLowerCase() === value.toLocaleLowerCase())) return setHint(ui("duplicateHint"));
    if (all.length >= max) return setHint(ui("maxHint", { max }));
    setHint("");
    setDraft("");
    setState((prev) => ({ ...prev, own: [...(prev?.own ?? []), value] }));
  };

  return (
    <div className={`lm-nextword${classroom ? " lm-nextword--class" : ""}`}>
      {classroom ? <h3 className="lm-prompt">{t.rich(config.promptKey)}</h3> : <p className="lm-lead">{t.rich(config.promptKey)}</p>}
      <p className="lm-muted lm-small">{ui(classroom ? "classroomPrivacy" : "privacyNote")}</p>
      <p className="lm-muted lm-small">{ui("glossModel")}</p>
      <GlossaryRow ids={config.glossary} ui={ui} />
      {classroom ? <p className="lm-notice" role="note">{ui("classroomNote")}</p> : null}

      <div className="lm-row">
        <label className="lm-nextword__label" htmlFor={inputId}>{ui(classroom ? "inputLabelClass" : "inputLabel")}</label>
        <input id={inputId} type="text" className="lm-nextword__input" value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button variant="primary" onClick={add}>{ui("addLabel")}</Button>
      </div>
      <p className="lm-muted lm-small" role="status" aria-live="polite">{hint}</p>
      {name ? <p className="lm-notice" role="note">{ui("nameWarning", { word: name })}</p> : null}

      {all.length ? (
        <details className="lm-nextword__sentences" open>
          <summary>{ui("sentencesTitle")} ({all.length})</summary>
          <ul className="lm-nextword__list">
            {all.map((s, i) => (
              <li key={`${i}:${s}`}>
                <span>{s}</span>
                {i >= base.length ? <Button variant="quiet" aria-label={ui("remove", { item: s })} onClick={() => setState((p) => ({ ...p, own: (p?.own ?? []).filter((_, j) => j !== i - base.length) }))}>×</Button> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="lm-notice" role="note">{ui("noSentences")}</p>
      )}

      {model.sentences ? <p className="lm-nextword__stats">{ui("stats", { s: stats.s, v: stats.v })}</p> : null}
      {state?.stats ? <p className="lm-callout" data-tone="warm">{ui("noIntention")}</p> : null}

      {words.length ? (
        <div className="lm-stack">
          <div className="lm-row">
            <label className="lm-nextword__label" htmlFor={selectId}>{ui("pickLabel")}</label>
            <select id={selectId} className="lm-nextword__select" value={current} onChange={(e) => setState((p) => ({ ...p, word: e.target.value, shown: undefined, tallyShown: false }))}>
              {words.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {classroom && !revealed ? <p className="lm-lead">{ui("guessFirst", { word: current })}</p> : null}

          {!classroom && !revealed ? (
            <ChoiceGroup
              legend={ui("guessFirst", { word: current })}
              name={`${block.id}-guess-${current}`}
              choices={candidates.map((c) => ({ id: c.word, label: c.word }))}
              value={guessed}
              onChange={(word) => setState((p) => ({ ...p, guesses: { ...p?.guesses, [current]: word } }))}
            />
          ) : null}

          {classroom && !revealed ? (
            <Tally
              ui={ui}
              options={candidates.map((f) => ({ id: f.word, label: f.word, text: f.word }))}
              counts={state?.votes?.[current] ?? {}}
              onChange={(counts) => setState((p) => ({ ...p, votes: { ...p?.votes, [current]: counts } }), { coalesce: true })}
              revealed={!!state?.tallyShown}
              onReveal={(tallyShown) => setState((p) => ({ ...p, tallyShown }))}
            />
          ) : null}

          {revealed ? (
          <table className="lm-nextword__table">
            <caption>{ui("tableCaption", { word: current })}</caption>
            <thead>
              <tr><th scope="col">{ui("colNext")}</th><th scope="col">{ui("colTimes")}</th><th scope="col">{ui("colShare")}</th></tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.word}>
                  <th scope="row">{f.word}</th>
                  <td>{f.count}</td>
                  <td>
                    <span>{ui("shareOf", { count: f.count, total: f.total })}</span>
                    <span className="lm-bar" aria-hidden="true"><span className="lm-bar__fill" style={{ inlineSize: `${percent(f)}%` }} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : null}
          {!rows.length ? <p className="lm-muted">{ui("noFollowers", { word: current })}</p> : null}

          {!revealed && rows.length ? (
            <>
              <Button variant="primary" disabled={!classroom && !guessed} onClick={() => setState((p) => ({ ...p, shown: current, stats }))}>{ui("showPick")}</Button>
              {!classroom && !guessed ? <p className="lm-muted lm-small">{ui("pickFirst")}</p> : null}
            </>
          ) : null}
          {revealed && top ? (
            <div className="lm-insight" role="status">
              {guessed ? <p>{ui("youGuessed", { guess: guessed, word: current, next: top.word, count: top.count, total: top.total })}</p> : null}
              <p>{ui("pickIs", { word: current, next: top.word, count: top.count, total: top.total, pct: percent(top) })}</p>
              <p className="lm-muted lm-small">{ui("tieNote")}</p>
            </div>
          ) : null}

          {/* Writing a sentence shows each pick, so it waits for the reveal. */}
          {revealed ? <Button variant="secondary" onClick={() => { focus.arm(); setState((p) => ({ ...p, writeFrom: current, stats })); }}>{ui("write", { word: current })}</Button> : null}
          <div ref={focus.ref} tabIndex={-1} className="lm-nextword__written">
            {written ? (
              <>
                <p><strong>{ui("written")}</strong></p>
                <p className="lm-nextword__output">{joinTokens(written.tokens)}</p>
                <p><strong>{ui("stepsTitle")}</strong></p>
                <ol className="lm-nextword__steps">
                  {written.steps.map((s, i) => <li key={i}>{ui("step", { from: s.from, to: s.word, count: s.count, total: s.total })}</li>)}
                </ol>
                <p className="lm-muted lm-small">{ui("stopped", { max: MAX_WORDS })}</p>
                {written.tokens.filter((x) => !isPunctuation(x)).length >= MAX_WORDS ? <p className="lm-muted lm-small">{ui("loopNote")}</p> : null}
                {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
