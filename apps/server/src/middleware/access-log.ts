import type { MiddlewareHandler } from 'hono';

export const accessLog: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const { method } = c.req;
  const url =
    c.req.path +
    (c.req.raw.url.includes('?')
      ? `?${c.req.raw.url.split('?')[1] ?? ''}`
      : '');

  await next();

  const status = c.res.status;
  const duration = Date.now() - start;
  const ip = c.req.header('x-forwarded-for') ?? '-';
  console.log(`[access] ${method} ${url} ${status} ${duration}ms - ${ip}`);
};
