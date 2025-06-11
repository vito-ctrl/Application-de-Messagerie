// test-socketio.js
// Run with: node test-socketio.js

const io = require('socket.io-client');
const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
let socket = null;

// Test credentials - make sure these exist in your database
const testUser = {
    email: 'test@example.com',
    password: 'testpassword123'
};

async function loginAndGetToken() {
    try {
        console.log('🔐 Logging in to get JWT token...');
        
        const response = await axios.post(`${SERVER_URL}/api/auth/signin`, testUser);
        
        if (response.data.status === 'success') {
            console.log('✅ Login successful!');
            console.log('👤 User:', response.data.user.name);
            console.log('🎫 Token:', response.data.token.substring(0, 20) + '...');
            return response.data.token;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        
        // If login fails, try to create a test user
        console.log('🔄 Attempting to create test user...');
        try {
            const signupResponse = await axios.post(`${SERVER_URL}/api/auth/signup`, {
                name: 'Test User',
                email: testUser.email,
                password: testUser.password
            });
            
            if (signupResponse.data.status === 'success') {
                console.log('✅ Test user created successfully!');
                return signupResponse.data.token;
            }
        } catch (signupError) {
            console.error('❌ Failed to create test user:', signupError.response?.data?.message || signupError.message);
        }
        
        return null;
    }
}

function connectToSocket(token) {
    console.log('\n🔌 Connecting to Socket.IO server...');
    
    socket = io(SERVER_URL, {
        auth: {
            token: token
        }
    });

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        console.log('🆔 Socket ID:', socket.id);
        runTests();
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
    });

    // Message events
    socket.on('privateMessage', (data) => {
        console.log('📧 Private message received:', {
            from: data.sender.name,
            message: data.message,
            timestamp: data.timestamp
        });
    });

    socket.on('roomMessage', (data) => {
        console.log('🏠 Room message received:', {
            room: data.roomId,
            from: data.sender.name,
            message: data.message,
            timestamp: data.timestamp
        });
    });

    socket.on('broadcast', (data) => {
        console.log('📢 Broadcast received:', {
            from: data.sender.name,
            message: data.message,
            timestamp: data.timestamp
        });
    });

    // Room events
    socket.on('roomJoined', (data) => {
        console.log('🏠 Joined room:', {
            roomId: data.roomId,
            users: data.users,
            metadata: data.metadata
        });
    });

    socket.on('userJoinedRoom', (data) => {
        console.log('👥 User joined room:', {
            user: data.user.name,
            room: data.roomId
        });
    });

    socket.on('userLeftRoom', (data) => {
        console.log('👤 User left room:', {
            user: data.user.name,
            room: data.roomId
        });
    });

    socket.on('roomUsers', (data) => {
        console.log('👥 Room users:', {
            room: data.roomId,
            users: data.users
        });
    });

    // Status events
    socket.on('userOnline', (data) => {
        console.log('🟢 User online:', data.user.name);
    });

    socket.on('userOffline', (data) => {
        console.log('🔴 User offline:', data.user.name);
    });

    socket.on('userStatusUpdate', (data) => {
        console.log('📊 User status update:', {
            user: data.user.name,
            status: data.status
        });
    });

    socket.on('userTyping', (data) => {
        console.log('⌨️ User typing:', {
            user: data.user.name,
            isTyping: data.isTyping
        });
    });

    // Other events
    socket.on('connectedUsers', (data) => {
        console.log('👥 Connected users:', data.users.length);
    });

    socket.on('messageDelivered', (data) => {
        console.log('✅ Message delivered:', data.messageId);
    });

    socket.on('notification', (data) => {
        console.log('🔔 Notification:', {
            from: data.sender.name,
            title: data.title,
            message: data.message,
            type: data.type
        });
    });

    socket.on('error', (data) => {
        console.error('❌ Socket error:', data.message);
    });
}

async function runTests() {
    console.log('\n🧪 Running Socket.IO tests...\n');
    
    // Test 1: Join a room
    console.log('Test 1: Joining room...');
    socket.emit('joinRoom', {
        roomId: 'test-room',
        metadata: { name: 'Test Room', description: 'Room for testing' }
    });
    
    await sleep(1000);
    
    // Test 2: Send room message
    console.log('Test 2: Sending room message...');
    socket.emit('roomMessage', {
        roomId: 'test-room',
        message: 'Hello from Node.js test script!'
    });
    
    await sleep(1000);
    
    // Test 3: Update status
    console.log('Test 3: Updating status...');
    socket.emit('statusUpdate', {
        status: 'busy'
    });
    
    await sleep(1000);
    
    // Test 4: Typing indicator
    console.log('Test 4: Testing typing indicator...');
    socket.emit('typing', {
        roomId: 'test-room',
        isTyping: true
    });
    
    await sleep(2000);
    
    socket.emit('typing', {
        roomId: 'test-room',
        isTyping: false
    });
    
    await sleep(1000);
    
    // Test 5: Broadcast message
    console.log('Test 5: Broadcasting message...');
    socket.emit('broadcast', {
        message: 'This is a broadcast message from Node.js test!'
    });
    
    await sleep(1000);
    
    // Test 6: Get room users
    console.log('Test 6: Getting room users...');
    socket.emit('getRoomUsers', {
        roomId: 'test-room'
    });
    
    await sleep(1000);
    
    // Test 7: Send notification
    console.log('Test 7: Sending notification...');
    socket.emit('sendNotification', {
        recipientId: socket.id, // Send to self for testing
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info'
    });
    
    await sleep(1000);
    
    // Test 8: Custom event
    console.log('Test 8: Sending custom event...');
    socket.emit('customEvent', {
        type: 'test',
        data: { message: 'Custom event test data' }
    });
    
    await sleep(1000);
    
    // Test 9: Leave room
    console.log('Test 9: Leaving room...');
    socket.emit('leaveRoom', {
        roomId: 'test-room'
    });
    
    await sleep(1000);
    
    console.log('\n✅ All tests completed!');
    console.log('🔌 Disconnecting...');
    
    socket.disconnect();
    process.exit(0);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test REST API endpoints
async function testRestEndpoints() {
    try {
        console.log('\n🌐 Testing REST API endpoints...');
        
        // Test connected users endpoint
        const usersResponse = await axios.get(`${SERVER_URL}/api/socket/connected-users`);
        console.log('👥 Connected users:', usersResponse.data);
        
        // Test rooms endpoint
        const roomsResponse = await axios.get(`${SERVER_URL}/api/socket/rooms`);
        console.log('🏠 Active rooms:', roomsResponse.data);
        
    } catch (error) {
        console.error('❌ REST API test failed:', error.response?.data || error.message);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Socket.IO tests...');
    console.log('📡 Server URL:', SERVER_URL);
    
    // Test REST endpoints first
    await testRestEndpoints();
    
    // Get JWT token
    const token = await loginAndGetToken();
    
    if (!token) {
        console.error('❌ Could not obtain JWT token. Please check your auth setup.');
        process.exit(1);
    }
    
    // Connect to Socket.IO
    connectToSocket(token);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (socket) {
        socket.disconnect();
    }
    process.exit(0);
});

// Run the tests
main().catch(console.error);