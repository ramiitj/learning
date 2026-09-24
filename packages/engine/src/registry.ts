import type { ComponentContract } from "@lm/schema";
import type { AnyPlugin } from "./types";

/**
 * The plugin registry maps a component type and version to its renderers and
 * its content contract. Lessons pin the version they were written for; a
 * plugin lists every version it can still render, so published lessons never
 * break when a component moves on.
 */
export class Registry {
  private readonly byType = new Map<string, AnyPlugin>();
  /** Interface strings of every plugin, namespaced by type: locale -> "type.key" -> message. */
  readonly messages: Record<string, Record<string, string>> = {};

  constructor(plugins: readonly AnyPlugin[]) {
    for (const p of plugins) {
      if (this.byType.has(p.type)) throw new Error(`Component "${p.type}" is registered twice`);
      this.byType.set(p.type, p);
      for (const [locale, table] of Object.entries(p.messages)) {
        const target = (this.messages[locale] ??= {});
        for (const [k, v] of Object.entries(table)) target[`${p.type}.${k}`] = v;
      }
    }
  }

  get(type: string, version?: string): AnyPlugin | undefined {
    const p = this.byType.get(type);
    if (!p) return undefined;
    return version === undefined || p.versions.includes(version) ? p : undefined;
  }

  get types(): string[] {
    return [...this.byType.keys()];
  }

  get contracts(): ComponentContract[] {
    return [...this.byType.values()];
  }
}
