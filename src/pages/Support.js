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

function Support() {
  const [threads, setThreads] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await API.get('/messages');
      setThreads(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load messages');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const selectedThread = threads.find(t => t.customer.id === selectedCustomerId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages?.length]);

  const markAsRead = async (thread) => {
    const unread = thread.messages.filter(m => m.senderRole === 'customer' && !m.isRead);
    for (const msg of unread) {
      try {
        await API.put(`/messages/${msg.id}/read`);
      } catch (err) {
        // ignore — will retry on next refresh
      }
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    const thread = threads.find(t => t.customer.id === customerId);
    if (thread) markAsRead(thread);
  };

  const handleSend = async () => {
    const content = replyText.trim();
    if (!content || !selectedCustomerId) return;

    try {
      await API.post('/messages', {
        content,
        customerId: selectedCustomerId,
      });
      setReplyText('');
      fetchMessages();
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

  return (
    <div style={styles.container}>
      <Sidebar />
      <div className="admin-main" style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>💬 Support</h1>
            <p style={styles.subtitle}>
              {threads.length} customer conversation{threads.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.chatWrapper}>
          {/* Left: customer list */}
          <div style={styles.customerList}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : threads.length === 0 ? (
              <div style={styles.empty}>No conversations yet.</div>
            ) : (
              threads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];
                return (
                  <div
                    key={thread.customer.id}
                    style={
                      selectedCustomerId === thread.customer.id
                        ? styles.customerItemActive
                        : styles.customerItem
                    }
                    onClick={() => handleSelectCustomer(thread.customer.id)}
                  >
                    <div style={styles.customerRow}>
                      <span style={styles.customerName}>{thread.customer.name}</span>
                      {thread.unreadCount > 0 && (
                        <span style={styles.unreadBadge}>{thread.unreadCount}</span>
                      )}
                    </div>
                    <div style={styles.lastMessage}>{lastMessage?.content}</div>
                    <div style={styles.timestamp}>{timeAgo(lastMessage?.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: chat thread */}
          <div style={styles.chatPanel}>
            {!selectedThread ? (
              <div style={styles.noSelection}>Select a customer to view the conversation</div>
            ) : (
              <>
                <div style={styles.chatHeader}>
                  <strong>{selectedThread.customer.name}</strong>
                  <SupportAssignBar
                    channel="customer"
                    targetId={selectedThread.customer.id}
                    status={selectedThread.status}
                    assignedToId={selectedThread.assignedToId}
                    assignedToName={selectedThread.assignedToName}
                    onChanged={fetchMessages}
                  />
                </div>
                <div style={styles.messageList}>
                  {selectedThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageRow,
                        justifyContent: msg.senderRole === 'admin' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={
                          msg.senderRole === 'admin'
                            ? styles.bubbleAdmin
                            : styles.bubbleCustomer
                        }
                      >
                        <div>{msg.content}</div>
                        <div
                          style={{
                            ...styles.bubbleTime,
                            color: msg.senderRole === 'admin' ? 'rgba(255,255,255,0.8)' : '#888',
                          }}
                        >
                          {timeAgo(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div style={styles.replyRow}>
                  <input
                    style={styles.replyInput}
                    type="text"
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    style={styles.sendButton}
                    onClick={handleSend}
                    disabled={!replyText.trim()}
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
  customerList: {
    width: '300px', borderRight: '1px solid #eee', overflowY: 'auto',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  empty: { textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' },
  customerItem: {
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
  },
  customerItemActive: {
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
    backgroundColor: '#fff3ec',
  },
  customerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontWeight: '600', fontSize: '14px', color: '#1a1a1a' },
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
  messageList: {
    flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  messageRow: { display: 'flex' },
  bubbleAdmin: {
    backgroundColor: '#ff6b35', color: '#fff', padding: '10px 14px',
    borderRadius: '14px 14px 2px 14px', maxWidth: '60%', fontSize: '14px',
  },
  bubbleCustomer: {
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

export default Support;
