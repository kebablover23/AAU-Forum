const path = require('path');
const express = require('express');
const multer = require('multer');
const noteController = require('../controllers/noteController');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  }
});

router.get('/', noteController.getHome);
router.get('/MyPosts', requireLogin, noteController.getMyPosts);
router.get('/post/:id', noteController.getSinglePost);
router.get('/login', noteController.showLogin);
router.get('/register', noteController.showRegister);
router.get('/createPost', noteController.showCreatePost);
router.get('/Messages', requireLogin, noteController.messagesPage);
router.get('/Messages/:conversationId', requireLogin, noteController.getMessages);
router.get('/Events', noteController.getEvents);
router.get('/Events/:id', noteController.getSingleEvent);
router.get('/createEvent', noteController.showCreateEvent);
router.get('/Polls', noteController.getPolls);
router.get('/Polls/addPoll', noteController.showCreatePoll);
router.get('/settings', requireLogin, noteController.settingsPage);
router.get('/profile/:id', noteController.getProfile);
router.get('/logout', noteController.logout);

router.post('/login', noteController.logIn);
router.post('/register', imageUpload.single('profilePic'), noteController.createUser);
router.post('/adduser', imageUpload.single('profilePic'), noteController.createUser);
router.post('/settings/update', requireLogin, imageUpload.single('profilePic'), noteController.updateSettings);
router.post('/addTP', requireLogin, noteController.createTPost);
router.post('/addComment', requireLogin, noteController.addComment);
router.post('/deleteComment', requireLogin, noteController.deleteComment);
router.post('/delete/:id', requireLogin, noteController.deleteNote);
router.post('/addPoll', requireLogin, noteController.addPoll);
router.post('/votePoll/:id', requireLogin, noteController.votePoll);
router.post('/Messages/sendMessage', requireLogin, noteController.sendMessages);
router.post('/createConversation', requireLogin, noteController.createConversation);
router.post('/createEvent', requireLogin, imageUpload.single('picture'), noteController.createEvent);
router.post('/attendEvent/:id', requireLogin, noteController.attendEvent);
router.post('/deleteEvent/:id', requireLogin, noteController.deleteEvent);
router.post('/deletePoll/:id', requireLogin, noteController.deletePoll);

module.exports = router;
