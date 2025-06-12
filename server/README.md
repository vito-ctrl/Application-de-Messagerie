# Real-time Messaging Application

A real-time messaging application built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- User authentication (register/login)
- Real-time messaging
- Online/offline status
- Typing indicators
- Message read receipts
- Unread message count

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Messages
- GET `/api/messages/:userId1/:userId2` - Get chat history between two users
- PUT `/api/messages/read/:senderId/:receiverId` - Mark messages as read
- GET `/api/messages/unread/:userId` - Get unread message count

## Socket.IO Events

### Client to Server
- `user_login` - User login event
- `user_logout` - User logout event
- `send_message` - Send a message
- `typing` - Typing status

### Server to Client
- `user_status_change` - User online/offline status
- `receive_message` - Receive a new message
- `message_sent` - Message sent confirmation
- `user_typing` - User typing status
- `error` - Error events

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB server

3. Start the application:
```bash
npm start
```

The server will run on port 3000 by default.

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://127.0.0.1:27017/securisee
JWT_SECRET=your_jwt_secret
PORT=3000
``` 