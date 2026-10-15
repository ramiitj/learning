import { buildModel, followers, generate, isPunctuation, joinTokens, likelyName, percent, predictNext, splitSentences, startableWords, tokenise, topCandidates } from "./model";

const cats = ["The cat sat on the mat.", "The cat ate the fish.", "The cat sat down.", "The dog sat on the mat."];

describe("tokenise", () => {
  it("lower-cases words and keeps punctuation as tokens", () => {
    expect(tokenise("The Cat, sat!")).toEqual(["the", "cat", ",", "sat", "!"]);
    expect(tokenise("don't stop")).toEqual(["don't", "stop"]);
    expect(tokenise("")).toEqual([]);
  });
  it("never splits inside a Hindi word (matras and viramas stay)", () => {
    expect(tokenise("बिल्ली दूध पीती है।")).toEqual(["बिल्ली", "दूध", "पीती", "है", "।"]);
    expect(isPunctuation("।")).toBe(true);
  });
  it("never splits inside a Telugu word", () => {
    expect(tokenise("పిల్లి పాలు తాగుతుంది.")).toEqual(["పిల్లి", "పాలు", "తాగుతుంది", "."]);
  });
  it("keeps joiners inside words", () => {
    expect(tokenise("क्‍या")).toHaveLength(1);
  });
});

describe("splitSentences", () => {
  it("splits at sentence marks and line breaks, keeping the mark", () => {
    expect(splitSentences("I run. You walk!\nWe rest। Done")).toEqual(["I run.", "You walk!", "We rest।", "Done"]);
  });
});

describe("model", () => {
  const m = buildModel(cats);
  it("counts bigrams within sentences only", () => {
    expect(followers(m, "the")).toEqual([
      { word: "cat", count: 3, total: 7 },
      { word: "mat", count: 2, total: 7 },
      { word: "fish", count: 1, total: 7 },
      { word: "dog", count: 1, total: 7 },
    ]);
    expect(followers(m, ".")).toEqual([]);
  });
  it("predicts the most frequent follower with its fraction", () => {
    const p = predictNext(m, "The")!;
    expect(p).toEqual({ word: "cat", count: 3, total: 7 });
    expect(percent(p)).toBe(43);
    expect(predictNext(m, "unseen")).toBeNull();
  });
  it("breaks ties by first seen, so it is deterministic", () => {
    expect(predictNext(buildModel(["a b", "a c"]), "a")!.word).toBe("b");
    expect(topCandidates(m, "the", 3).map((f) => f.word)).toEqual(["cat", "mat", "fish"]);
  });
  it("reports vocabulary size and sentence count", () => {
    expect(m.vocabulary.size).toBe(10); // the cat sat on mat . ate fish down dog
    expect(m.sentences).toBe(4);
    expect(startableWords(m)).not.toContain(".");
  });
  it("is safe with words like constructor", () => {
    expect(predictNext(buildModel(["constructor toString"]), "constructor")!.word).toBe("tostring");
  });
  it("generates by always taking the most likely word, stopping at punctuation", () => {
    const g = generate(m, "the");
    expect(joinTokens(g.tokens)).toBe("the cat sat on the cat sat on the cat sat on");
    expect(g.steps[0]).toEqual({ from: "the", word: "cat", count: 3, total: 7 });
  });
  it("stops at punctuation and when nothing follows", () => {
    expect(joinTokens(generate(buildModel(["go home now."]), "go").tokens)).toBe("go home now.");
    expect(generate(buildModel(["go home"]), "home").tokens).toEqual(["home"]);
  });
  it("stops at 12 words in a loop", () => {
    const g = generate(buildModel(["a b a b a b"]), "a");
    expect(g.tokens.filter((t) => !isPunctuation(t))).toHaveLength(12);
  });
  it("works for Hindi", () => {
    const hi = buildModel(["बिल्ली दूध पीती है।", "बिल्ली दूध पीती है।", "बिल्ली सोती है।"]);
    expect(predictNext(hi, "बिल्ली")).toEqual({ word: "दूध", count: 2, total: 3 });
    expect(joinTokens(generate(hi, "बिल्ली").tokens)).toBe("बिल्ली दूध पीती है।");
  });
});

describe("likelyName", () => {
  it("flags a capitalised word in the middle of a sentence", () => {
    expect(likelyName("Today we saw Priya at school")).toBe("Priya");
    expect(likelyName("It rained. Then we left")).toBeNull();
    expect(likelyName("Then I said I'm here")).toBeNull();
    expect(likelyName("बिल्ली दूध पीती है।")).toBeNull();
    expect(likelyName("")).toBeNull();
  });
});
