# Fastify Swagger Transform Validation Schema

Bridging the gap between your validation schemas and `@fastify/swagger`, so you can generate your OpenAPI documentation.

## Why use this?

When using `@fastify/swagger` to generate OpenAPI documentation, your validation schemas need to be in JSON Schema format. However, modern validation libraries like Zod, ArkType, and Valibot use their own schema formats. This package bridges that gap by transforming validation schemas into the JSON Schema format that `@fastify/swagger` expects.

## Installation

```bash
npm install fastify-swagger-transform-validation-schema
# or
pnpm add fastify-swagger-transform-validation-schema
```

## Basic Usage

### With Zod

```typescript
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import fastify from "fastify";
import { fastifySwaggerTransform } from "fastify-swagger-transform-validation-schema";
import { z } from "zod";

// Create a custom mapper for Zod
function zodMapper(schema: unknown, propertyName: string) {
  return z.toJSONSchema(schema as z.ZodType);
};

const server = fastify()
  .register(fastifySwagger, { transform: fastifySwaggerTransform(zodMapper) })
  .register(fastifySwaggerUi, { routePrefix: '/docs' })
  .register(async (server: FastifyInstance) => {
      server.get(
          "/:id",
          {
              schema: {
                  params: z.object({ id: z.string() }),
              },
          },
          ({ params }) => {
              return { id: params.id };
          },
      );
  });

```

### With Default Mapper (Auto-detection)

The package includes a default mapper that automatically detects schemas with `toJSONSchema()` or `toJsonSchema()` methods:

```typescript
const server = fastify()
  .register(fastifySwagger, { transform: fastifySwaggerTransform() });
```

### Multi-library Support

You can create a mapper that supports multiple validation libraries:

```typescript
function multiMapper(schema: unknown, propertyName: string) {
  for (const mapper of [defaultMapper, zodMapper]) {
    try {
      return mapper(schema, propertyName);
    } catch (e) {
      if (e instanceof FastifySwaggerTransformValidationSchemaError) continue;
    }
  }
  throw new Error("No mapper found for schema");
};

const server = fastify()
  .register(fastifySwagger, { transform: fastifySwaggerTransform(multiMapper) });
```

## Troubleshooting

### Error: "Could not find a 'toJsonSchema' or 'toJSONSchema' method"

This error occurs when using the default mapper with a schema that doesn't have the expected methods.

**Solution:** Create a custom mapper for your validation library:

```typescript
function customMapper(schema: unknown, propertyName: string) {
  if (isMySchemaType(schema)) {
    return convertToJSONSchema(schema);
  }
  return defaultMapper(schema, propertyName);
};
```

### Schema or properties not appearing in OpenAPI docs

**Possible causes:**
1. Mapper not returning proper JSON Schema format
2. Schema transformation failing silently
3. Routes are not detected by `@fastify/swagger`, make sure they are declared within a `.register`

## Related Packages

- [`fastify-type-provider-standard-schema`](https://github.com/jgburet/fastify-type-provider-standard-schema) - Type provider for Standard Schema compatible validation libraries
- [`@fastify/swagger`](https://github.com/fastify/fastify-swagger) - OpenAPI documentation generator for Fastify
- [`@fastify/swagger-ui`](https://github.com/fastify/fastify-swagger-ui) - Swagger UI plugin for Fastify

## License

MIT
