import fs from 'node:fs/promises';
import path from 'node:path';
import type { User } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/lib/hcm-data.json');

interface RawUser extends User {
  password: string;
}

interface HCMDataWithUsers {
  users: RawUser[];
}

async function readUsers(): Promise<RawUser[]> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const data = JSON.parse(raw) as HCMDataWithUsers;
  return data.users ?? [];
}

function stripPassword({ password: _, ...user }: RawUser): User {
  void _;
  return user;
}

export async function getUsers(): Promise<User[]> {
  const users = await readUsers();
  return users.map(stripPassword);
}

export async function validateCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const users = await readUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!match) return null;
  return stripPassword(match);
}
