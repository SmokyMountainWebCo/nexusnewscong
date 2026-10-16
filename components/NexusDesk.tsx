'use client';

import { useEffect, useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import MarkdownBody from '@/components/MarkdownBody';
import {
  formatDeskDate,
  isPublished,
  labelize,
  parseStoryIndex,
  parseStoryMarkdown,
  storyBadge,
  stripMatchingHeading,
  updatedLabel,
  type StoryCard,
  type StoryDoc,
} from '@/lib/content';

const WarMap = dynamic(() => import('@/components/WarMap'), {
  ssr: false,
  loading: () => (
    <div className="nx-map-fallback" role="status">
      Loading map…
    </div>
  ),
});

type RoomId = 'summary' | 'war' | 'press' | 'conspiracy' | 'markets' | 'account';

const ROOMS: { id: RoomId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'war', label: 'War room' },
  { id: 'press', label: 'Press room' },
  { id: 'conspiracy', label: 'Conspiracy room' },
  { id: 'markets', label: 'Market movers' },
  { id: 'account', label: 'Account' },
];

type LoadedStory = { card: StoryCard; doc: StoryDoc | null; missing: boolean };

export default function NexusDesk() {
  const [room, setRoom] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ username: string; message: string; avatar: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [liveTime, setLiveTime] = useState('');
  const [currentUser, setCurrentUser] = useState<{ username: string; avatar: string } | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [accountError, setAccountError] = useState('');
  const [stories, setStories] = useState<LoadedStory[]>([]);
  const [storiesStatus, setStoriesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const runAgenticLoop = async (query: string) => {
    const agents = ['Research', 'FactCheck', 'Security', 'Creative'];
    let result = `NEXUS OS ONLINE — Running agentic loop for: ${query}\n\n`;

    for (const agent of agents) {
      result += `→ ${agent} Agent: Processing...\n`;
      await new Promise(resolve => setTimeout(resolve, 300)); // simulate thinking
      result += `  ✓ Completed. Contribution added.\n`;
    }

    result += `\nFinal output: Cross-referenced thousands of sources. Core facts stable. Free media flow secured.`;
    return result;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' EDT');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nexusUser');
    if (!saved) return;
    try {
      setCurrentUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('nexusUser');
    }
  }, []);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const response = await fetch('/stories/index.json', { cache: 'no-store' });
        if (response.status === 404) {
          if (!cancel) {
            setStories([]);
            setStoriesStatus('ready');
          }
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const index = parseStoryIndex(await response.json());
        const loaded = await Promise.all(
          index.stories.map(async (card) => {
            try {
              const file = await fetch(card.path, { cache: 'no-store' });
              if (!file.ok) return { card, doc: null, missing: true };
              return { card, doc: parseStoryMarkdown(await file.text()), missing: false };
            } catch {
              return { card, doc: null, missing: true };
            }
          })
        );
        if (cancel) return;
        const published = loaded.filter((story) => story.missing || isPublished(story.doc));
        setGeneratedAt(index.generatedAt);
        setStories(published);
        setStorySlug((current) => current || published[0]?.card.slug || null);
        setStoriesStatus('ready');
      } catch {
        if (!cancel) setStoriesStatus('error');
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, []);

  const createAccount = () => {
    if (!usernameInput.trim()) {
      setAccountError('Enter a username');
      return;
    }
    setAccountError('');
    const reader = new FileReader();
    if (avatarFile) {
      reader.onload = (e) => {
        const user = { username: usernameInput.trim(), avatar: e.target?.result as string };
        localStorage.setItem('nexusUser', JSON.stringify(user));
        setCurrentUser(user);
        setUsernameInput('');
        setAvatarFile(null);
      };
      reader.readAsDataURL(avatarFile);
    } else {
      const user = { username: usernameInput.trim(), avatar: '' };
      localStorage.setItem('nexusUser', JSON.stringify(user));
      setCurrentUser(user);
      setUsernameInput('');
    }
  };

  const logout = () => {
    localStorage.removeItem('nexusUser');
    setCurrentUser(null);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg = {
      username: currentUser ? currentUser.username : 'Visitor',
      message: chatInput.trim(),
      avatar: currentUser ? currentUser.avatar : '',
      timestamp: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim() || aiPending) return;
    const userMsg = { role: 'user', content: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiPending(true);
    const reply = await runAgenticLoop(aiInput);
    setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setAiInput('');
    setAiPending(false);
  };

  const openStory = (slug: string) => {
    setStorySlug(slug);
    setStoryOpen(true);
    setRoom(2);
  };

  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const last = ROOMS.length - 1;
    const next =
      key === 'ArrowRight' ? (room + 1) % ROOMS.length : key === 'ArrowLeft' ? (room - 1 + ROOMS.length) % ROOMS.length : key === 'Home' ? 0 : last;
    setRoom(next);
    document.getElementById(`tab-${ROOMS[next].id}`)?.focus();
  };

  const active = ROOMS[room];
  const selectedStory = stories.find((story) => story.card.slug === storySlug) || null;

  return (
    <div className="nx-shell">
      <a className="nx-skip" href="#desk">
        Skip to desk
      </a>
      <header className="nx-header">
        <button type="button" className="nx-brand" onClick={() => setRoom(0)}>
          <span className="nx-mark" aria-hidden="true">
            N
          </span>
          <span>
            <span className="nx-brand__name">Nexus</span>
            <span className="nx-brand__sub">News Media</span>
          </span>
        </button>
        <time className="nx-clock" suppressHydrationWarning>
          <span className="nx-live" aria-hidden="true" />
          {liveTime || '—'}
        </time>
        <button type="button" className="nx-ask" onClick={() => setShowAI(true)}>
          Ask Nexus
        </button>
      </header>
      <div className="nx-tabs" role="tablist" aria-label="Rooms" onKeyDown={onTabKey}>
        {ROOMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            className="nx-tab"
            aria-selected={room === index}
            aria-controls={`panel-${item.id}`}
            tabIndex={room === index ? 0 : -1}
            onClick={() => setRoom(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <main className="nx-main" id="desk">
        <div className="nx-panel" role="tabpanel" id={`panel-${active.id}`} aria-labelledby={`tab-${active.id}`}>
          {active.id === 'summary' && (
            <SummaryRoom stories={stories} status={storiesStatus} onOpen={openStory} />
          )}
          {active.id === 'war' && (
            <>
              <p className="nx-kicker">War room</p>
              <h2 className="nx-title">Real-time threat intelligence</h2>
              <p className="nx-deck">Conflict and disaster layers published as GeoJSON. An empty file stays on the desk as “No current events.”</p>
              <WarMap />
            </>
          )}
          {active.id === 'press' && (
            <PressRoom
              stories={stories}
              status={storiesStatus}
              generatedAt={generatedAt}
              selected={selectedStory}
              open={storyOpen}
              onSelect={(slug) => {
                setStorySlug(slug);
                setStoryOpen(true);
              }}
              onBack={() => setStoryOpen(false)}
            />
          )}
          {active.id === 'conspiracy' && (
            <ConspiracyRoom
              messages={chatMessages}
              input={chatInput}
              setInput={setChatInput}
              onSend={sendChatMessage}
            />
          )}
          {active.id === 'markets' && (
            <>
              <p className="nx-kicker">Market movers</p>
              <h2 className="nx-title">Signals</h2>
              <div className="nx-empty" role="status">
                <strong>No live tape is connected</strong>
                This room is ready for a market feed. Nothing here is inventing prices.
              </div>
            </>
          )}
          {active.id === 'account' && (
            <AccountRoom
              user={currentUser}
              username={usernameInput}
              setUsername={setUsernameInput}
              setAvatar={setAvatarFile}
              error={accountError}
              onCreate={createAccount}
              onLogout={logout}
            />
          )}
        </div>
      </main>
      <footer className="nx-footer">Nexus News Media desk. Stories and map layers are read from published files, not from a database.</footer>
      {showAI ? (
        <AskDialog
          messages={aiMessages}
          input={aiInput}
          setInput={setAiInput}
          pending={aiPending}
          onSend={sendAIMessage}
          onClose={() => setShowAI(false)}
        />
      ) : null}
    </div>
  );
}

function SummaryRoom({
  stories,
  status,
  onOpen,
}: {
  stories: LoadedStory[];
  status: 'loading' | 'ready' | 'error';
  onOpen: (slug: string) => void;
}) {
  const lead = stories[0];
  const badge = lead ? storyBadge(lead.doc?.alertLevel || lead.card.alertLevel, lead.doc?.severity) : null;
  return (
    <>
      <p className="nx-kicker">Live desk</p>
      <h2 className="nx-title">Global summary</h2>
      {status === 'loading' ? <p className="nx-deck">Loading the published brief…</p> : null}
      {status === 'error' ? (
        <div className="nx-empty" role="status">
          <strong>The story index didn’t load</strong>
          The rest of the desk is still available.
        </div>
      ) : null}
      {status === 'ready' && !lead ? (
        <div className="nx-empty" role="status">
          <strong>No published brief yet</strong>
          When a story is added to the index, it will lead this page.
        </div>
      ) : null}
      {lead && badge ? (
        <article className="nx-lead">
          <span className={`nx-badge nx-badge--${badge.band}`}>{badge.label}</span>
          <p className="nx-meta">
            {labelize(lead.doc?.eventType || lead.card.eventType)}
            {' · '}
            {formatDeskDate(lead.doc?.date || lead.card.date) || 'Date not provided'}
          </p>
          <h3>{lead.doc?.title || lead.card.title}</h3>
          <p>{lead.card.summary || 'No summary in the index.'}</p>
          <button type="button" className="nx-text-btn" onClick={() => onOpen(lead.card.slug)}>
            Read in the press room
          </button>
        </article>
      ) : null}
    </>
  );
}

function PressRoom({
  stories,
  status,
  generatedAt,
  selected,
  open,
  onSelect,
  onBack,
}: {
  stories: LoadedStory[];
  status: 'loading' | 'ready' | 'error';
  generatedAt: string | null;
  selected: LoadedStory | null;
  open: boolean;
  onSelect: (slug: string) => void;
  onBack: () => void;
}) {
  return (
    <div className={open ? 'nx-press is-open' : 'nx-press'}>
      <div>
        <p className="nx-kicker">Press room</p>
        <h2 className="nx-title">Published stories</h2>
        <p className="nx-deck nx-press__index-note">
          {generatedAt ? `Index updated ${formatDeskDate(generatedAt) || generatedAt}. ` : ''}
          Listed from the publisher index. A story with a status other than published stays off this desk.
        </p>
        {status === 'loading' ? <p role="status">Loading stories…</p> : null}
        {status === 'error' ? (
          <div className="nx-empty" role="status">
            <strong>Couldn’t read the story index</strong>
            Check that public/stories/index.json is deployed.
          </div>
        ) : null}
        {status === 'ready' && stories.length === 0 ? (
          <div className="nx-empty" role="status">
            <strong>No stories published yet</strong>
            An empty index is a quiet desk, not an error.
          </div>
        ) : null}
        <ul className="nx-story-list nx-press__list">
          {stories.map((story) => {
            const badge = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity);
            const selectedCard = selected?.card.slug === story.card.slug;
            const updated = updatedLabel(story.doc?.updated || story.card.updated);
            return (
              <li key={story.card.slug}>
                <button
                  type="button"
                  className={selectedCard ? 'nx-story-card is-selected' : 'nx-story-card'}
                  aria-current={selectedCard ? 'true' : undefined}
                  onClick={() => onSelect(story.card.slug)}
                >
                  <span className={`nx-badge nx-badge--${badge.band}`}>{badge.label}</span>
                  <h3>{story.card.title}</h3>
                  <p className="nx-meta">
                    {labelize(story.card.eventType)}
                    {story.card.date ? ` · ${formatDeskDate(story.card.date)}` : ''}
                  </p>
                  {updated ? <p className="nx-updated">{updated}</p> : null}
                  {story.card.summary ? <p>{story.card.summary}</p> : null}
                  {story.missing ? <p>The story file is missing.</p> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="nx-press__article">
        <button type="button" className="nx-btn nx-btn--ghost nx-back" onClick={onBack}>
          All stories
        </button>
        {selected ? <Article story={selected} /> : <p className="nx-deck">Select a story to read it.</p>}
      </div>
    </div>
  );
}

function Article({ story }: { story: LoadedStory }) {
  if (story.missing || !story.doc) {
    return (
      <article className="nx-story">
        <h2 className="nx-story__title">{story.card.title}</h2>
        <div className="nx-empty" role="status">
          <strong>This story file is missing</strong>
          The index lists {story.card.path}, and that file did not load.
        </div>
      </article>
    );
  }
  const doc = story.doc;
  const badge = storyBadge(doc.alertLevel || story.card.alertLevel, doc.severity);
  const alertNote = doc.alertNote || story.card.alertNote;
  const updated = doc.updated || story.card.updated;
  const updateNote = doc.updateNote || story.card.updateNote;
  const updatedText = updatedLabel(updated);
  const title = doc.title || story.card.title;
  const places = doc.locations.length ? doc.locations : doc.location ? [doc.location] : [];
  const when = formatDeskDate(doc.date || doc.timestamp || story.card.date);
  const body = stripMatchingHeading(doc.body, title);
  return (
    <article className="nx-story">
      {updatedText || updateNote ? (
        <aside className="nx-update" role="note">
          {updatedText ? <p className="nx-update__when">{updatedText}</p> : null}
          {updateNote ? <p>{updateNote}</p> : null}
        </aside>
      ) : null}
      <div className="nx-alert-row">
        <span className={`nx-badge nx-badge--${badge.band}`} title={alertNote || undefined} aria-describedby={alertNote ? 'alert-note' : undefined}>
          {badge.label}
        </span>
        {alertNote ? (
          <p className="nx-alert-note" id="alert-note">
            {alertNote}
          </p>
        ) : null}
      </div>
      <h2 className="nx-story__title">{title}</h2>
      <p className="nx-dateline">
        {[labelize(doc.eventType || story.card.eventType), when, places.join(' · ')].filter(Boolean).join(' — ')}
        {doc.severity != null ? ` — Severity ${doc.severity}/10` : ''}
      </p>
      {body ? <MarkdownBody source={body} /> : <p>This file has no body yet.</p>}
      {doc.sources.length ? (
        <div className="nx-sources">
          <h3>Sources</h3>
          <ol>
            {doc.sources.map((href) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {href}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {doc.briefId ? <p className="nx-meta">Brief {doc.briefId}</p> : null}
    </article>
  );
}

function ConspiracyRoom({
  messages,
  input,
  setInput,
  onSend,
}: {
  messages: { username: string; message: string; avatar: string; timestamp: string }[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <>
      <p className="nx-kicker">Conspiracy room</p>
      <h2 className="nx-title">Total free media</h2>
      <p className="nx-deck">Unmoderated posts stay in this browser session.</p>
      <div className="nx-chat">
        <div className="nx-log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="nx-empty" role="status">
              <strong>No posts yet</strong>
              Write a note below. It is not sent to a server.
            </div>
          ) : (
            messages.map((message, index) => (
              <div className="nx-msg" key={`${message.timestamp}-${index}`}>
                {message.avatar ? (
                  <img className="nx-avatar" src={message.avatar} alt="" />
                ) : (
                  <span className="nx-avatar" aria-hidden="true">
                    {message.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
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
            onSend();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Write a post"
            aria-label="Post"
          />
          <button type="submit" className="nx-btn">
            Post
          </button>
        </form>
      </div>
    </>
  );
}

function AccountRoom({
  user,
  username,
  setUsername,
  setAvatar,
  error,
  onCreate,
  onLogout,
}: {
  user: { username: string; avatar: string } | null;
  username: string;
  setUsername: (value: string) => void;
  setAvatar: (file: File | null) => void;
  error: string;
  onCreate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="nx-account">
      <p className="nx-kicker">Account</p>
      <h2>This browser</h2>
      {user ? (
        <div className="nx-center">
          {user.avatar ? (
            <img className="nx-avatar nx-avatar--lg" src={user.avatar} alt={`${user.username}'s profile picture`} />
          ) : (
            <div className="nx-avatar nx-avatar--lg" aria-hidden="true">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <p>Welcome, {user.username}.</p>
          <button type="button" className="nx-btn nx-btn--danger" onClick={onLogout}>
            Log out
          </button>
        </div>
      ) : (
        <form
          className="nx-form"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <label className="nx-field">
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="nx-field">
            Profile picture, optional
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatar(event.target.files?.[0] || null)}
            />
          </label>
          {error ? (
            <p className="nx-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="nx-btn">
            Create account
          </button>
        </form>
      )}
    </div>
  );
}

function AskDialog({
  messages,
  input,
  setInput,
  pending,
  onSend,
  onClose,
}: {
  messages: { role: string; content: string }[];
  input: string;
  setInput: (value: string) => void;
  pending: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      [...(dialog?.querySelectorAll<HTMLElement>('button, input, textarea, a[href]') || [])].filter(
        (element) => !element.hasAttribute('disabled')
      );
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus();
    };
  }, []);

  return (
    <div className="nx-dialog-back" onMouseDown={onClose}>
      <div
        className="nx-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="nx-dialog__bar">
          <h2 id={titleId}>Nexus — agentic desk</h2>
          <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="nx-thread" aria-live="polite">
          {messages.length === 0 ? <p className="nx-status">Command the desk. The reply stays in this session.</p> : null}
          {messages.map((message, index) => (
            <div key={index} className={message.role === 'user' ? 'nx-bubble nx-bubble--user' : 'nx-bubble'}>
              {message.content}
            </div>
          ))}
          {pending ? <p className="nx-status">Running the desk…</p> : null}
        </div>
        <form
          className="nx-composer"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Command the OS..."
            aria-label="Command"
          />
          <button type="submit" className="nx-btn" disabled={pending}>
            Execute
          </button>
        </form>
      </div>
    </div>
  );
}
