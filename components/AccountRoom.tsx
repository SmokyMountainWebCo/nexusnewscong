'use client';

import { useEffect, useState } from 'react';

type User = { username: string; avatar: string };

export default function AccountRoom() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('nexusUser');
    if (!saved) return;
    try {
      setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('nexusUser');
    }
  }, []);

  const createAccount = () => {
    if (!username.trim()) {
      setError('Enter a username');
      return;
    }
    setError('');
    const save = (avatar: string) => {
      const next = { username: username.trim(), avatar };
      localStorage.setItem('nexusUser', JSON.stringify(next));
      setUser(next);
      setUsername('');
      setAvatarFile(null);
    };
    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = () => save(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(avatarFile);
      return;
    }
    save('');
  };

  return (
    <div className="nx-account">
      <p className="nx-kicker">Account</p>
      <h2>This browser</h2>
      <p className="nx-deck">The name stays in this browser. It is not sent to a server.</p>
      {user ? (
        <div className="nx-center">
          {user.avatar ? (
            <img className="nx-avatar nx-avatar--lg" src={user.avatar} alt={`${user.username}'s profile picture`} />
          ) : (
            <div className="nx-avatar nx-avatar--lg" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</div>
          )}
          <p>Welcome, {user.username}.</p>
          <button
            type="button"
            className="nx-btn nx-btn--danger"
            onClick={() => {
              localStorage.removeItem('nexusUser');
              setUser(null);
            }}
          >
            Log out
          </button>
        </div>
      ) : (
        <form
          className="nx-form"
          onSubmit={(event) => {
            event.preventDefault();
            createAccount();
          }}
        >
          <label className="nx-field">
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="nx-field">
            Profile picture, optional
            <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
          </label>
          {error ? <p className="nx-error" role="alert">{error}</p> : null}
          <button type="submit" className="nx-btn">Create account</button>
        </form>
      )}
    </div>
  );
}
