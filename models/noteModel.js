const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'dbUser', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  Userid: { type: String, required: true, unique: true, trim: true },
  username: { type: String, required: true, trim: true },
  semester: { type: String, required: true, trim: true },
  profilePic: { type: String, default: null },
  bio: { type: String, default: '', trim: true, maxlength: 500 }
}, { timestamps: true });

const textPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'dbUser', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  tags: [String],
  comments: [commentSchema]
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dbUser' }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'dbUser' },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'dbUser', required: true },
  picture: String,
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  tags: [String],
  dateFor: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  attending: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dbUser' }],
  comments: [commentSchema]
}, { timestamps: true });

const pollSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'dbUser', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  tags: [String],
  dateFor: { type: Date, required: true },
  answers: [{
    answer: { type: String, required: true, trim: true },
    answered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dbUser' }]
  }]
}, { timestamps: true });

const tPost = mongoose.model('tPost', textPostSchema);
const dbUser = mongoose.model('dbUser', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Event = mongoose.model('Event', eventSchema);
const Poll = mongoose.model('Poll', pollSchema);

module.exports = { tPost, dbUser, Conversation, Event, Poll };