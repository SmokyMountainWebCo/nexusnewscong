import DeskShell from '@/components/DeskShell';
import AccountRoom from '@/components/AccountRoom';

export default function AccountPage() {
  return (
    <DeskShell current="account">
      <AccountRoom />
    </DeskShell>
  );
}
