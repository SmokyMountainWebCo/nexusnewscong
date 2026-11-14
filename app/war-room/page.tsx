import ClaimList from '@/components/ClaimList';
import WarRoomView from '@/components/WarRoomView';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims } from '@/lib/published';

export default function WarRoomPage() {
  const claims = loadClaims();
  return (
    <section className="room">
      <p className="kicker">War room</p>
      <h2>Real-time threat intelligence</h2>
      <WarRoomView />
      <ClaimList claims={claimsForRoom(claims, 'war-room')} catalog={claims} title="Claims filed to the war room" />
    </section>
  );
}
