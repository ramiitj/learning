"use client";
import { useId, useMemo, type ReactNode } from "react";
import { addCounts, Button, ChoiceGroup, Tally, useFocusAfter, useLiveCounts, useLiveItem, type BlockProps, type Counts } from "@lm/engine";
import { GlossaryRow } from "../glossary";
import type { TrainClassifierConfig, TrainItem } from "./contract";
import { K, band, conflicts, predict, toVector, type Example, type Prediction } from "./model";

export interface TrainClassifierState {
  /** Labels the learner gave inside this component (when there is no fromBlock). */
  labels?: Record<string, string>;
  /** The labels the machine was last trained on. Results are computed from this snapshot. */
  trainedOn?: Record<string, string>;
  /** Classroom: index of the test item being guessed, whether its result is shown, and the hands counted. */
  step?: number;
  shown?: boolean;
  counts?: Counts;
  tallyShown?: boolean;
  /** Personal: what the learner predicted for each new item, and which results they have asked to see. */
  predictions?: Record<string, string>;
  revealed?: Record<string, boolean>;
}

type Props = BlockProps<TrainClassifierConfig & Record<string, unknown>, TrainClassifierState>;
type T = Props["t"];
type Ui = Props["ui"];

/** The labels currently in force: the sort block's placements, or the ones given here. Only known items and groups count. */
function currentLabels(config: TrainClassifierConfig, state: TrainClassifierState | undefined, readBlock: Props["readBlock"]): Record<string, string> {
  const source = config.fromBlock ? (readBlock<{ placed?: Record<string, string> }>(config.fromBlock)?.placed ?? {}) : (state?.labels ?? {});
  const out: Record<string, string> = {};
  for (const item of config.items) {
    const g = source[item.id];
    if (g && config.groups.includes(g)) out[item.id] = g;
  }
  return out;
}

function sameLabels(a: Record<string, string>, b: Record<string, string>): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

export function buildExamples(config: TrainClassifierConfig, labels: Record<string, string>): Example[] {
  const ids = config.features.map((f) => f.id);
  return config.items.filter((i) => labels[i.id]).map((i) => ({ id: i.id, vector: toVector(i.features, ids), label: labels[i.id]! }));
}

export function labelTestItems(config: TrainClassifierConfig, labels: Record<string, string>): { item: TrainItem; prediction: Prediction | null }[] {
  const ids = config.features.map((f) => f.id);
  const examples = buildExamples(config, labels);
  return config.testItems.map((item) => ({ item, prediction: predict(examples, toVector(item.features, ids)) }));
}

function useTraining(config: TrainClassifierConfig, state: TrainClassifierState | undefined, readBlock: Props["readBlock"]) {
  const labels = currentLabels(config, state, readBlock);
  const trainedOn = state?.trainedOn;
  const results = useMemo(() => (trainedOn ? labelTestItems(config, trainedOn) : []), [config, trainedOn]);
  const pairs = useMemo(() => (trainedOn ? conflicts(buildExamples(config, trainedOn)) : []), [config, trainedOn]);
  const used = trainedOn ? new Set(Object.values(trainedOn)).size : 0;
  return { labels, trainedOn, results, pairs, count: Object.keys(labels).length, stale: !!trainedOn && !sameLabels(labels, trainedOn), oneGroup: !!trainedOn && used === 1 };
}

function FeatureLine({ config, item, t, ui, locale }: { config: TrainClassifierConfig; item: TrainItem; t: T; ui: Ui; locale: string }) {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (
    <span className="lm-muted lm-small lm-train__features">
      {config.features.map((f) => ui("featureValue", { label: t.text(f.labelKey), value: nf.format(item.features[f.id] ?? 0) })).join(" · ")}
    </span>
  );
}

function ItemName({ item, t }: { item: TrainItem; t: T }) {
  return (
    <>
      {item.symbol ? <span aria-hidden="true">{item.symbol} </span> : null}
      {t.rich(item.labelKey)}
    </>
  );
}

function Labelling({ config, labels, mode, setLabel, t, ui, locale }: { config: TrainClassifierConfig; labels: Record<string, string>; mode: Props["mode"]; setLabel: (id: string, g: string) => void; t: T; ui: Ui; locale: string }) {
  return (
    <section className="lm-train__examples" aria-label={ui("examplesHeading")}>
      <h3 className="lm-train__heading">{ui("examplesHeading")}</h3>
      <p className="lm-muted">{ui("looksAt", { features: config.features.map((f) => t.text(f.labelKey)).join(", ") })}</p>
      <p className="lm-muted">{ui("howItWorks", { k: K })}</p>
      {config.fromBlock ? (
        <>
          <p className="lm-muted">{ui(mode === "classroom" ? "fromSortClass" : "fromSort")}</p>
          <ul className="lm-train__list">
            {config.items.map((item) => (
              <li key={item.id} className="lm-card lm-card--soft lm-train__row">
                <strong><ItemName item={item} t={t} /></strong>
                <span>{labels[item.id] ? t.rich(labels[item.id]!) : <span className="lm-muted">{ui("notSorted")}</span>}</span>
                <FeatureLine config={config} item={item} t={t} ui={ui} locale={locale} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="lm-train__list">
          {config.items.map((item) => (
            <div key={item.id} className="lm-card lm-card--soft lm-train__row">
              <ChoiceGroup
                legend={
                  <>
                    {item.symbol ? <span aria-hidden="true">{item.symbol} </span> : null}
                    {ui("pickGroup", { item: t.text(item.labelKey) })} <FeatureLine config={config} item={item} t={t} ui={ui} locale={locale} />
                  </>
                }
                choices={config.groups.map((g) => ({ id: g, label: t.rich(g) }))}
                value={labels[item.id]}
                onChange={(g) => setLabel(item.id, g)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const BAND_KEY = { high: "confidenceHigh", medium: "confidenceMedium", low: "confidenceLow" } as const;

/** One distance worked out in plain steps: the new item against its closest example. */
function Worked({ config, item, other, t, ui, locale }: { config: TrainClassifierConfig; item: TrainItem; other: TrainItem; t: T; ui: Ui; locale: string }) {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const rows = config.features.map((f) => {
    const a = item.features[f.id] ?? 0;
    const b = other.features[f.id] ?? 0;
    const diff = Math.abs(a - b);
    return { f, a, b, diff, sq: diff * diff };
  });
  const sum = rows.reduce((s, r) => s + r.sq, 0);
  return (
    <div className="lm-train__worked">
      <h5 className="lm-train__why">{ui("workedHeading", { item: t.text(item.labelKey), other: t.text(other.labelKey) })}</h5>
      <ol>
        {rows.map((r) => (
          <li key={r.f.id}>{ui("workedRow", { label: t.text(r.f.labelKey), one: nf.format(r.a), two: nf.format(r.b), diff: nf.format(r.diff), sq: nf.format(r.sq) })}</li>
        ))}
        <li>{ui("workedSum", { sum: nf.format(sum) })}</li>
        <li>{ui("workedRoot", { distance: nf.format(Math.sqrt(sum)) })}</li>
      </ol>
    </div>
  );
}

function ResultCard({ config, item, prediction, t, ui, locale, predicted, worked }: { config: TrainClassifierConfig; item: TrainItem; prediction: Prediction | null; t: T; ui: Ui; locale: string; predicted?: string; worked?: boolean }) {
  const headingId = useId();
  if (!prediction) return null;
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(prediction.confidence);
  const agree = prediction.votes[prediction.label] ?? 0;
  const byId = new Map(config.items.map((i) => [i.id, i]));
  const votes = config.groups.filter((g) => prediction.votes[g]).map((g) => ui("voteEntry", { group: t.text(g), n: prediction.votes[g]! })).join(", ");
  return (
    <section className="lm-card lm-train__result" aria-labelledby={headingId} data-confused={prediction.confused || undefined}>
      <h4 id={headingId} className="lm-train__item"><ItemName item={item} t={t} /></h4>
      <FeatureLine config={config} item={item} t={t} ui={ui} locale={locale} />
      {predicted ? <p>{ui("youPredicted", { group: t.text(predicted) })}</p> : null}
      <p className="lm-lead lm-train__says">{ui("machineSays", { group: t.text(prediction.label) })}</p>
      <p>
        {ui("confidenceLine", { agree, used: prediction.used, percent: pct })}.{" "}
        {ui("confidenceWords", { band: ui(BAND_KEY[band(prediction.confidence)]) })}
      </p>
      <span className="lm-bar" aria-hidden="true"><span className="lm-bar__fill" style={{ inlineSize: `${prediction.confidence * 100}%` }} /></span>
      <p className="lm-muted lm-small">{ui("vote", { votes })}</p>
      {prediction.confused ? <p className="lm-notice" role="note">{ui("confusedItem")}</p> : null}
      <h5 className="lm-train__why">{ui("relied", { k: prediction.used })}</h5>
      <ul className="lm-train__neighbours">
        {prediction.neighbours.map((n) => {
          const e = byId.get(n.id);
          return <li key={n.id}>{ui("reliedLine", { item: e ? t.text(e.labelKey) : n.id, group: t.text(n.label), distance: nf.format(n.distance) })}</li>;
        })}
      </ul>
      {worked && byId.get(prediction.neighbours[0]?.id ?? "") ? <Worked config={config} item={item} other={byId.get(prediction.neighbours[0]!.id)!} t={t} ui={ui} locale={locale} /> : null}
    </section>
  );
}

/** Personal mode: commit to a prediction for a new item before the machine's label is shown. */
function PredictCard({ config, item, predicted, onPredict, onShow, t, ui, locale }: { config: TrainClassifierConfig; item: TrainItem; predicted?: string; onPredict: (g: string) => void; onShow: () => void; t: T; ui: Ui; locale: string }) {
  const headingId = useId();
  return (
    <section className="lm-card lm-train__result" aria-labelledby={headingId}>
      <h4 id={headingId} className="lm-train__item"><ItemName item={item} t={t} /></h4>
      <FeatureLine config={config} item={item} t={t} ui={ui} locale={locale} />
      <ChoiceGroup legend={ui("predictPrompt")} choices={config.groups.map((g) => ({ id: g, label: t.rich(g) }))} value={predicted} onChange={onPredict} />
      <Button variant="primary" disabled={!predicted} onClick={onShow}>{ui("predictShow")}</Button>
      {!predicted ? <p className="lm-muted lm-small">{ui("predictFirst")}</p> : null}
    </section>
  );
}

function Notices({ config, training, t, ui }: { config: TrainClassifierConfig; training: ReturnType<typeof useTraining>; t: T; ui: Ui }) {
  const byId = new Map(config.items.map((i) => [i.id, i]));
  const name = (e: Example) => (byId.has(e.id) ? t.text(byId.get(e.id)!.labelKey) : e.id);
  return (
    <>
      {training.stale ? <p className="lm-notice" role="note">{ui("stale")}</p> : null}
      {training.pairs.length ? (
        <div className="lm-notice" role="note" data-tone="warm">
          <p>{ui("confusedAll")}</p>
          <ul>
            {training.pairs.map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>{ui("disagreePair", { one: name(a), two: name(b) })}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {training.oneGroup ? <p className="lm-notice" role="note">{ui("oneGroupOnly")}</p> : null}
    </>
  );
}

function TrainButton({ training, onTrain, ui }: { training: ReturnType<typeof useTraining>; onTrain: () => void; ui: Ui }) {
  const enough = training.count >= 2;
  return (
    <div className="lm-stack">
      <p className="lm-muted lm-small">{ui("labelledOf", { n: training.count })}</p>
      <Button variant={training.trainedOn && !training.stale ? "secondary" : "primary"} disabled={!enough} onClick={onTrain}>
        {ui(training.trainedOn ? "trainAgain" : "train")}
      </Button>
      {!enough ? <p className="lm-muted lm-small">{ui("needMore")}</p> : null}
    </div>
  );
}

export function TrainClassifier({ config, state, setState, readBlock, t, ui, locale, mode }: Props) {
  const training = useTraining(config, state, readBlock);
  const focus = useFocusAfter<HTMLElement>(state?.trainedOn);
  const headingId = useId();
  const setLabel = (id: string, g: string) => setState((prev) => ({ ...prev, labels: { ...(prev?.labels ?? {}), [id]: g } }));
  const train = () => {
    focus.arm();
    setState((prev) => ({ ...prev, trainedOn: training.labels, predictions: {}, revealed: {} }));
  };
  const revealed = state?.revealed ?? {};
  const firstOpen = training.results.find((r) => revealed[r.item.id])?.item.id;
  const allOpen = training.results.length > 0 && training.results.every((r) => !r.prediction || revealed[r.item.id]);
  return (
    <div className="lm-train">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      <GlossaryRow ids={config.glossary} ui={ui} />
      <Labelling config={config} labels={training.labels} mode={mode} setLabel={setLabel} t={t} ui={ui} locale={locale} />
      <TrainButton training={training} onTrain={train} ui={ui} />
      {training.trainedOn ? (
        <section ref={focus.ref} tabIndex={-1} className="lm-train__results" aria-labelledby={headingId}>
          <h3 id={headingId} className="lm-train__heading">{ui("resultsHeading")}</h3>
          <p role="status" className="lm-muted">{ui("trained", { n: Object.keys(training.trainedOn).length })}</p>
          <Notices config={config} training={training} t={t} ui={ui} />
          <div className="lm-train__cards">
            {training.results.map((r) =>
              revealed[r.item.id] ? (
                <ResultCard key={r.item.id} config={config} item={r.item} prediction={r.prediction} t={t} ui={ui} locale={locale} predicted={state?.predictions?.[r.item.id]} worked={r.item.id === firstOpen} />
              ) : r.prediction ? (
                <PredictCard
                  key={r.item.id}
                  config={config}
                  item={r.item}
                  predicted={state?.predictions?.[r.item.id]}
                  onPredict={(g) => setState((prev) => ({ ...prev, predictions: { ...prev?.predictions, [r.item.id]: g } }))}
                  onShow={() => setState((prev) => ({ ...prev, revealed: { ...prev?.revealed, [r.item.id]: true } }))}
                  t={t}
                  ui={ui}
                  locale={locale}
                />
              ) : null,
            )}
          </div>
          {allOpen && config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
        </section>
      ) : null}
    </div>
  );
}

/** Classroom: the teacher trains on the class's labels; the class guesses by show of hands before each reveal. */
export function TrainClassifierClassroom({ config, state, setState, readBlock, t, ui, locale, mode }: Props) {
  const training = useTraining(config, state, readBlock);
  const step = state?.step ?? 0;
  const total = config.testItems.length;
  const current = training.trainedOn ? config.testItems[step] : undefined;
  const shown = !!state?.shown;
  const counts: Counts = state?.counts ?? {};
  const focus = useFocusAfter<HTMLElement>(`${training.trainedOn ? 1 : 0}-${step}-${shown ? 1 : 0}`);
  useLiveItem(current?.id);
  const phones = useLiveCounts(current?.id);
  const setLabel = (id: string, g: string) => setState((prev) => ({ ...prev, labels: { ...(prev?.labels ?? {}), [id]: g } }));
  const train = () => {
    focus.arm();
    setState((prev) => ({ ...prev, trainedOn: training.labels, step: 0, shown: false, counts: {}, tallyShown: false }));
  };
  const options = config.groups.map((g) => ({ id: g, label: t.rich(g), text: t.text(g) }));
  const result = training.results[step];
  const all = addCounts(counts, phones);
  const guessed = result?.prediction ? (all[result.prediction.label] ?? 0) : 0;
  const guessTotal = config.groups.reduce((s, g) => s + (all[g] ?? 0), 0);
  const done = !!training.trainedOn && step >= total;
  let body: ReactNode = null;
  if (current && result) {
    body = (
      <section ref={focus.ref} tabIndex={-1} className="lm-card lm-train__current" aria-label={ui("classItemOf", { n: step + 1, total })}>
        <p className="lm-muted">{ui("classItemOf", { n: step + 1, total })}</p>
        <h3 className="lm-train__item lm-prompt"><ItemName item={current} t={t} /></h3>
        <FeatureLine config={config} item={current} t={t} ui={ui} locale={locale} />
        <p className="lm-lead">{ui("classGuessPrompt")}</p>
        <Tally
          ui={ui}
          options={options}
          itemId={current.id}
          counts={counts}
          onChange={(c) => setState((prev) => ({ ...prev, counts: c }), { coalesce: true })}
          revealed={!!state?.tallyShown}
          onReveal={(v) => setState((prev) => ({ ...prev, tallyShown: v }))}
          highlight={shown ? result.prediction?.label : undefined}
        />
        {!shown ? (
          <Button variant="primary" onClick={() => { focus.arm(); setState((prev) => ({ ...prev, shown: true, tallyShown: true })); }}>{ui("classReveal")}</Button>
        ) : (
          <div className="lm-stack">
            <ResultCard config={config} item={current} prediction={result.prediction} t={t} ui={ui} locale={locale} worked={step === 0} />
            <p role="status" className="lm-lead">{ui("classGuessed", { n: guessed, total: guessTotal })}</p>
            <Button variant="primary" onClick={() => { focus.arm(); setState((prev) => ({ ...prev, step: step + 1, shown: false, counts: {}, tallyShown: false })); }}>{ui("classNext")}</Button>
          </div>
        )}
      </section>
    );
  } else if (done) {
    body = (
      <section ref={focus.ref} tabIndex={-1} className="lm-stack">
        <p className="lm-lead" role="status">{ui("classAllDone")}</p>
        {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
      </section>
    );
  }
  const past = training.results.slice(0, Math.min(step, total));
  return (
    <div className="lm-train lm-train--classroom">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      <p className="lm-muted">{ui("classIntro")}</p>
      <GlossaryRow ids={config.glossary} ui={ui} />
      <Labelling config={config} labels={training.labels} mode={mode} setLabel={setLabel} t={t} ui={ui} locale={locale} />
      <TrainButton training={training} onTrain={train} ui={ui} />
      {training.trainedOn ? <Notices config={config} training={training} t={t} ui={ui} /> : null}
      {body}
      {past.length ? (
        <section aria-label={ui("classPastHeading")}>
          <h3 className="lm-train__heading">{ui("classPastHeading")}</h3>
          <div className="lm-train__cards">
            {past.map((r) => (
              <ResultCard key={r.item.id} config={config} item={r.item} prediction={r.prediction} t={t} ui={ui} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
