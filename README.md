# AAU Forum

AAU Forum is a real-time discussion platform originally developed as a group project during the 2nd semester of Software Engineering at Aalborg University Copenhagen. After the semester ended, I continued developing the project independently with the group's permission. This repository contains my continued portfolio version.

The platform brings posts, comments, polls, events, direct messages, notifications, profiles, and dark mode together in one place – designed to reduce fragmented communication between students.

## Live Demo

A live version of the application is available at:

🔗 [https://aau-forum.onrender.com](https://aau-forum.onrender.com)

The demo is hosted on Render's free tier. It stays awake most of the time, but if it has been inactive for a while, the server may need **20–30 seconds** to wake up on the first visit.

### Test Account

If you do not want to create your own account, you can use the public test account:

- **UserID:** `test`

This account exists so visitors can safely explore all features without providing personal information. Feel free to create posts, events, polls, send messages, and test the notification system. Please keep the content friendly.

## Features

- Login with a unique UserID (no password required)
- Public user profiles with bio and activity overview
- Role selection (student semesters, professor, recruiter, and more)
- Posts with tags and comments
- Events with images and live attendance counts
- Polls with deadlines and previous poll history
- Real-time direct messaging
- Notification dropdown with clickable links
- Dark mode / light mode toggle
- Responsive design
- Image upload with validation
- Socket.io for live updates and notifications

## Technologies

- Node.js
- Express
- MongoDB (Mongoose)
- EJS (templating)
- Multer (file uploads)
- express-session (authentication)
- Socket.io (real-time features)
- Vanilla JavaScript and CSS

## Getting Started

### Prerequisites

Before running the project locally, make sure you have the following installed:

- **Node.js** (version 18 or later) – download from [https://nodejs.org](https://nodejs.org)
- **MongoDB** – either a local installation or a free cloud cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kebablover23/AAU-Forum.git
   ```

2. Navigate into the project folder:
   ```bash
   cd AAU-Forum
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the project root with the following content:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=replace-this-with-a-long-random-value
   PORT=3000
   ```

   Replace `your_mongodb_connection_string` with your own MongoDB connection string. You can get one for free from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

5. Start the application:
   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

For development with automatic restarts, use:
```bash
npm run dev
```

## Project Background

AAU Forum started as a second-semester group project at Aalborg University Copenhagen. The original problem was simple but widespread: students had to use many different platforms to stay informed about events, ask academic questions, and connect with peers. This fragmentation made it difficult to find relevant information and participate in student life.

As a group, we researched the problem through surveys, interviews, and design sprints. We then built a working forum as our semester project.

After the course ended, I wanted to take the project further. I received permission from the group to continue working on it independently. The group members have chosen to remain anonymous in this public portfolio version.

During the summer break before my 3rd semester, I spent time improving the codebase, fixing known issues, adding new features, and making the project something I could be proud to show in a portfolio. This repository is the result of that continued work.

## My Contributions

While the original project was a collaborative effort, this portfolio version includes a large amount of independent work. During my continued development, I:

- Restructured the project from a single folder into a clean MVC-like architecture
- Removed password authentication and replaced it with UserID-only login
- Added sessions and user authentication middleware
- Implemented public user profiles with bio and activity overview
- Added role selection with options for students, staff, and external partners
- Built a notification system with Socket.io and clickable dropdown
- Added real-time messaging, comments, poll votes, and event attendance
- Implemented dark mode with persistent user preference
- Added image upload validation and default avatar fallback
- Added event and poll deletion for owners
- Fixed numerous bugs discovered during testing
- Translated the entire user interface to English
- Documented the project for public use

This project demonstrates my ability to take an existing codebase, identify weaknesses, and improve it into a solid full-stack application.

## AI-Assisted Development

A small amount of AI assistance was used during the continued development for debugging and guidance. AI tools helped identify issues and suggest improvements, but all changes were manually reviewed and tested before being accepted. The final implementation reflects my own understanding and effort.

## Privacy

Personal and confidential information has been removed. University reports, process analyses, private communication, and personal group information are not included. Collaborator names are omitted for privacy.

## Known Limitations

This is a prototype. Some limitations include:

- In-memory session store (sessions reset when the server restarts)
- Uploaded images are stored on the server filesystem and may not persist between deploys on free hosting
- No password recovery or email verification
- No moderation tools
- No persistent notification storage across sessions

These limitations are acceptable for a demo and portfolio piece, but would need to be addressed for production use.

## License

No license has been granted for reuse. The source code is publicly viewable for portfolio and educational review purposes.

---

Thank you for taking the time to explore AAU Forum. This project represents many hours of learning, debugging, and growth, and I am proud of how far it has come.

Zaiim Islam