import { z } from 'zod';
import { insertUserSchema, insertProductSchema, insertReviewSchema, users, products, reviews, orders, coupons, subscribers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:username',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    listWriters: {
        method: 'GET' as const,
        path: '/api/writers',
        responses: {
            200: z.array(z.custom<typeof users.$inferSelect>()),
        }
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        writerId: z.coerce.number().optional(),
        genre: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/products/:id',
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  coupons: {
    list: {
      method: 'GET' as const,
      path: '/api/writers/:writerId/coupons',
      responses: {
        200: z.array(z.custom<typeof coupons.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/coupons',
      input: z.object({
        writerId: z.number(),
        code: z.string(),
        discountPercent: z.number(),
      }),
      responses: {
        201: z.custom<typeof coupons.$inferSelect>(),
      },
    },
  },
  subscribers: {
    list: {
      method: 'GET' as const,
      path: '/api/writers/:writerId/subscribers',
      responses: {
        200: z.array(z.custom<typeof subscribers.$inferSelect>()),
      },
    },
    subscribe: {
      method: 'POST' as const,
      path: '/api/writers/:writerId/subscribe',
      input: z.object({ readerId: z.number() }),
      responses: {
        201: z.void(),
      },
    },
  },
  reviews: {
    list: {
      method: 'GET' as const,
      path: '/api/products/:productId/reviews',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reviews',
      input: insertReviewSchema,
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
