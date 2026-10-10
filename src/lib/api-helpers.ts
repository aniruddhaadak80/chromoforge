import { NextResponse } from "next/server";

/** Envelope helpers shared by every route handler. */

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status },
  );
}
