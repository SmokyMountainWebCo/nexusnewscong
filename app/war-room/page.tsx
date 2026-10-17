import ClaimList from '@/components/ClaimList';
import DeskShell from '@/components/DeskShell';
import WarMapLoader from '@/components/WarMapLoader';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims } from '@/lib/published';

export default function WarRoomPage() {
  const claims = loadClaims();
  return (
    <DeskShell current="war-room">
      <p className="nx-kicker">War room</p>
      <h2 className="nx-title">Threat map</h2>
      <p className="nx-deck">
        Conflict and disaster layers are the GeoJSON files in the publish. An empty file with a healthy feed stays on the desk as “No current events.” A feed marked unavailable is listed in amber.
      </p>
      <ClaimList claims={claimsForRoom(claims, 'war-room')} catalog={claims} title="Claims filed to the war room" />
      <WarMapLoader />
    </DeskShell>
  );
}
