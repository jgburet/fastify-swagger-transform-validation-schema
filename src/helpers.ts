import type { JSONSchemaObject } from "./index";

export function mapValues<T, U>(
    fn: (value: T, key: string, obj: Record<string, T>) => U,
    obj: Record<string, T>,
): Record<string, U> {
    const result: Record<string, U> = {};

    for (const key of Object.keys(obj)) {
        result[key] = fn(obj[key], key, obj);
    }

    return result;
}

function isRecord(x: unknown): x is Record<string, unknown> {
    return x !== null && (typeof x === "object" || typeof x === "function");
}

export function hasMethod(m: string, x: unknown): x is { [m]: () => JSONSchemaObject } {
    return isRecord(x) && m in x && typeof x[m] === "function";
}
