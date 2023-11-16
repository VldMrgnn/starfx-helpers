import type { LoaderCtx, PipeCtx } from "starfx";
import type { Operation } from "starfx";
import { ActionWithPayload } from 'starfx';

import type { Result } from "starfx";
export interface AppState {
  [key: string]: any;
}
export interface Action<T extends string = string> {
  type: T;
}

export interface ThunkCtx<P = any, D = any> extends PipeCtx<P>, LoaderCtx<P> {
  actions: ActionWithPayload<P>[];
  json: D | null;
  result: Result<any>;
}

export type { Next } from "starfx";
export type { ActionWithPayload } from "starfx";
export type { ApiCtx } from "starfx";

// export interface Subscription<T, R> {
//   next(): Operation<IteratorResult<T, R>>;
// }
export type { Subscription } from "starfx";

export type TOutput = "notify" | "console" | "terminal";
