'use client';

import { useState } from 'react';

type Message = { username: string; message: string; avatar: string; timestamp: string };

export default function SessionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  return (
    <div className="nx-chat">
      <div className="nx-log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="nx-empty" role="status">
            <strong>No posts yet</strong>
            Write a note below. It stays in this browser session and is not sent to a server.
          </div>
        ) : (
          messages.map((message) => (
            <div className="nx-msg" key={message.timestamp}>
              <span className="nx-avatar" aria-hidden="true">{message.username.slice(0, 1).toUpperCase()}</span>
              <div>
                <div className="nx-msg__name">{message.username}</div>
                <p>{message.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        className="nx-composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim()) return;
          setMessages((current) => [
            ...current,
            { username: 'Visitor', message: input.trim(), avatar: '', timestamp: new Date().toISOString() },
          ]);
          setInput('');
        }}
      >
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Write a post" aria-label="Post" />
        <button type="submit" className="nx-btn">Post</button>
      </form>
    </div>
  );
}
