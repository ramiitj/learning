import { render, screen } from "@testing-library/react";
import { createLessonT, createUiT } from "./i18n";

const strings = {
  en: { hello: "Hello {name}", term: "A <term-model>model</term-model> is a <b>pattern</b>.", only: "English only", plural: "{n, plural, one {# example} other {# examples}}" },
  hi: { hello: "नमस्ते {name}", plural: "{n, plural, one {# उदाहरण} other {# उदाहरण}}" },
};

describe("createLessonT", () => {
  const renderTerm = (id: string, children: React.ReactNode, key: string) => <button key={key} data-term={id}>{children}</button>;

  it("formats ICU messages in the learner's locale", () => {
    const t = createLessonT("hi", strings, renderTerm);
    expect(t.text("hello", { name: "आशा" })).toBe("नमस्ते आशा");
    expect(t.text("plural", { n: 3 })).toBe("3 उदाहरण");
  });

  it("falls back to English and marks the language", () => {
    const t = createLessonT("hi", strings, renderTerm);
    render(<p>{t.rich("only")}</p>);
    expect(screen.getByText("English only")).toHaveAttribute("lang", "en");
  });

  it("renders glossary terms as interactive elements", () => {
    const t = createLessonT("en", strings, renderTerm);
    render(<p>{t.rich("term")}</p>);
    expect(screen.getByRole("button", { name: "model" })).toHaveAttribute("data-term", "model");
    expect(t.text("term")).toBe("A model is a pattern.");
  });

  it("shows the key when a string is missing everywhere", () => {
    const t = createLessonT("en", strings, renderTerm);
    expect(t.has("nope")).toBe(false);
    expect(t.text("nope")).toBe("nope");
  });
});

describe("createUiT", () => {
  const catalog = { en: { "predict.commit": "Lock in my guess", undo: "Undo" }, te: { undo: "వెనక్కి" } };
  it("prefers the component namespace, then the engine, then English", () => {
    const ui = createUiT("te", [catalog], "predict");
    expect(ui("commit")).toBe("Lock in my guess");
    expect(ui("undo")).toBe("వెనక్కి");
  });
});
