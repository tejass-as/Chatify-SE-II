# Real-Time Chat App

This is a real-time chat application where users can chat with each other, send photos and files, and make video calls. It also supports group chats, customizable themes, and user profiles. The app is built to be responsive and smooth across all devices.

## 🔗 Deployed Website

👉 [Visit the live app](chatify-se-ii.onrender.com/)

## Features

- 1-to-1 private messaging  
- Group chat support  
- Send images and files  
- Video calling (WebRTC)  
- Online users indicator  
- 20+ themes to choose from  
- Filter users by online status  
- Profile customization (bio + profile pic)  
- Responsive UI with smooth loaders  

## Tech Stack

**Frontend**  
- React.js  
- TailwindCSS  
- DaisyUI  
- Socket.IO (client)

**Backend**  
- Node.js with Express  
- MongoDB  
- Socket.IO (server)  
- WebRTC for video calls

**DevOps & Deployment**  
- Docker  
- Nginx (reverse proxy)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/tejass-as/tejass-as.git
cd chat-app
```

### 2. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Run the app locally

```bash
# backend
cd backend
npm run dev

#frontend
cd frontend
npm run dev
```

### 4.Using Docker (optional)

```bash
docker-compose up --build
```
Make sure to configure .env files for both frontend and backend.

### 5. Future Improvements
- Push notifications
- Reactions on messages
- Admin roles in group chats
- Message seen/delivered indicators
