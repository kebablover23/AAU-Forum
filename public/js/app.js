(() => {
  const body = document.body;
  const savedTheme = localStorage.getItem('aau-forum-theme');
  if (savedTheme === 'dark') body.classList.add('dark-mode');

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('aau-forum-theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  const socket = typeof io === 'function' ? io() : null;
  const countBadge = document.querySelector('[data-notification-count]');
  const sound = () => window.playDing?.();
  const formatDate = value => { const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); return `${formattedDate}, ${time}`; };
  const updateBadge = count => {
    if (!countBadge) return;
    countBadge.textContent = count || '';
    countBadge.classList.toggle('hidden', !count);
  };

  const dropdown = document.querySelector('[data-notification-dropdown]');
  const list = document.querySelector('[data-notification-list]');
  const renderNotifications = notifications => { if (!list) return; list.innerHTML = notifications.length ? notifications.map(item => `<a class="notification-item" href="${item.link || '#'}" data-notification-id="${item.id}"><span>${item.text}</span><small>${formatDate(item.createdAt)}</small></a>`).join('') : '<p class="muted notification-empty">No notifications</p>'; };
  document.querySelector('[data-notifications]')?.addEventListener('click', event => { const open = dropdown?.classList.toggle('hidden') === false; event.currentTarget.setAttribute('aria-expanded', String(open)); });
  document.querySelector('[data-clear-notifications]')?.addEventListener('click', () => { renderNotifications([]); updateBadge(0); socket?.emit('notifications:clear'); });
  list?.addEventListener('click', event => { const item = event.target.closest('[data-notification-id]'); if (item) socket?.emit('notifications:remove', item.dataset.notificationId); });

  const appendMessage = payload => {
    const container = document.querySelector('#chatMessages');
    if (!container || payload.conversationId !== container.dataset.conversationId) return;
    const message = payload.message;
    const row = document.createElement('div');
    row.className = `message ${String(message.sender._id) === container.dataset.userId ? 'sent' : 'received'}`;
    row.innerHTML = `<div class="message-bubble"><span class="message-text"></span></div>`;
    row.querySelector('.message-text').textContent = message.text;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  };

  const appendComment = payload => {
    const commentsSection = document.querySelector(`[data-comments="${payload.itemId}"]`);
    const comments = commentsSection?.querySelector('.comment-list');
    if (!comments) return;
    const comment = payload.comment;
    const card = document.createElement('article');
    card.className = 'comment-card';
    card.dataset.commentId = comment._id;
    card.innerHTML = `<a href="/profile/${comment.user._id}"><img class="avatar" src="${comment.user.profilePic || '/images/default.png'}" alt=""></a><div class="comment-body"><div class="comment-meta"><a href="/profile/${comment.user._id}"><strong></strong></a><small>${formatDate(comment.createdAt)}</small></div><p></p></div>`;
    card.querySelector('strong').textContent = comment.user.username;
    card.querySelector('p').textContent = comment.text;
    comments.querySelector('[data-empty-comments]')?.remove();
    comments.appendChild(card);
  };

  socket?.on('notifications:init', payload => { renderNotifications(payload.notifications || []); updateBadge(payload.count); });
  socket?.on('notification:new', payload => { const current = list?.querySelectorAll('[data-notification-id]').length || 0; if (list) { const empty = list.querySelector('.notification-empty'); empty?.remove(); list.insertAdjacentHTML('afterbegin', `<a class="notification-item" href="${payload.link || '#'}" data-notification-id="${payload.id}"><span>${payload.text}</span><small>${formatDate(payload.createdAt)}</small></a>`); } updateBadge(payload.count || current + 1); sound(); });
  socket?.on('notification:count', payload => updateBadge(payload.count));
  socket?.on('message:new', payload => {
    appendMessage(payload);
    if (payload.message.sender?._id && payload.message.sender._id !== document.body.dataset.userId) sound();
  });
  socket?.on('comment:new', payload => {
    appendComment(payload);
    sound();
  });
  socket?.on('poll:update', payload => {
    document.querySelector(`[data-poll="${payload.id}"] [data-total-votes]`)?.replaceChildren(`${payload.total} votes`);
    payload.answers.forEach(answer => {
      document.querySelector(`[data-answer="${answer.id}"] [data-vote-count]`)?.replaceChildren(answer.count);
    });
  });
  socket?.on('event:attendance', payload => {
    document.querySelector(`[data-event="${payload.id}"] [data-attendee-count]`)?.replaceChildren(payload.count);
  });

  const roomId = document.body.dataset.roomId;
  const roomType = document.body.dataset.roomType;
  if (socket && roomId && roomType) socket.emit(`${roomType}:join`, roomId);
  if (socket) {
    document.querySelectorAll('[data-poll]').forEach(element => socket.emit('poll:join', element.dataset.poll));
    document.querySelectorAll('[data-event]').forEach(element => socket.emit('event:join', element.dataset.event));
  }
})();
