import { hasMethod, mapValues } from "./helpers";

import type { FastifySchema, RouteOptions } from "fastify";
import type { OpenAPIV3_1, OpenAPIV3, OpenAPIV2 } from "openapi-types";

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
type ReplaceUnknown<T, R = string> = {
    [K in keyof T]: T[K] extends unknown ? (unknown extends T[K] ? R : T[K]) : T[K];
};

export type MappedFastifySchema<T> = Expand<
    ReplaceUnknown<Omit<FastifySchema, "response">, T> & {
        response?: Record<string, T>;
    }
>;

export type JSONSchemaObject =
    | OpenAPIV3_1.SchemaObject
    | OpenAPIV3.SchemaObject
    | OpenAPIV2.SchemaObject;

export type JSONSchemaMapper<ValidationSchema> = (
    schema: ValidationSchema,
    propertyName: string,
) => JSONSchemaObject;

export class FastifySwaggerTransformValidationSchemaError extends Error {
    constructor(schema: unknown) {
        super("Could not find a 'toJsonSchema' or 'toJSONSchema' method to call.", {
            cause: { schema },
        });
    }
}

export function defaultMapper<ValidationSchema>(schema: ValidationSchema) {
    if (hasMethod("toJsonSchema", schema)) return schema.toJsonSchema();
    if (hasMethod("toJSONSchema", schema)) return schema.toJSONSchema();
    throw new FastifySwaggerTransformValidationSchemaError(schema);
}

export type FastifySwaggerTransformOptions<ValidationSchema> = {
    schema: MappedFastifySchema<ValidationSchema>;
    url: string;
    route: RouteOptions;
};

export type FastifySwaggerTransform<ValidationSchema> = ({
    schema,
    url,
    route,
}: FastifySwaggerTransformOptions<ValidationSchema>) => {
    schema: MappedFastifySchema<JSONSchemaObject>;
    url: string;
};

export function fastifySwaggerTransform<ValidationSchema>(
    mapper: JSONSchemaMapper<ValidationSchema> = defaultMapper,
): FastifySwaggerTransform<ValidationSchema> {
    return function transform({ schema: { body, headers, params, querystring, response }, url }) {
        return {
            schema: {
                body: body && mapper(body, "body"),
                headers: headers && mapper(headers, "headers"),
                params: params && mapper(params, "params"),
                querystring: querystring && mapper(querystring, "querystring"),
                response: response && mapValues(mapper, response),
            },
            url,
        };
    };
}

export default fastifySwaggerTransform;
