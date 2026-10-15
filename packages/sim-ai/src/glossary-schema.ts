/** The optional `glossary` config field every AI simulation accepts: ids of glossary terms (React-free, for contracts). */
export const glossaryProperty = { type: "array", maxItems: 8, uniqueItems: true, items: { type: "string", minLength: 1 } } as const;
