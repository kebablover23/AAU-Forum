const mongoose = require('mongoose');
const { tPost, dbUser, Conversation, Event, Poll } = require('../models/noteModel');

function tagsFrom(value) {
  return value ? value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];
}

function wantsJson(req) {
  return req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
}

function sendResult(req, res, payload, redirect) {
  if (wantsJson(req)) return res.json(payload);
  return res.redirect(redirect);
}

function addNotification(req, io, userId, notification) {
  if (!userId || userId.toString() === req.session.user?._id?.toString()) return;
  const recipientId = userId.toString();
  const notifications = req.app.get('notifications');
  const list = notifications.get(recipientId) || [];
  const item = { id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), ...notification };
  notifications.set(recipientId, [item, ...list].slice(0, 20));
  req.app.get('notificationCounts').set(recipientId, notifications.get(recipientId).length);
  io.to(`user:${recipientId}`).emit('notification:new', { ...item, count: notifications.get(recipientId).length });
}

function emitCount(io, room, event, id, count) {
  io.to(room).emit(event, { id: id.toString(), count });
}

async function loadPosts() {
  return tPost.find().sort({ createdAt: -1 }).populate('userId').populate('comments.user');
}

async function loadEvents() {
  return Event.find().populate('userId').populate('attending').populate('comments.user').sort({ dateFor: 1 });
}

async function loadPolls() {
  return Poll.find().populate('userId').populate('answers.answered').sort({ dateFor: -1 });
}

exports.showLogin = (req, res) => res.render('login', { error: null });
exports.showRegister = (req, res) => res.render('createAcc', { error: null, form: {} });
exports.showCreatePost = (req, res) => res.render('createTPost', { error: null });
exports.showCreateEvent = (req, res) => res.render('createEvent', { error: null });
exports.showCreatePoll = (req, res) => res.render('createPoll', { error: null });

exports.getHome = async (req, res) => {
  try {
    res.render('index', { posts: await loadPosts() });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load posts.' });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = (await loadPosts()).filter(post => post.userId?._id.toString() === req.session.user._id.toString());
    res.render('MyPosts', { posts });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load your posts.' });
  }
};

exports.getSinglePost = async (req, res) => {
  try {
    const post = await tPost.findById(req.params.id).populate('userId').populate('comments.user');
    if (!post) return res.redirect('/');
    res.render('post', { post });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load this post.' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    res.render('events', { events: await loadEvents() });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load events.' });
  }
};

exports.getSingleEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('userId').populate('attending').populate('comments.user');
    if (!event) return res.redirect('/Events');
    res.render('event', { event });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load this event.' });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const polls = await loadPolls();
    const now = new Date();
    res.render('Polls', {
      activePolls: polls.filter(poll => new Date(poll.dateFor) >= now),
      previousPolls: polls.filter(poll => new Date(poll.dateFor) < now).sort((a, b) => new Date(a.dateFor) - new Date(b.dateFor))
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load polls.' });
  }
};

exports.logIn = async (req, res) => {
  try {
    const Userid = String(req.body.Userid || '').trim();
    const user = await dbUser.findOne({ Userid });
    if (!user) return res.status(401).render('login', { error: 'UserID not found.', Userid });
    req.session.user = user;
    const userId = user._id.toString();
    const existingNotifications = req.app.get('notifications').get(userId) || [];
    req.session.notificationCount = existingNotifications.length;
    req.app.get('notificationCounts').set(userId, existingNotifications.length);
    res.redirect('/');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to log in.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const form = {
      Userid: String(req.body.Userid || '').trim(),
      username: String(req.body.username || '').trim(),
      semester: String(req.body.semester || '').trim(),
      bio: ''
    };
    if (!form.Userid || !form.username || !form.semester) {
      return res.status(400).render('createAcc', { error: 'UserID, username, and semester are required.', form });
    }
    if (await dbUser.exists({ Userid: form.Userid })) {
      return res.status(409).render('createAcc', { error: 'UserID already exists', form });
    }
    const user = await dbUser.create({ ...form, profilePic: req.file ? `/uploads/${req.file.filename}` : null });
    req.session.user = user;
    const userId = user._id.toString();
    const existingNotifications = req.app.get('notifications').get(userId) || [];
    req.session.notificationCount = existingNotifications.length;
    req.app.get('notificationCounts').set(userId, existingNotifications.length);
    res.redirect('/');
  } catch (error) {
    if (error.code === 11000) return res.status(409).render('createAcc', { error: 'UserID already exists', form: req.body });
    res.status(500).render('error', { error: 'Unable to create your account.' });
  }
};

exports.settingsPage = (req, res) => res.render('settings', { error: null, success: null });

exports.updateSettings = async (req, res) => {
  try {
    const update = {
      username: String(req.body.username || '').trim(),
      semester: String(req.body.semester || '').trim(),
      bio: String(req.body.bio || '').trim()
    };
    if (!update.username || !update.semester) return res.render('settings', { error: 'Name and role are required.', success: null });
    if (req.body.removeProfilePic === 'on') update.profilePic = null;
    else if (req.file) update.profilePic = `/uploads/${req.file.filename}`;
    const user = await dbUser.findByIdAndUpdate(req.session.user._id, update, { new: true, runValidators: true });
    req.session.user = user;
    res.render('settings', { error: null, success: 'Your settings have been updated.' });
  } catch (error) {
    res.status(500).render('settings', { error: 'Unable to update your settings.', success: null });
  }
};

exports.createTPost = async (req, res) => {
  try {
    const post = await tPost.create({ userId: req.session.user._id, title: req.body.title, description: req.body.description, tags: tagsFrom(req.body.tags) });
    sendResult(req, res, { ok: true, postId: post._id }, '/');
  } catch (error) {
    res.status(400).render('createTPost', { error: 'Please provide a title and description.' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    await Event.create({
      userId: req.session.user._id,
      picture: req.file ? `/uploads/${req.file.filename}` : null,
      title: req.body.title,
      description: req.body.description,
      tags: tagsFrom(req.body.tags),
      dateFor: req.body.dateFor,
      location: req.body.location,
      attending: []
    });
    res.redirect('/Events');
  } catch (error) {
    res.status(400).render('createEvent', { error: 'Please complete all event fields.' });
  }
};

exports.addPoll = async (req, res) => {
  try {
    const options = String(req.body.options || '').split(',').map(option => option.trim()).filter(Boolean);
    if (options.length < 2) return res.status(400).render('createPoll', { error: 'Add at least two poll options.' });
    await Poll.create({
      userId: req.session.user._id,
      title: req.body.title,
      description: req.body.description,
      tags: tagsFrom(req.body.tags),
      dateFor: req.body.dateFor,
      answers: options.map(answer => ({ answer, answered: [] }))
    });
    res.redirect('/Polls');
  } catch (error) {
    res.status(400).render('createPoll', { error: 'Please complete all poll fields.' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const user1 = req.session.user._id.toString();
    const user2 = String(req.body.user2 || '');
    if (!mongoose.isValidObjectId(user2) || user1 === user2) return res.redirect('/Messages');
    const existing = await Conversation.findOne({ participants: { $all: [user1, user2], $size: 2 } });
    if (existing) return res.redirect(`/Messages/${existing._id}`);
    const conversation = await Conversation.create({ participants: [user1, user2], messages: [] });
    res.redirect(`/Messages/${conversation._id}`);
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to start this conversation.' });
  }
};

async function conversationData(userId, conversationId) {
  const conversations = await Conversation.find({ participants: userId }).populate('participants').populate('messages.sender');
  conversations.forEach(conversation => conversation.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const conversation = conversationId ? await Conversation.findOne({ _id: conversationId, participants: userId }).populate('participants').populate('messages.sender') : null;
  return { conversations, conversation };
}

exports.messagesPage = async (req, res) => {
  try {
    const data = await conversationData(req.session.user._id);
    res.render('Messages', { users: await dbUser.find().sort({ username: 1 }), ...data, error: null });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load messages.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const data = await conversationData(req.session.user._id, req.params.conversationId);
    if (!data.conversation) return res.redirect('/Messages');
    res.render('Messages', { users: await dbUser.find().sort({ username: 1 }), ...data, error: null });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load this conversation.' });
  }
};

exports.sendMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.body.conversationId, participants: req.session.user._id });
    const text = String(req.body.text || '').trim();
    if (!conversation || !text) return sendResult(req, res, { ok: false }, '/Messages');
    conversation.messages.push({ sender: req.session.user._id, text });
    await conversation.save();
    const message = conversation.messages[conversation.messages.length - 1];
    const populated = await Conversation.findById(conversation._id).populate('messages.sender');
    const liveMessage = populated.messages[populated.messages.length - 1];
    const io = req.app.get('io');
    io.to(`conversation:${conversation._id}`).emit('message:new', { conversationId: conversation._id.toString(), message: liveMessage });
    const recipient = conversation.participants.find(id => id.toString() !== req.session.user._id.toString());
    addNotification(req, io, recipient, { type: 'message', text: `${req.session.user.username} sent you a message.`, link: `/Messages/${conversation._id}` });
    sendResult(req, res, { ok: true, message: liveMessage }, `/Messages/${conversation._id}`);
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to send your message.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const Model = req.body.itemType === 'event' ? Event : req.body.itemType === 'post' ? tPost : null;
    if (!Model) return res.redirect('/');
    const item = await Model.findById(req.body.itemId);
    const text = String(req.body.text || '').trim();
    if (!item || !text) return res.redirect(req.body.redirectTo || '/');
    item.comments.push({ user: req.session.user._id, text });
    await item.save();
    const populated = await Model.findById(item._id).populate('comments.user');
    const comment = populated.comments[populated.comments.length - 1];
    const io = req.app.get('io');
    io.to(`${req.body.itemType}:${item._id}`).emit('comment:new', { itemId: item._id.toString(), comment });
    addNotification(req, io, item.userId, { type: 'comment', text: `${req.session.user.username} commented on your ${req.body.itemType}.`, link: req.body.redirectTo || '/' });
    sendResult(req, res, { ok: true, comment }, req.body.redirectTo || '/');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to add your comment.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const Model = req.body.itemType === 'event' ? Event : tPost;
    const item = await Model.findById(req.body.itemId);
    const comment = item?.comments.id(req.body.commentId);
    if (!comment) return res.redirect(req.body.redirectTo || '/');
    if (comment.user.toString() !== req.session.user._id.toString()) return res.status(403).send('Not allowed');
    comment.deleteOne();
    await item.save();
    sendResult(req, res, { ok: true }, req.body.redirectTo || '/');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to delete this comment.' });
  }
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect('/login'));

exports.getProfile = async (req, res) => {
  try {
    const user = await dbUser.findById(req.params.id);
    if (!user) return res.status(404).render('error', { error: 'User profile not found.' });
    const [posts, events, polls] = await Promise.all([
      tPost.find({ userId: user._id }).sort({ createdAt: -1 }),
      Event.find({ userId: user._id }).sort({ dateFor: -1 }),
      Poll.find({ userId: user._id }).sort({ createdAt: -1 })
    ]);
    res.render('profile', { profileUser: user, posts, events, polls });
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to load this profile.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await Event.findOneAndDelete({ _id: req.params.id, userId: req.session.user._id });
    res.redirect('/Events');
  } catch (error) { res.status(500).render('error', { error: 'Unable to delete this event.' }); }
};

exports.deletePoll = async (req, res) => {
  try {
    await Poll.findOneAndDelete({ _id: req.params.id, userId: req.session.user._id });
    res.redirect('/Polls');
  } catch (error) { res.status(500).render('error', { error: 'Unable to delete this poll.' }); }
};

exports.deleteNote = async (req, res) => {
  try {
    const post = await tPost.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (post) await post.deleteOne();
    res.redirect('/MyPosts');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to delete this post.' });
  }
};

exports.attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.redirect('/Events');
    const userId = req.session.user._id.toString();
    const index = event.attending.findIndex(attendee => attendee.toString() === userId);
    if (index === -1) event.attending.push(req.session.user._id);
    else event.attending.splice(index, 1);
    await event.save();
    const count = event.attending.length;
    const io = req.app.get('io');
    emitCount(io, `event:${event._id}`, 'event:attendance', event._id, count);
    if (index === -1 && count % 10 === 0) addNotification(req, io, event.userId, { type: 'event', text: `${count} people are attending your event.`, link: `/Events/${event._id}` });
    sendResult(req, res, { ok: true, attending: count, attendingSelf: index === -1 }, req.get('Referrer') || '/Events');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to update attendance.' });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll || new Date(poll.dateFor) < new Date()) return sendResult(req, res, { ok: false, error: 'Voting has ended.' }, '/Polls');
    const selected = poll.answers.id(req.body.answerId);
    if (!selected) return res.redirect('/Polls');
    const userId = req.session.user._id.toString();
    poll.answers.forEach(answer => { answer.answered = answer.answered.filter(id => id.toString() !== userId); });
    selected.answered.push(req.session.user._id);
    await poll.save();
    const total = poll.answers.reduce((sum, answer) => sum + answer.answered.length, 0);
    const io = req.app.get('io');
    io.to(`poll:${poll._id}`).emit('poll:update', { id: poll._id.toString(), answers: poll.answers.map(answer => ({ id: answer._id.toString(), count: answer.answered.length })), total });
    if (total % 10 === 0) addNotification(req, io, poll.userId, { type: 'poll', text: `${total} votes have been cast on your poll.`, link: '/Polls' });
    sendResult(req, res, { ok: true, total }, req.get('Referrer') || '/Polls');
  } catch (error) {
    res.status(500).render('error', { error: 'Unable to record your vote.' });
  }
};
