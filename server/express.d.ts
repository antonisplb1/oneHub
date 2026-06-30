export {};

declare module 'express-serve-static-core' {
  interface Request {
    storeId?: string;
  }
}
