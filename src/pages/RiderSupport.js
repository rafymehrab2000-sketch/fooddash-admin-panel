import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import SupportAssignBar from '../components/SupportAssignBar';
import API from '../services/api';

const REFRESH_INTERVAL = 10000;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function RiderSupport() {
  const [threads, setThreads] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endedRiders, setEndedRiders] = useState({});
  const [sessionStarts, setSessionStarts] = useState({});
  const messagesEndRef = useRef(null);

  const isEnded = !!endedRiders[selectedRiderId];
  const sessionStart = sessionStarts[selectedRiderId] || 0;
  const visibleMessages = messages.filter(
    msg => new Date(msg.createdAt).getTime() >= sessionStart
  );

  const fetchThreads = useCallback(async () => {
    try {
      const response = await API.get('/rider-support/threads');
      setThreads(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load threads');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  const fetchMessages = useCallback(async (riderId) => {
    if (!riderId) return;
    try {
      const response = await API.get(`/rider-support/threads/${riderId}/messages`);
      setMessages(response.data);
    } catch (err) {
      setError('Failed to load conversation');
    }
  }, []);

  useEffect(() => {
    if (!selectedRiderId) return;
    fetchMessages(selectedRiderId);
    const interval = setInterval(() => fetchMessages(selectedRiderId), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedRiderId, fetchMessages]);

  const selectedThread = threads.find(t => t.rider.id === selectedRiderId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSelectRider = (riderId) => {
    setSelectedRiderId(riderId);
    setThreads(prev => prev.map(t => t.riderId === riderId ? { ...t, unreadByAdmin: 0 } : t));
  };

  const handleSend = async () => {
    if (isEnded) return;
    const message = replyText.trim();
    if (!message || !selectedRiderId) return;

    try {
      await API.post(`/rider-support/threads/${selectedRiderId}/messages`, { message });
      setReplyText('');
      fetchMessages(selectedRiderId);
      fetchThreads();
    } catch (err) {
      setError('Failed to send reply');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndConversation = () => {
    if (!selectedRiderId) return;
    if (window.confirm('Are you sure you want to end this conversation?')) {
      setEndedRiders(prev => ({ ...prev, [selectedRiderId]: true }));
    }
  };

  const handleStartNewChat = () => {
    if (!selectedRiderId) return;
    setSessionStarts(prev => ({ ...prev, [selectedRiderId]: Date.now() }));
    setEndedRiders(prev => ({ ...prev, [selectedRiderId]: false }));
    setReplyText('');
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>🛵 Rider Support</h1>
            <p style={styles.subtitle}>
              {threads.length} rider conversation{threads.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.chatWrapper}>
          {/* Left: rider list */}
          <div style={styles.riderList}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : threads.length === 0 ? (
              <div style={styles.empty}>No conversations yet.</div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.riderId}
                  style={
                    selectedRiderId === thread.rider.id
                      ? styles.riderItemActive
                      : styles.riderItem
                  }
                  onClick={() => handleSelectRider(thread.rider.id)}
                >
                  <div style={styles.riderRow}>
                    <span style={styles.riderName}>{thread.rider.name}</span>
                    {thread.unreadByAdmin > 0 && (
                      <span style={styles.unreadBadge}>{thread.unreadByAdmin}</span>
                    )}
                  </div>
                  <div style={styles.lastMessage}>{thread.lastMessage}</div>
                  <div style={styles.timestamp}>{timeAgo(thread.lastMessageAt)}</div>
                </div>
              ))
            )}
          </div>

          {/* Right: chat thread */}
          <div style={styles.chatPanel}>
            {!selectedThread ? (
              <div style={styles.noSelection}>Select a rider to view the conversation</div>
            ) : (
              <>
                <div style={styles.chatHeader}>
                  <div>
                    <strong>{selectedThread.rider.name}</strong>
                    {selectedThread.rider.phone && (
                      <span style={styles.chatHeaderSub}> · {selectedThread.rider.phone}</span>
                    )}
                  </div>
                  <div style={styles.headerRight}>
                    <SupportAssignBar
                      channel="rider"
                      targetId={selectedThread.rider.id}
                      status={selectedThread.status}
                      assignedToId={selectedThread.assignedToId}
                      assignedToName={selectedThread.assignedToName}
                      onChanged={fetchThreads}
                    />
                    <button
                      style={styles.endBtn}
                      onClick={isEnded ? handleStartNewChat : handleEndConversation}
                    >
                      {isEnded ? 'Start New Chat' : 'End Conversation'}
                    </button>
                  </div>
                </div>
                <div style={styles.messageList}>
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageRow,
                        justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={
                          msg.senderType === 'admin'
                            ? styles.bubbleAdmin
                            : styles.bubbleRider
                        }
                      >
                        <div>{msg.message}</div>
                        <div
                          style={{
                            ...styles.bubbleTime,
                            color: msg.senderType === 'admin' ? 'rgba(255,255,255,0.8)' : '#888',
                          }}
                        >
                          {timeAgo(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEnded && <p style={styles.endedNotice}>Conversation ended</p>}
                  <div ref={messagesEndRef} />
                </div>
                <div style={styles.replyRow}>
                  <input
                    style={styles.replyInput}
                    type="text"
                    placeholder={isEnded ? 'Conversation ended' : 'Type a reply...'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isEnded}
                  />
                  <button
                    style={styles.sendButton}
                    onClick={handleSend}
                    disabled={isEnded || !replyText.trim()}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' },
  main: { marginLeft: '240px', padding: '40px', flex: 1, display: 'flex', flexDirection: 'column' },
  titleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  subtitle: { color: '#888', marginTop: '4px', marginBottom: '20px' },
  error: {
    backgroundColor: '#ffe0e0', color: '#cc0000', padding: '12px',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
  },
  chatWrapper: {
    display: 'flex', flex: 1, backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
    minHeight: '600px',
  },
  riderList: {
    width: '300px', borderRight: '1px solid #eee', overflowY: 'auto',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: { textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' },
  riderItem: {
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
  },
  riderItemActive: {
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
    backgroundColor: '#fff3ec',
  },
  riderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  riderName: { fontWeight: '600', fontSize: '14px', color: '#1a1a1a' },
  unreadBadge: {
    backgroundColor: '#ff6b35', color: '#fff', fontSize: '11px', fontWeight: '700',
    borderRadius: '10px', padding: '2px 7px', minWidth: '18px', textAlign: 'center',
  },
  lastMessage: {
    fontSize: '13px', color: '#888', marginTop: '4px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  timestamp: { fontSize: '11px', color: '#bbb', marginTop: '4px' },
  chatPanel: { flex: 1, display: 'flex', flexDirection: 'column' },
  noSelection: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#888', fontSize: '14px',
  },
  chatHeader: {
    padding: '16px 20px', borderBottom: '1px solid #eee', fontSize: '15px', color: '#1a1a1a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
  },
  chatHeaderSub: { color: '#888', fontWeight: 400, fontSize: '13px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  endBtn: {
    padding: '6px 14px', borderRadius: '14px', border: '1px solid #ddd',
    backgroundColor: '#fff', color: '#1a1a1a', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  endedNotice: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '8px 0 0' },
  messageList: {
    flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  messageRow: { display: 'flex' },
  bubbleAdmin: {
    backgroundColor: '#ff6b35', color: '#fff', padding: '10px 14px',
    borderRadius: '14px 14px 2px 14px', maxWidth: '60%', fontSize: '14px',
  },
  bubbleRider: {
    backgroundColor: '#eee', color: '#1a1a1a', padding: '10px 14px',
    borderRadius: '14px 14px 14px 2px', maxWidth: '60%', fontSize: '14px',
  },
  bubbleTime: { fontSize: '10px', marginTop: '4px', textAlign: 'right' },
  replyRow: {
    display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid #eee',
  },
  replyInput: {
    flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #ddd',
    fontSize: '14px', outline: 'none',
  },
  sendButton: {
    padding: '10px 20px', borderRadius: '20px', border: 'none',
    backgroundColor: '#ff6b35', color: '#fff', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
};

export default RiderSupport;
