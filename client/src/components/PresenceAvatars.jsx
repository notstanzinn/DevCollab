const PresenceAvatars = ({ users = [] }) => {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wide bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full">
        <span className="live-dot" /> LIVE
      </span>

      <div className="flex flex-row-reverse">
        {users.slice(0, 5).map((u, i) => (
          <div key={u.socketId} className="-ml-2 first:ml-0 border-2 border-[#131720] rounded-full hover:-translate-y-1 transition-transform" style={{ zIndex: 10 - i }} title={u.name}>
            {u.avatar
              ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt={u.name} />
              : <div className="w-7 h-7 rounded-full gradient-brand-bg flex items-center justify-center text-white text-[10px] font-bold">{u.name?.[0] || '?'}</div>
            }
          </div>
        ))}
        {users.length > 5 && (
          <div className="-ml-2 w-7 h-7 rounded-full bg-[#1a2030] border-2 border-[#131720] flex items-center justify-center text-[10px] font-bold text-[#94a3b8]">
            +{users.length - 5}
          </div>
        )}
      </div>

      <span className="text-xs text-[#475569]">{users.length} editing</span>
    </div>
  );
};

export default PresenceAvatars;
