import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateBlocks } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { layerBuilder } from "./index";
import { messages } from "./messages";

const strings = { p: "Build a network that learns the wave.", explain: "A bigger network is not always better.", small: "A small network", big: "A big network" };
const config = { promptKey: "p", dataset: { type: "wave", points: 10, noise: 0.5, seed: 3 }, maxLayers: 3, maxWidth: 16, explainKey: "explain" };
const block = { id: "lb1", type: "layer-builder", config };
const status = (c: HTMLElement) => c.querySelector(".lm-layers-status")!;
const voteBlock = { ...block, config: { ...config, smallKey: "small", bigKey: "big" } };

describe("layer-builder", () => {
  it("lets the learner change widths and layers with buttons", async () => {
    renderBlock(layerBuilder, block, strings);
    expect(screen.getByText("3 neurons")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "More neurons in layer 1" }));
    expect(screen.getByText("4 neurons")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add a layer" }));
    expect(screen.getByRole("button", { name: "Fewer neurons in layer 2" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove layer 2" }));
    expect(screen.queryByRole("button", { name: "Fewer neurons in layer 2" })).not.toBeInTheDocument();
  });

  it("respects maxLayers and maxWidth", async () => {
    renderBlock(layerBuilder, { ...block, config: { ...config, maxLayers: 1, maxWidth: 3 } }, strings);
    expect(screen.queryByRole("button", { name: "Add a layer" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More neurons in layer 1" })).toBeDisabled();
  });

  it("trains, then names overfitting in words with both errors as numbers", async () => {
    const { container } = renderBlock(layerBuilder, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Add a layer" }));
    await userEvent.click(screen.getByRole("button", { name: "Add a layer" }));
    for (let i = 0; i < 13; i++) for (const n of [1, 2, 3]) await userEvent.click(screen.getByRole("button", { name: `More neurons in layer ${n}` }));
    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    expect(screen.getByRole("progressbar", { name: "Training progress" })).toBeInTheDocument();
    await screen.findByText("Overfitting", {}, { timeout: 15000 });
    expect(screen.getByText("Error on training points")).toBeInTheDocument();
    expect(screen.getByText("Error on new points")).toBeInTheDocument();
    expect(status(container)).toHaveTextContent(/Training finished/);
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
  }, 30000);

  it("names underfitting for a network that is too small", async () => {
    renderBlock(layerBuilder, { ...block, config: { ...config, maxWidth: 1 } }, strings);
    // widths start at min(3, maxWidth) = 1
    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    await screen.findByText("Underfitting", {}, { timeout: 15000 });
  }, 30000);

  it("clears the result when the network changes, and undo brings it back", async () => {
    renderBlock(layerBuilder, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    await screen.findByText("Error on new points", {}, { timeout: 15000 });
    await userEvent.click(screen.getByRole("button", { name: "More neurons in layer 1" }));
    expect(screen.queryByText("Error on new points")).not.toBeInTheDocument();
    expect(screen.getByText("Press Train to see what this network learns.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Error on new points")).toBeInTheDocument();
  }, 30000);

  it("can stop training", async () => {
    const { container } = renderBlock(layerBuilder, block, strings);
    fireEvent.click(screen.getByRole("button", { name: "Train" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(status(container)).toHaveTextContent("Training stopped.");
    expect(screen.getByRole("button", { name: "Train" })).toBeInTheDocument();
  });

  it("classroom: votes, trains both and compares them", async () => {
    renderBlock(layerBuilder, voteBlock, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for A big network" }));
    expect(screen.getByText("1 vote in total")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Train both networks" }));
    await waitFor(() => expect(screen.getByText(/Lower error on new points|same error on new points/)).toBeInTheDocument(), { timeout: 15000 });
    expect(screen.getAllByText("Error on new points")).toHaveLength(2);
  }, 30000);

  it("classroom without vote keys still trains both", async () => {
    renderBlock(layerBuilder, block, strings, { mode: "classroom" });
    expect(screen.queryByText("Show of hands")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Train both networks" })).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode, before and after training", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(layerBuilder, voteBlock, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      await userEvent.click(screen.getByRole("button", { name: mode === "personal" ? "Train" : "Train both networks" }));
      await screen.findAllByText("Error on new points", {}, { timeout: 15000 });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  }, 40000);

  it("has complete en, hi and te messages", () => {
    const en = Object.keys(messages.en).sort();
    expect(Object.keys(messages.hi).sort()).toEqual(en);
    expect(Object.keys(messages.te).sort()).toEqual(en);
    expect(messages.en.howto).toBeTruthy();
  });

  it("declares a strict contract and rejects invalid configuration", () => {
    const check = (c: Record<string, unknown>) => validateBlocks([{ id: "x", type: "layer-builder", componentVersion: "1.0", config: c }], { en: { p: "p", explain: "e" } }, { contracts: [layerBuilder] });
    expect(layerBuilder.act).toBe("build");
    expect(check(config).map((i) => i.message)).toEqual([]);
    expect(check({ ...config, dataset: { train: [[0, 1], [1, 2]], test: [[0.5, 1], [0.7, 1.4]] } })).toEqual([]);
    expect(check({ ...config, maxLayers: 4 }).length).toBeGreaterThan(0);
    expect(check({ ...config, maxWidth: 17 }).length).toBeGreaterThan(0);
    expect(check({ ...config, dataset: { type: "spiral", points: 10, noise: 0, seed: 1 } }).length).toBeGreaterThan(0);
    expect(check({ ...config, extra: 1 }).length).toBeGreaterThan(0);
    expect(check({ promptKey: "p" }).length).toBeGreaterThan(0);
  });

  it("exposes string keys and a class vote only when both keys are present", () => {
    expect(layerBuilder.stringKeys(voteBlock.config)).toEqual(["p", "explain", "small", "big"]);
    expect(layerBuilder.vote?.(voteBlock.config)?.options.map((o) => o.id)).toEqual(["small", "big"]);
    expect(layerBuilder.vote?.(config)).toBeNull();
  });
});
