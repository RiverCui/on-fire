import NavLinks from "./nav-links";
import { Button } from '@/components/ui/button';
import { signOut } from '@/auth';

export default function SideNav() {

  return (
    <>
      <NavLinks />
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <Button>
          Sign Out
        </Button>
      </form>
    </>
  );
}
