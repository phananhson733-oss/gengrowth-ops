import { NextResponse } from 'next/server.js';

export function proxy() {
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
