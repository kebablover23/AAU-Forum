function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return `${formattedDate}, ${time}`;
}

function exposeSessionUser(req, res, next) {
  req.user = req.session.user || null;
  res.locals.currentUser = req.user;
  const counts = req.app.get('notificationCounts');
  const notifications = req.app.get('notifications');
  const userId = req.user?._id?.toString();
  res.locals.notificationCount = userId ? (counts.get(userId) ?? req.session.notificationCount ?? 0) : 0;
  res.locals.notifications = userId ? (notifications.get(userId) || []) : [];
  res.locals.formatDate = formatDate;
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).render('login', { error: 'You must be logged in.' });
  req.user = req.session.user;
  next();
}

module.exports = { exposeSessionUser, requireLogin, formatDate };