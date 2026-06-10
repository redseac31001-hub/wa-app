import type { ReactNode, SyntheticEvent } from 'react';
import { Info, Loader2, Plus } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import type { LongConnectionState } from '../proto/byte/v/forge/waapp/v1/messaging';
import type { WAAccount } from '../proto/byte/v/forge/waapp/v1/profile';
import { waAccountID, waAccountProfilePictureURL, waAccountTitle } from './wa-api';
import { WhatsAppIcon } from './wa-brand-icon';
import { WaConnectionDot } from './wa-connection-dot';
import { waAccountPath, waChatsPath } from './wa-route-paths';

export function WaAccountRail({ accounts, selectedID, avatarVersion, connections, loading, connectionsLoading }: { accounts: WAAccount[]; selectedID: string; avatarVersion: string; connections: Map<string, LongConnectionState>; loading: boolean; connectionsLoading: boolean }) {
  return (
    <aside className="grid h-dvh grid-rows-[auto_1fr_auto] border-r border-border bg-card">
      <div className="grid h-16 place-items-center border-b border-border">
        <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50"><WhatsAppIcon className="size-7" /></span>
      </div>
      <div className="min-h-0 overflow-y-auto p-2">
        {loading && <div className="grid h-14 place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>}
        {accounts.map((account) => <AccountLink key={waAccountID(account)} account={account} selected={waAccountID(account) === selectedID} avatarVersion={avatarVersion} connection={connections.get(waAccountID(account))} loading={connectionsLoading} />)}
      </div>
      <div className="grid gap-2 border-t border-border p-2">
        {selectedID ? <RailLink title="账号信息" to={waAccountPath(selectedID)}><Info size={18} /></RailLink> : <RailButton disabled title="账号信息"><Info size={18} /></RailButton>}
        <RailLink title="添加账号" to="/accounts/new"><Plus size={20} /></RailLink>
      </div>
    </aside>
  );
}

function AccountLink({ account, selected, avatarVersion, connection, loading }: { account: WAAccount; selected: boolean; avatarVersion: string; connection?: LongConnectionState; loading: boolean }) {
  const id = waAccountID(account);
  return (
    <NavLink className={({ isActive }) => `relative mb-2 grid size-12 place-items-center rounded-2xl transition hover:bg-muted ${selected || isActive ? 'bg-primary/10 ring-2 ring-primary/20' : ''}`} to={waChatsPath(id)} title={waAccountTitle(account)} aria-label={waAccountTitle(account)}>
      <AccountAvatar account={account} version={avatarVersion} />
      <WaConnectionDot className="absolute bottom-1.5 right-1.5 ring-2 ring-card" connection={connection} loading={loading} />
    </NavLink>
  );
}

function AccountAvatar({ account, version }: { account: WAAccount; version: string }) {
  const src = waAccountProfilePictureURL(account, version || 'latest');
  const hideBrokenImage = (event: SyntheticEvent<HTMLImageElement>) => { event.currentTarget.style.display = 'none'; };
  return (
    <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-emerald-50">
      <WhatsAppIcon className="size-6" title={waAccountTitle(account)} />
      {src ? <img key={src} className="absolute inset-0 size-full object-cover" src={src} alt={waAccountTitle(account)} onError={hideBrokenImage} /> : null}
    </span>
  );
}

function RailLink({ children, title, to }: { children: ReactNode; title: string; to: string }) {
  return <Link className="grid size-12 place-items-center rounded-2xl text-muted-foreground transition hover:bg-muted hover:text-foreground" to={to} title={title} aria-label={title}>{children}</Link>;
}

function RailButton({ children, title, disabled }: { children: ReactNode; title: string; disabled?: boolean }) {
  return <button className="grid size-12 place-items-center rounded-2xl text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40" type="button" title={title} aria-label={title} disabled={disabled}>{children}</button>;
}
