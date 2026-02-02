import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  connectInboxPendingRequests,
  connectInboxSentRequests,
  connectInboxConnections,
  connectMockProfiles,
  type ConnectInboxRequest,
  type ConnectInboxConnection,
} from '../lib/connectMockData';

type InboxTab = 'pending' | 'sent' | 'connections';

const tabs: { id: InboxTab; label: string }[] = [
  { id: 'pending', label: 'Pending requests' },
  { id: 'sent', label: 'Sent requests' },
  { id: 'connections', label: 'Connections' },
];

export const NetworkInbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InboxTab>('pending');
  const [pendingRequests, setPendingRequests] = useState(connectInboxPendingRequests);
  const [connections, setConnections] = useState(connectInboxConnections);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAccept = (request: ConnectInboxRequest) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    setConnections((prev) => [
      ...prev,
      {
        id: `conn-${request.id}`,
        user: request.fromUser,
        connectedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const handleDecline = (request: ConnectInboxRequest) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
  };

  const getToUser = (toUserId: string) =>
    connectMockProfiles.find((p) => p.id === toUserId);

  const inputClass =
    'font-sans text-sm text-white bg-velocity-black/60 border border-white/10 px-4 py-2 focus:outline-none focus:border-velocity-red/50 transition-colors';
  const cardClass =
    'border border-white/10 bg-velocity-black/40 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4';

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/connect"
          className="inline-flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Network
        </Link>

        <h1 className="font-sans font-bold text-2xl md:text-3xl text-white mb-2">
          Inbox
        </h1>
        <p className="font-sans text-sm text-zinc-500 uppercase tracking-widest mb-8">
          Manage requests and connections
        </p>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`font-sans text-sm uppercase tracking-widest px-4 py-3 border-b-2 -mb-px transition-colors focus:outline-none ${
                activeTab === tab.id
                  ? 'border-velocity-red text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {pendingRequests.length === 0 ? (
                <p className="font-sans text-sm text-zinc-500 py-8">
                  No pending requests.
                </p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className={cardClass}>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/connect/profile/${request.fromUser.id}`}
                        className="font-sans font-bold text-white hover:text-velocity-red transition-colors"
                      >
                        {request.fromUser.fullName}
                      </Link>
                      <p className="font-sans text-xs text-zinc-500 mt-0.5">
                        {request.fromUser.headline}
                      </p>
                      <p className="font-sans text-sm text-zinc-400 mt-3">
                        {request.message}
                      </p>
                      <p className="font-sans text-xs text-zinc-600 mt-2">
                        {request.createdAt}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAccept(request)}
                        className={inputClass + ' border-velocity-red/50 text-velocity-red hover:bg-velocity-red/10'}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(request)}
                        className={inputClass + ' text-zinc-400 hover:text-white hover:border-white/30'}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {connectInboxSentRequests.length === 0 ? (
                <p className="font-sans text-sm text-zinc-500 py-8">
                  No sent requests.
                </p>
              ) : (
                connectInboxSentRequests.map((request) => {
                  const toUser = getToUser(request.toUserId);
                  return (
                    <div key={request.id} className={cardClass}>
                      <div className="flex-1 min-w-0">
                        <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                          To
                        </span>
                        <Link
                          to={`/connect/profile/${request.toUserId}`}
                          className="block font-sans font-bold text-white hover:text-velocity-red transition-colors mt-1"
                        >
                          {toUser?.fullName ?? 'Unknown'}
                        </Link>
                        <p className="font-sans text-xs text-zinc-500">
                          {toUser?.headline ?? ''}
                        </p>
                        <p className="font-sans text-sm text-zinc-400 mt-3">
                          {request.message}
                        </p>
                        <p className="font-sans text-xs text-zinc-600 mt-2">
                          {request.createdAt}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-sans text-xs uppercase tracking-widest px-3 py-1.5 border ${
                          request.status === 'accepted'
                            ? 'border-velocity-red/50 text-velocity-red bg-velocity-darkRed/20'
                            : request.status === 'declined'
                              ? 'border-white/20 text-zinc-500'
                              : 'border-white/30 text-zinc-400'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'connections' && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {connections.length === 0 ? (
                <p className="font-sans text-sm text-zinc-500 py-8">
                  No connections yet.
                </p>
              ) : (
                connections.map((conn) => (
                  <div key={conn.id} className={cardClass}>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/connect/profile/${conn.user.id}`}
                        className="font-sans font-bold text-white hover:text-velocity-red transition-colors"
                      >
                        {conn.user.fullName}
                      </Link>
                      <p className="font-sans text-xs text-zinc-500 mt-0.5">
                        {conn.user.headline}
                      </p>
                      <p className="font-sans text-xs text-zinc-600 mt-2">
                        Connected {conn.connectedAt}
                      </p>
                    </div>
                    <Link
                      to={`/connect/profile/${conn.user.id}`}
                      className={`shrink-0 ${inputClass} border-velocity-red/50 text-velocity-red hover:bg-velocity-red/10 text-center`}
                    >
                      View profile
                    </Link>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
