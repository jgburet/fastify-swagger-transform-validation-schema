import { hasMethod, isRecord, mapValues } from "./helpers";

import type { SwaggerTransform } from "@fastify/swagger";
import type { MappedFastifySchema } from "./helpers";

export class FastifySwaggerTransformValidationSchemaError extends Error {
    constructor(schema: unknown) {
        super("Could not find a 'toJsonSchema' or 'toJSONSchema' method to call.", {
            cause: { schema },
        });
    }
}

export interface JSONSchemaObject {
    [key: string]: unknown;
}

export type JSONSchemaMapper<T> = (schema: unknown, propertyName: string) => T;

export function defaultMapper<T>(schema: unknown): T {
    if (hasMethod<T>("toJsonSchema", schema)) return schema.toJsonSchema();
    if (hasMethod<T>("toJSONSchema", schema)) return schema.toJSONSchema();
    throw new FastifySwaggerTransformValidationSchemaError(schema);
}

export type FastifySwaggerTransformOptions = Parameters<SwaggerTransform>[0];
export type FastifySwaggerTransform<T> = (c: FastifySwaggerTransformOptions) => {
    schema: MappedFastifySchema<T>;
    url: string;
};

export function fastifySwaggerTransform<T>(
    mapper?: JSONSchemaMapper<T>,
): FastifySwaggerTransform<T> {
    const m = mapper || ((schema) => defaultMapper<T>(schema));

    return function transform({
        schema: { body, headers, params, querystring, response, ...rest },
        url,
    }) {
        return {
            schema: {
                ...rest,
                ...(body ? { body: m(body, "body") } : {}),
                ...(headers ? { headers: m(headers, "headers") } : {}),
                ...(params ? { params: m(params, "params") } : {}),
                ...(querystring ? { querystring: m(querystring, "querystring") } : {}),
                ...(isRecord(response) ? { response: mapValues(m, response) } : {}),
            },
            url,
        };
    };
}
