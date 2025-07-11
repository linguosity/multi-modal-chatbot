'use client';

import { signOut } from '@/app/auth/actions';
import { Button } from './button';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit">Sign Out</Button>
    </form>
  );
}
