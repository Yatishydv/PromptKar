import React, { useState, useEffect, useRef } from "react";
import { Bell, Heart, Bookmark, Zap, User, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import useSWR from "swr";
import { socket } from "@/lib/socket";
import { toast } from "react-hot-toast";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case "like": return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
    case "save": return <Bookmark className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />;
    case "follow": return <User className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />;
    case "comment": return <Zap className="w-3.5 h-3.5 text-yellow-500" />;
    default: return <Bell className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function notifMessage(n: any): React.ReactNode {
  return (
    <span>
      <span className="font-black text-slate-900">{n.senderName}</span>
      {n.type === "like" && <> liked your prompt <span className="text-indigo-600">"{n.targetTitle}"</span></>}
      {n.type === "save" && <> saved your prompt <span className="text-indigo-600">"{n.targetTitle}"</span></>}
      {n.type === "follow" && <> started following you</>}
      {n.type === "comment" && <> commented on <span className="text-indigo-600">"{n.targetTitle}"</span></>}
    </span>
  );
}

export const NotificationDropdown = () => {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [], mutate } = useSWR(
    user ? `/api/notifications?userId=${user.uid}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit("join", user.uid);

      socket.on("new-notification", (newNotif: any) => {
        mutate((prev: any) => [newNotif, ...(prev || [])], false);
        toast.success(`New ${newNotif.type} notification!`);
      });

      return () => {
        socket.off("new-notification");
        socket.disconnect();
      };
    }
  }, [user, mutate]);

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/notifications?userId=${user.uid}&notificationId=${id}`, { method: 'PATCH' });
      mutate();
    } catch { }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await fetch(`/api/notifications?userId=${user.uid}`, { method: 'PATCH' });
      mutate();
    } catch { }
  };

  const getNotifLink = (n: any) => {
    if (n.type === "follow") return `/profile/${n.senderName}`;
    if (n.targetId) return `/prompt/${n.targetId}`;
    return "#";
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setShowDropdown(o => !o)}
        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all text-slate-400 relative border border-transparent hover:border-slate-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {!Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    When someone likes or follows you, it'll show here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((n: any) => (
                <Link
                  key={n._id}
                  href={getNotifLink(n)}
                  onClick={() => { markAsRead(n._id); setShowDropdown(false); }}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all ${!n.isRead ? "bg-indigo-50/40" : ""
                    }`}
                >
                  <div className="relative shrink-0">
                    <AuthorAvatar
                      name={n.senderName}
                      username={n.senderUsername || n.senderName}
                      avatar={n.senderAvatar}
                      className="w-10 h-10"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-sm">
                      <NotifIcon type={n.type} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-[12.5px] text-slate-600 leading-snug">
                      {notifMessage(n)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {!n.isRead && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full shrink-0 mt-1" />
                  )}
                </Link>
              ))
            )}
          </div>

          {Array.isArray(notifications) && notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
              <p className="text-[11px] text-slate-400 font-medium text-center">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
