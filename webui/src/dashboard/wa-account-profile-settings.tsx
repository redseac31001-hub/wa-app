import { type RefObject, useEffect, useRef, useState } from 'react';
import AvatarEditor, { type AvatarEditorRef } from 'react-avatar-editor';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { WAAccount } from '../proto/byte/v/forge/waapp/v1/profile';
import { setWaAccountProfilePicture, waAccountID, waAccountProfilePictureURL } from './wa-api';
import { WhatsAppIcon } from './wa-brand-icon';
import { Input } from './ui';

const maxProfilePictureBytes = 2 * 1024 * 1024;

type Props = {
  account: WAAccount;
  onDone: (message: string) => void;
  onError: (message: string) => void;
  onAvatarChanged: () => void;
};

export function WaAccountProfileSettings({ account, onDone, onError, onAvatarChanged }: Props) {
  const [picture, setPicture] = useState<File | null>(null);
  const [activePicture, setActivePicture] = useState('');
  const [avatarVersion, setAvatarVersion] = useState('');
  const [remoteFailed, setRemoteFailed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const editor = useRef<AvatarEditorRef>(null);
  const resetPictureSelection = () => {
    setPicture(null);
    if (fileInput.current) fileInput.current.value = '';
  };
  const handleError = (error: unknown) => onError(error instanceof Error ? error.message : String(error));
  const pictureMutation = useMutation({
    mutationFn: async ({ dataURL, file }: { dataURL: string; file: File }) => {
      if (file.size > maxProfilePictureBytes) throw new Error('头像图片不能超过 2 MiB');
      const response = await setWaAccountProfilePicture(account, { image_base64: dataURLBase64(dataURL), content_type: 'image/jpeg' });
      return { dataURL, response };
    },
    onSuccess: ({ dataURL, response }) => {
      setActivePicture(dataURL);
      setAvatarVersion(String(Date.now()));
      setRemoteFailed(false);
      resetPictureSelection();
      onAvatarChanged();
      onDone(response.profile_picture_id ? '头像已提交' : '头像请求已提交');
    },
    onError: (error) => { resetPictureSelection(); handleError(error); },
  });
  const accountID = waAccountID(account);
  const remoteAvatar = remoteFailed ? '' : waAccountProfilePictureURL(account, avatarVersion || account.audit?.updated_at || 'latest');
  const busy = pictureMutation.isPending;
  useEffect(() => {
    setActivePicture('');
    setAvatarVersion('');
    setRemoteFailed(false);
    setPicture(null);
    if (fileInput.current) fileInput.current.value = '';
  }, [accountID]);
  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <button className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-muted/60 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70" type="button" disabled={busy} title="更换头像" aria-label="更换头像" onClick={() => { if (fileInput.current) fileInput.current.value = ''; fileInput.current?.click(); }}>
        {picture ? <AvatarPreview editor={editor} image={picture} onReady={(dataURL) => pictureMutation.mutate({ dataURL, file: picture })} onError={(message) => { resetPictureSelection(); onError(message); }} /> : <StoredAvatar src={activePicture || remoteAvatar} onError={() => setRemoteFailed(true)} />}
        {busy ? <span className="absolute inset-0 grid place-items-center bg-background/70"><Loader2 className="size-4 animate-spin" /></span> : null}
      </button>
      <Input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setSelectedPicture(event.target.files?.[0] || null, setPicture, onError)} />
    </section>
  );
}

function StoredAvatar({ src, onError }: { src: string; onError: () => void }) {
  return src ? <img className="size-12 object-cover" src={src} alt="当前头像" onError={onError} /> : <WhatsAppIcon className="size-7" />;
}

function AvatarPreview({ editor, image, onReady, onError }: { editor: RefObject<AvatarEditorRef | null>; image: File; onReady: (dataURL: string) => void; onError: (message: string) => void }) {
  return (
    <AvatarEditor
      ref={editor}
      image={image}
      width={512}
      height={512}
      border={0}
      borderRadius={256}
      scale={1}
      backgroundColor="#ffffff"
      onLoadSuccess={() => onReady(avatarDataURL(editor.current))}
      onLoadFailure={() => onError('头像图片加载失败')}
      style={{ width: '3rem', height: '3rem' }}
    />
  );
}

function setSelectedPicture(file: File | null, setPicture: (file: File | null) => void, onError: (message: string) => void) {
  if (file && file.size > maxProfilePictureBytes) {
    onError('头像图片不能超过 2 MiB');
    return;
  }
  setPicture(file);
}

function avatarDataURL(editor: AvatarEditorRef | null) {
  const dataURL = editor?.getImageScaledToCanvas().toDataURL('image/jpeg', 0.92);
  if (!dataURL) throw new Error('头像图片编码失败');
  return dataURL;
}

function dataURLBase64(dataURL: string) {
  return dataURL.slice(dataURL.indexOf(',') + 1);
}
