import type { FastifySchema } from "fastify";

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

export function isRecord(x: unknown): x is Record<string, unknown> {
    return x !== null && (typeof x === "object" || typeof x === "function");
}

export function hasMethod<R>(m: string, x: unknown): x is { [m]: () => R } {
    return isRecord(x) && m in x && typeof x[m] === "function";
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
type ReplaceUnknown<T, R = string> = {
    [K in keyof T]: T[K] extends unknown ? (unknown extends T[K] ? R : T[K]) : T[K];
};
export type MappedFastifySchema<T> = Expand<
    ReplaceUnknown<Omit<FastifySchema, "response">, T> & {
        response?: Record<string, T>;
    }
>;
