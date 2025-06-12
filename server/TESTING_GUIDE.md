# Testing Guide

## REST API Testing with Postman

1. **Import the Collection**
   - Open Postman
   - Click "Import" and select the `postman_collection.json` file
   - The collection will be imported with all the necessary endpoints

2. **Testing Authentication**
   - First, register a new user using the "Register User" request
   - Then, login using the "Login User" request
   - Copy the JWT token from the login response
   - In Postman, go to the "Variables" tab and create a new variable named "token"
   - Paste the JWT token as the value

3. **Testing Message Endpoints**
   - All message endpoints require the JWT token in the Authorization header
   - The token will be automatically included from the variable you set
   - Replace the user IDs in the URL parameters with actual user IDs from your database

## WebSocket Testing

1. **Using Postman WebSocket**
   - Create a new WebSocket request in Postman
   - Set the URL to: `ws://localhost:3000`
   - Connect to the WebSocket server

2. **Testing Events**
   Send the following events (as JSON):

   ```json
   // Login
   {
     "event": "user_login",
     "data": {
       "userId": "user_id_here"
     }
   }

   // Send Message
   {
     "event": "send_message",
     "data": {
       "senderId": "sender_id_here",
       "receiverId": "receiver_id_here",
       "content": "Hello, this is a test message!"
     }
   }

   // Typing Status
   {
     "event": "typing",
     "data": {
       "senderId": "sender_id_here",
       "receiverId": "receiver_id_here",
       "isTyping": true
     }
   }

   // Logout
   {
     "event": "user_logout",
     "data": {
       "userId": "user_id_here"
     }
   }
   ```

3. **Testing with Multiple Clients**
   - Open multiple WebSocket connections in different Postman tabs
   - Use different user IDs for each connection
   - Test sending messages between users
   - Verify that typing indicators and online/offline status work correctly

## Testing Flow Example

1. **Setup**
   - Register two users (User A and User B)
   - Login both users and get their tokens
   - Note down their user IDs

2. **WebSocket Connection**
   - Connect both users to WebSocket
   - Send `user_login` event for both users
   - Verify they appear online

3. **Message Exchange**
   - User A sends a message to User B
   - Verify User B receives the message
   - User B marks messages as read
   - Verify read status is updated

4. **Typing Indicators**
   - User A starts typing
   - Verify User B receives typing indicator
   - User A stops typing
   - Verify typing indicator is removed

5. **Status Updates**
   - User A logs out
   - Verify User B receives offline status
   - User A logs back in
   - Verify User B receives online status

## Common Issues and Solutions

1. **Connection Issues**
   - Ensure MongoDB is running
   - Check if the server is running on port 3000
   - Verify CORS settings if testing from a different origin

2. **Authentication Issues**
   - Ensure JWT token is valid and not expired
   - Check if token is properly formatted in Authorization header
   - Verify user IDs exist in the database

3. **WebSocket Issues**
   - Check if WebSocket connection is established
   - Verify event names match exactly
   - Ensure data format is correct JSON 

      {
     "event": "send_message",
     "data": {
       "senderId": "6849649aa185f603926b6f29",
       "receiverId": "684964b9a185f603926b6f2d",
       "content": "Hello from User 1!"
     }
   }