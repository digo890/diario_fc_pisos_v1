import React, { useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  type: 'form_submitted' | 'form_signed';
  obra_id: string; // ✅ CORREÇÃO: Padronizado para snake_case
  obraNome: string;
  userName: string;
  timestamp: number;
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  notifications,
  onClose,
  onNotificationClick,
  onMarkAsRead
}) => {
  // Fechar drawer ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Bloquear scroll do body quando drawer está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    onNotificationClick(notification);
  };

  const getNotificationMessage = (notification: Notification): string => {
    if (notification.type === 'form_submitted') {
      return `${notification.userName} respondeu o formulário da obra ${notification.obraNome}`;
    } else {
      return `${notification.userName} assinou o formulário da obra ${notification.obraNome}`;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notificações
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                aria-label="Fechar notificações"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Sem notificações no momento
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        !notification.read ? 'bg-[#FD5521]/5 dark:bg-[#FD5521]/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'form_submitted'
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            notification.type === 'form_submitted'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 ${
                            !notification.read
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'font-normal text-gray-700 dark:text-gray-300'
                          }`}>
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#FD5521] mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;