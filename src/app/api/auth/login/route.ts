import { type NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/auth';
import type { User, ApiError } from '@/lib/types';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ user: User } | ApiError>> {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json<ApiError>(
        { error: 'Email and password are required', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const user = await validateCredentials(body.email, body.password);

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 },
      );
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json<ApiError>(
      { error: 'Login failed', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
