"use client";
import { useId, useMemo, useState, type RefObject } from "react";
import { Button, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import { seededShuffle } from "../shared/strings";
import type { SortConfig, SortItem } from "./contract";

export interface SortState {
  placed: Record<string, string>;
  picked?: string;
  /** Classroom: show-of-hands counts for the current item, and whether the count is on screen. */
  counts?: Record<string, number>;
  tallyShown?: boolean;
}

type Props = BlockProps<SortConfig & Record<string, unknown>, SortState>;

function ItemsUnavailable({ ui }: { ui: Props["ui"] }) {
  return <p className="lm-notice" role="note">{ui("itemSetUnavailable")}</p>;
}

/** The end-of-sort summary: reveal text plus a neutral note on expert-differing choices. Shared by both modes. */
function Result({ config, placed, t, ui, focusRef }: { config: SortConfig; placed: Record<string, string>; t: Props["t"]; ui: Props["ui"]; focusRef: RefObject<HTMLDivElement | null> }) {
  const items = config.items ?? [];
  const differences = items.filter((i) => i.group && placed[i.id] && placed[i.id] !== i.group);
  return (
    <div ref={focusRef} tabIndex={-1} className="lm-stack">
      {config.revealKey ? <div className="lm-insight">{t.rich(config.revealKey)}</div> : null}
      {differences.length ? (
        <div className="lm-notice" role="note">
          <p>{ui("differsIntro")}</p>
          <ul>
            {differences.map((i) => (
              <li key={i.id}>{ui("differsLine", { item: t.text(i.labelKey), yours: t.text(placed[i.id]!), expert: t.text(i.group!) })}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function Sort({ block, config, state, setState, t, ui }: Props) {
  const items = config.items;
  const order = useMemo(() => seededShuffle(items ?? [], block.id), [items, block.id]);
  const placed = state?.placed ?? {};
  const picked = state?.picked;
  const unplaced = order.filter((i) => !(i.id in placed));
  const allPlaced = !!items && items.length > 0 && unplaced.length === 0;
  const focus = useFocusAfter<HTMLDivElement>(allPlaced);
  const [announcement, setAnnouncement] = useState("");
  const trayId = useId();

  if (!items) return <ItemsUnavailable ui={ui} />;

  const pick = (item: SortItem) => {
    if (picked === item.id) {
      setState((prev) => ({ placed: prev?.placed ?? {}, picked: undefined }));
    } else {
      setAnnouncement(ui("announcePicked", { item: t.text(item.labelKey) }));
      setState((prev) => ({ placed: prev?.placed ?? {}, picked: item.id }));
    }
  };

  const placeInto = (group: string) => {
    const item = items.find((i) => i.id === picked);
    if (!item) return;
    setAnnouncement(ui("announcePlaced", { item: t.text(item.labelKey), group: t.text(group) }));
    focus.arm();
    setState((prev) => ({ placed: { ...(prev?.placed ?? {}), [picked!]: group }, picked: undefined }));
  };

  const returnToTray = (item: SortItem) => {
    setAnnouncement(ui("announceReturned", { item: t.text(item.labelKey) }));
    setState((prev) => {
      const next = { ...(prev?.placed ?? {}) };
      delete next[item.id];
      return { placed: next, picked: prev?.picked === item.id ? undefined : prev?.picked };
    });
  };

  const pickedPlaced = picked && placed[picked] ? items.find((i) => i.id === picked) : undefined;

  return (
    <div className="lm-sort">
      <p className="lm-lead">{t.rich(config.instructionKey)}</p>
      <p className="lm-sr-only" aria-live="polite" role="status">{announcement}</p>
      <section className="lm-sort__tray" aria-labelledby={trayId}>
        <h3 id={trayId} className="lm-sort__heading">{ui("tray")}</h3>
        {unplaced.length === 0 ? (
          <p className="lm-muted">{ui("trayEmpty")}</p>
        ) : (
          <ul className="lm-sort__items">
            {unplaced.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="lm-sort__item"
                  aria-pressed={picked === item.id}
                  onClick={() => pick(item)}
                >
                  {item.symbol ? <span aria-hidden="true">{item.symbol} </span> : null}
                  {t.rich(item.labelKey)}
                </button>
                {picked === item.id ? (
                  <div className="lm-sort__quick" role="group" aria-label={ui("quickPlace", { item: t.text(item.labelKey) })}>
                    {config.groups.map((g) => (
                      <Button key={g} variant="primary" onClick={() => placeInto(g)}>{t.text(g)}</Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {pickedPlaced ? (
          <Button variant="quiet" onClick={() => returnToTray(pickedPlaced)}>{ui("backToTray", { item: t.text(pickedPlaced.labelKey) })}</Button>
        ) : null}
      </section>
      <div className="lm-sort__groups">
        {config.groups.map((g) => {
          const here = items.filter((i) => placed[i.id] === g);
          return (
            <SortGroup key={g} group={g} here={here} picked={picked} onPick={pick} onPlace={placeInto} disabled={!picked} t={t} ui={ui} />
          );
        })}
      </div>
      {allPlaced ? <Result config={config} placed={placed} t={t} ui={ui} focusRef={focus.ref} /> : null}
    </div>
  );
}

function SortGroup({ group, here, picked, onPick, onPlace, disabled, t, ui }: {
  group: string;
  here: SortItem[];
  picked: string | undefined;
  onPick: (item: SortItem) => void;
  onPlace: (group: string) => void;
  disabled: boolean;
  t: Props["t"];
  ui: Props["ui"];
}) {
  const headingId = useId();
  return (
    <section className="lm-sort__group lm-card" aria-labelledby={headingId}>
      <h3 id={headingId} className="lm-sort__heading">
        {t.rich(group)} <span className="lm-muted lm-small">{ui("groupCount", { n: here.length })}</span>
      </h3>
      <Button variant="primary" disabled={disabled} onClick={() => onPlace(group)}>{ui("putHere", { group: t.text(group) })}</Button>
      {here.length ? (
        <ul className="lm-sort__items">
          {here.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="lm-sort__item"
                aria-pressed={picked === item.id}
                onClick={() => onPick(item)}
              >
                {item.symbol ? <span aria-hidden="true">{item.symbol} </span> : null}
                {t.rich(item.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Classroom: one item at a time, projected; the class votes by show of hands, then it is placed where most hands went. */
export function SortClassroom({ block, config, state, setState, t, ui }: Props) {
  const items = config.items;
  const order = useMemo(() => seededShuffle(items ?? [], block.id), [items, block.id]);
  const placed = state?.placed ?? {};
  const remaining = order.filter((i) => !(i.id in placed));
  const current = remaining[0];
  const counts: Counts = state?.counts ?? {};
  const tallyShown = !!state?.tallyShown;
  const focus = useFocusAfter<HTMLDivElement>(!current);

  if (!items) return <ItemsUnavailable ui={ui} />;

  const options = config.groups.map((g) => ({ id: g, label: t.rich(g), text: t.text(g) }));

  const place = () => {
    if (!current) return;
    const max = Math.max(0, ...config.groups.map((g) => counts[g] ?? 0));
    const winner = config.groups.find((g) => (counts[g] ?? 0) === max) ?? config.groups[0]!;
    focus.arm();
    setState((prev) => ({ placed: { ...(prev?.placed ?? {}), [current.id]: winner }, counts: {}, tallyShown: false }));
  };

  return (
    <div className="lm-sort lm-sort--classroom">
      <p className="lm-lead">{t.rich(config.instructionKey)}</p>
      {current ? (
        <div className="lm-card lm-sort__current">
          <h3 className="lm-sort__currentItem">
            {current.symbol ? <span aria-hidden="true">{current.symbol} </span> : null}
            {t.rich(current.labelKey)}
          </h3>
          <Tally
            ui={ui}
            options={options}
            counts={counts}
            onChange={(c) => setState((prev) => ({ placed: prev?.placed ?? {}, counts: c }), { coalesce: true })}
            revealed={tallyShown}
            onReveal={(v) => setState((prev) => ({ placed: prev?.placed ?? {}, counts, tallyShown: v }))}
          />
          <Button variant="primary" disabled={!tallyShown} onClick={place}>{ui("placeWhereMost")}</Button>
        </div>
      ) : (
        <div className="lm-stack">
          <h3>{ui("resultTitle")}</h3>
          <div className="lm-sort__groups">
            {config.groups.map((g) => {
              const here = items.filter((i) => placed[i.id] === g);
              return (
                <section key={g} className="lm-sort__group lm-card" aria-label={t.text(g)}>
                  <h4 className="lm-sort__heading">{t.rich(g)} <span className="lm-muted lm-small">{ui("groupCount", { n: here.length })}</span></h4>
                  <ul className="lm-sort__items">
                    {here.map((item) => (
                      <li key={item.id}>{item.symbol ? <span aria-hidden="true">{item.symbol} </span> : null}{t.rich(item.labelKey)}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <Result config={config} placed={placed} t={t} ui={ui} focusRef={focus.ref} />
        </div>
      )}
    </div>
  );
}
