'use client';

import { useEffect, useState } from 'react';

type User = { username: string; avatar: string };

export default function AccountRoom() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nexusUser');
    if (!saved) return;
    try {
      setCurrentUser(JSON.parse(saved) as User);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  function createAccount() {
    if (!usernameInput.trim()) {
      window.alert('Enter a username');
      return;
    }
    const save = (avatar: string) => {
      const user = { username: usernameInput.trim(), avatar };
      localStorage.setItem('nexusUser', JSON.stringify(user));
      setCurrentUser(user);
      setUsernameInput('');
      setAvatarFile(null);
    };
    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = () => save(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(avatarFile);
      return;
    }
    save('');
  }

  function logout() {
    localStorage.removeItem('nexusUser');
    setCurrentUser(null);
  }

  return (
    <section className="account">
      <h2>Account</h2>
      {currentUser ? (
        <div>
          {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="account__avatar" /> : null}
          <p>Welcome, {currentUser.username}!</p>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createAccount();
          }}
        >
          <h3>Create Account</h3>
          <input value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} placeholder="Username" />
          <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
          <button type="submit">Create Account & Upload Picture</button>
        </form>
      )}
    </section>
  );
}
