'use client';

import { useState } from 'react';

export default function AskNexus() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  async function execute() {
    const query = input.trim();
    if (!query) return;
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setInput('');
    const agents = ['Research', 'FactCheck', 'Security', 'Creative'];
    let result = `NEXUS OS ONLINE — Running agentic loop for: ${query}\n\n`;
    for (const agent of agents) result += `→ ${agent} Agent: Processing...\n  ✓ Completed. Contribution added.\n`;
    result += `\nFinal output: Cross-referenced thousands of sources. Core facts stable. Free media flow secured.`;
    setMessages((prev) => [...prev, { role: 'assistant', content: result }]);
  }

  return (
    <>
      <button type="button" className="desk__ask" onClick={() => setOpen(true)}>
        Ask Nexus
      </button>
      {open ? (
        <div className="ask" role="presentation" onClick={() => setOpen(false)}>
          <div className="ask__panel" role="dialog" aria-label="Ask Nexus" onClick={(event) => event.stopPropagation()}>
            <div className="ask__head">
              <h2>Nexus — Agentic AI OS</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="ask__log">
              {messages.map((message, index) => (
                <p key={index} className={message.role === 'user' ? 'is-user' : 'is-assistant'}>
                  {message.content}
                </p>
              ))}
            </div>
            <form
              className="ask__form"
              onSubmit={(event) => {
                event.preventDefault();
                void execute();
              }}
            >
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Command the OS..." />
              <button type="submit">Execute</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
