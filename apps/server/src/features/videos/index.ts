// Public API of the videos feature. External consumers (app.ts, src/index.ts)
// import from here; internal code (routes.ts, services/*) imports directly
// from sibling files.
export { default as videosRoutes } from './routes';
