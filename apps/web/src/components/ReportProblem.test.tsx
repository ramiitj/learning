import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import te from "../../messages/te.json";
import { ReportProblem } from "./ReportProblem";

const view = (locale: "en" | "hi" | "te", messages: Record<string, unknown>) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReportProblem lessonId="every-primitive" locale={locale} />
    </NextIntlClientProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe("ReportProblem", () => {
  it("has the report namespace in every launch locale with the same keys", () => {
    const keys = Object.keys(en.report).sort();
    expect(Object.keys(hi.report).sort()).toEqual(keys);
    expect(Object.keys(te.report).sort()).toEqual(keys);
  });

  it("opens a labelled form with the no-personal-details note, and posts the lesson and locale", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    view("en", en);
    const toggle = screen.getByRole("button", { name: "Report a problem" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Do not include your name or contact details.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("I am a"), { target: { value: "teacher" } });
    const msg = screen.getByLabelText("What went wrong?");
    expect(msg).toHaveAccessibleDescription("Do not include your name or contact details.");
    fireEvent.change(msg, { target: { value: "A typo" } });
    fireEvent.click(screen.getByRole("button", { name: "Send report" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Thank you"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe("/api/report");
    expect(JSON.parse(init.body)).toEqual({ role: "teacher", message: "A typo", lessonId: "every-primitive", locale: "en" });
  });

  it("says so, and keeps the message, when sending fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    view("hi", hi);
    fireEvent.click(screen.getByRole("button", { name: hi.report.open }));
    fireEvent.change(screen.getByLabelText(hi.report.message), { target: { value: "text" } });
    fireEvent.click(screen.getByRole("button", { name: hi.report.send }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(hi.report.error));
    expect(screen.getByLabelText(hi.report.message)).toHaveValue("text");
  });
});
