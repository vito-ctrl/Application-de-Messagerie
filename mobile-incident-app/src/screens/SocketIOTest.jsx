import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import io from 'socket.io-client';
import { App_IP } from '@env'

console.log(App_IP)

const testUsers = [
  { email: 'hamza@gmail.com', password: 'Hamza123@' },
  { email: 'bensalemhossna@gmail.com', password: 'Hossna123@' },
  { name: 'Charlie Brown', email: 'charlie@test.com', password: 'password123' },
  { name: 'Diana Prince', email: 'diana@test.com', password: 'password123' },
  { name: 'Eve Wilson', email: 'eve@test.com', password: 'password123' },
];

const SocketIOTest = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [newUserCount, setNewUserCount] = useState('2');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messageInput, setMessageInput] = useState('');
  const [selectedSender, setSelectedSender] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [privateMessageInput, setPrivateMessageInput] = useState('');
  const [messagingMode, setMessagingMode] = useState('room'); // 'room' or 'private'
  const scrollViewRef = useRef(null);
  const messageScrollViewRef = useRef(null);
  const userSocketsRef = useRef({});

  // Add log entry with user context
  const addLog = (message, type = 'info', userId = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp,
      userId
    };
    
    setLogs(prevLogs => [...prevLogs, logEntry]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Add message to chat
  const addMessage = (messageData) => {
    const messageEntry = {
      id: Date.now() + Math.random(),
      ...messageData,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setMessages(prevMessages => [...prevMessages, messageEntry]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messageScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Create or login user and get token
  const authenticateUser = async (userInfo) => {
    try {
      addLog(`🔐 [${userInfo.name}] Logging in...`, 'info');
      
      // Try login first
      let response = await fetch(`${SERVER_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo.email,
          password: userInfo.password
        }),
      });
      
      let data = await response.json();
      
      // If login fails, try to create user
      if (data.status !== 'success') {
        addLog(`🔄 [${userInfo.name}] Creating new user...`, 'info');
        
        response = await fetch(`${SERVER_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userInfo),
        });
        
        data = await response.json();
      }
      
      if (data.status === 'success') {
        addLog(`✅ [${userInfo.name}] Authentication successful!`, 'success');
        return data.token;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      addLog(`❌ [${userInfo.name}] Authentication failed: ${error.message}`, 'error');
      return null;
    }
  };

  // Connect user to Socket.IO
  const connectUser = (userInfo, token) => {
    const userId = userInfo.email;
    addLog(`🔌 [${userInfo.name}] Connecting to Socket.IO...`, 'info', userId);
    
    const socket = io(SERVER_URL, {
      auth: {
        token: token
      }
    });

    userSocketsRef.current[userId] = socket;

    // Connection events
    socket.on('connect', () => {
      addLog(`✅ [${userInfo.name}] Connected! Socket ID: ${socket.id}`, 'success', userId);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isConnected: true, socketId: socket.id }
            : user
        )
      );

      // Auto-join the general room
      socket.emit('joinRoom', {
        roomId: currentRoom,
        metadata: { name: 'General Chat', description: 'Main chat room' }
      });
    });

    socket.on('connect_error', (error) => {
      addLog(`❌ [${userInfo.name}] Connection failed: ${error.message}`, 'error', userId);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isConnected: false }
            : user
        )
      );
    });

    socket.on('disconnect', (reason) => {
      addLog(`🔌 [${userInfo.name}] Disconnected: ${reason}`, 'warning', userId);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isConnected: false, socketId: null }
            : user
        )
      );
    });

    // Message events
    socket.on('privateMessage', (data) => {
      addLog(`📧 [${userInfo.name}] Private message from ${data.sender.name}: ${data.message}`, 'message', userId);
      
      // Add to message history
      addMessage({
        type: 'private',
        sender: data.sender,
        receiver: userInfo,
        message: data.message,
        direction: 'received'
      });
    });

    socket.on('roomMessage', (data) => {
      addLog(`🏠 [${userInfo.name}] Room message in ${data.roomId} from ${data.sender.name}: ${data.message}`, 'message', userId);
      
      // Add to message history
      addMessage({
        type: 'room',
        sender: data.sender,
        roomId: data.roomId,
        message: data.message,
        direction: data.sender.name === userInfo.name ? 'sent' : 'received'
      });
    });

    socket.on('broadcast', (data) => {
      addLog(`📢 [${userInfo.name}] Broadcast from ${data.sender.name}: ${data.message}`, 'message', userId);
      
      // Add to message history
      addMessage({
        type: 'broadcast',
        sender: data.sender,
        message: data.message,
        direction: 'received'
      });
    });

    // Room events
    socket.on('roomJoined', (data) => {
      addLog(`🏠 [${userInfo.name}] Joined room: ${data.roomId} (${data.users?.length || 0} users)`, 'success', userId);
    });

    socket.on('userJoinedRoom', (data) => {
      addLog(`👥 [${userInfo.name}] Saw ${data.user.name} join room ${data.roomId}`, 'info', userId);
    });

    socket.on('userLeftRoom', (data) => {
      addLog(`👤 [${userInfo.name}] Saw ${data.user.name} leave room ${data.roomId}`, 'info', userId);
    });

    socket.on('roomUsers', (data) => {
      addLog(`👥 [${userInfo.name}] Room ${data.roomId} has ${data.users?.length || 0} users`, 'info', userId);
    });

    // Status events
    socket.on('userOnline', (data) => {
      addLog(`🟢 [${userInfo.name}] Saw ${data.user.name} come online`, 'info', userId);
    });

    socket.on('userOffline', (data) => {
      addLog(`🔴 [${userInfo.name}] Saw ${data.user.name} go offline`, 'info', userId);
    });

    socket.on('userStatusUpdate', (data) => {
      addLog(`📊 [${userInfo.name}] ${data.user.name} status: ${data.status}`, 'info', userId);
    });

    socket.on('userTyping', (data) => {
      addLog(`⌨️ [${userInfo.name}] ${data.user.name} is ${data.isTyping ? 'typing' : 'not typing'}`, 'info', userId);
    });

    // Other events
    socket.on('connectedUsers', (data) => {
      addLog(`👥 [${userInfo.name}] Sees ${data.users?.length || 0} connected users`, 'info', userId);
    });

    socket.on('messageDelivered', (data) => {
      addLog(`✅ [${userInfo.name}] Message delivered: ${data.messageId}`, 'success', userId);
    });

    socket.on('notification', (data) => {
      addLog(`🔔 [${userInfo.name}] Notification from ${data.sender.name}: ${data.title}`, 'notification', userId);
    });

    socket.on('error', (data) => {
      addLog(`❌ [${userInfo.name}] Socket error: ${data.message}`, 'error', userId);
    });
  };

  // Send room message
  const sendRoomMessage = () => {
    if (!messageInput.trim() || !selectedSender) return;

    const socket = userSocketsRef.current[selectedSender.id];
    if (!socket) {
      Alert.alert('Error', 'Selected user is not connected');
      return;
    }

    socket.emit('roomMessage', {
      roomId: currentRoom,
      message: messageInput.trim()
    });

    // Add to message history as sent
    addMessage({
      type: 'room',
      sender: selectedSender.userInfo,
      roomId: currentRoom,
      message: messageInput.trim(),
      direction: 'sent'
    });

    setMessageInput('');
  };

  // Send private message
  const sendPrivateMessage = () => {
    if (!privateMessageInput.trim() || !selectedSender || !selectedReceiver) return;

    const socket = userSocketsRef.current[selectedSender.id];
    if (!socket) {
      Alert.alert('Error', 'Sender is not connected');
      return;
    }

    if (!selectedReceiver.socketId) {
      Alert.alert('Error', 'Receiver is not connected');
      return;
    }

    socket.emit('privateMessage', {
      recipientId: selectedReceiver.socketId,
      message: privateMessageInput.trim()
    });

    // Add to message history as sent
    addMessage({
      type: 'private',
      sender: selectedSender.userInfo,
      receiver: selectedReceiver.userInfo,
      message: privateMessageInput.trim(),
      direction: 'sent'
    });

    setPrivateMessageInput('');
  };

  // Create multiple users
  const createUsers = async () => {
    const count = parseInt(newUserCount) || 2;
    if (count > 10) {
      Alert.alert('Error', 'Maximum 10 users allowed');
      return;
    }

    setShowUserModal(false);
    addLog(`🚀 Creating ${count} test users...`, 'info');

    const newUsers = [];
    
    for (let i = 0; i < count; i++) {
      const userTemplate = testUsers[i % testUsers.length];
      const userInfo = {
        ...userTemplate,
        name: `${userTemplate.name} ${i + 1}`,
        email: `test${i + 1}@example.com`,
      };
      
      const userId = userInfo.email;
      
      newUsers.push({
        id: userId,
        name: userInfo.name,
        email: userInfo.email,
        isConnected: false,
        socketId: null,
        userInfo
      });
    }

    setUsers(newUsers);
    
    // Set first user as default sender
    if (newUsers.length > 0) {
      setSelectedSender(newUsers[0]);
    }
    
    // Authenticate and connect each user
    for (const user of newUsers) {
      const token = await authenticateUser(user.userInfo);
      if (token) {
        // Small delay between connections
        await new Promise(resolve => setTimeout(resolve, 500));
        connectUser(user.userInfo, token);
      }
    }
  };

  // Disconnect all users
  const disconnectAllUsers = () => {
    Object.values(userSocketsRef.current).forEach(socket => {
      if (socket) {
        socket.disconnect();
      }
    });
    
    userSocketsRef.current = {};
    setUsers([]);
    setSelectedSender(null);
    setSelectedReceiver(null);
    addLog('🔌 All users disconnected', 'info');
  };

  // Sleep function
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Run comprehensive multi-user tests
  const runMultiUserTests = async () => {
    if (users.length === 0) {
      Alert.alert('Error', 'No users connected');
      return;
    }

    setIsRunning(true);
    addLog('🧪 Starting multi-user Socket.IO tests...', 'info');

    try {
      const connectedUsers = users.filter(user => user.isConnected);
      const roomId = 'multi-user-test-room';

      // Test 1: All users join the same room
      addLog('Test 1: All users joining the same room...', 'test');
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('joinRoom', {
              roomId: roomId,
              metadata: { name: 'Multi-User Test Room', description: 'Testing with multiple users' }
            });
          }, index * 200); // Stagger joins
        }
      });
      
      await sleep(2000);

      // Test 2: Users send messages to the room
      addLog('Test 2: Users sending room messages...', 'test');
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('roomMessage', {
              roomId: roomId,
              message: `Hello from ${user.name}! Message #${index + 1}`
            });
          }, index * 300);
        }
      });
      
      await sleep(3000);

      // Test 3: Users update their status
      addLog('Test 3: Users updating status...', 'test');
      const statuses = ['online', 'busy', 'away', 'dnd'];
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('statusUpdate', {
              status: statuses[index % statuses.length]
            });
          }, index * 200);
        }
      });
      
      await sleep(2000);

      // Test 4: Typing indicators
      addLog('Test 4: Testing typing indicators...', 'test');
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('typing', {
              roomId: roomId,
              isTyping: true
            });
            
            // Stop typing after 1 second
            setTimeout(() => {
              socket.emit('typing', {
                roomId: roomId,
                isTyping: false
              });
            }, 1000);
          }, index * 500);
        }
      });
      
      await sleep(4000);

      // Test 5: Private messages between users
      addLog('Test 5: Sending private messages...', 'test');
      if (connectedUsers.length >= 2) {
        const sender = connectedUsers[0];
        const receiver = connectedUsers[1];
        const senderSocket = userSocketsRef.current[sender.id];
        
        if (senderSocket && receiver.socketId) {
          senderSocket.emit('privateMessage', {
            recipientId: receiver.socketId,
            message: `Private message from ${sender.name} to ${receiver.name}`
          });
        }
      }
      
      await sleep(1000);

      // Test 6: Broadcast messages
      addLog('Test 6: Broadcasting messages...', 'test');
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('broadcast', {
              message: `Broadcast from ${user.name}: Message to everyone!`
            });
          }, index * 400);
        }
      });
      
      await sleep(3000);

      // Test 7: Get room users
      addLog('Test 7: Getting room users...', 'test');
      if (connectedUsers.length > 0) {
        const socket = userSocketsRef.current[connectedUsers[0].id];
        if (socket) {
          socket.emit('getRoomUsers', {
            roomId: roomId
          });
        }
      }
      
      await sleep(1000);

      // Test 8: Users leave room one by one
      addLog('Test 8: Users leaving room...', 'test');
      connectedUsers.forEach((user, index) => {
        const socket = userSocketsRef.current[user.id];
        if (socket) {
          setTimeout(() => {
            socket.emit('leaveRoom', {
              roomId: roomId
            });
          }, index * 500);
        }
      });
      
      await sleep(3000);

      addLog('✅ All multi-user tests completed!', 'success');

    } catch (error) {
      addLog(`❌ Test error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Test private messaging between specific users
  const testPrivateMessaging = async () => {
    const connectedUsers = users.filter(user => user.isConnected);
    if (connectedUsers.length < 2) {
      Alert.alert('Error', 'Need at least 2 connected users for private messaging test');
      return;
    }

    addLog('💬 Testing private messaging between all users...', 'test');

    // Each user sends a private message to every other user
    connectedUsers.forEach((sender, senderIndex) => {
      connectedUsers.forEach((receiver, receiverIndex) => {
        if (senderIndex !== receiverIndex) {
          const senderSocket = userSocketsRef.current[sender.id];
          if (senderSocket && receiver.socketId) {
            setTimeout(() => {
              senderSocket.emit('privateMessage', {
                recipientId: receiver.socketId,
                message: `Private message from ${sender.name} to ${receiver.name}`
              });
            }, (senderIndex * connectedUsers.length + receiverIndex) * 200);
          }
        }
      });
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(userSocketsRef.current).forEach(socket => {
        if (socket) {
          socket.disconnect();
        }
      });
    };
  }, []);

  // Get log style based on type
  const getLogStyle = (type) => {
    switch (type) {
      case 'success': return styles.logSuccess;
      case 'error': return styles.logError;
      case 'warning': return styles.logWarning;
      case 'message': return styles.logMessage;
      case 'notification': return styles.logNotification;
      case 'test': return styles.logTest;
      default: return styles.logInfo;
    }
  };

  // Filter logs by selected user
  const filteredLogs = selectedUserId 
    ? logs.filter(log => !log.userId || log.userId === selectedUserId)
    : logs;

  // Get connected users for dropdowns
  const connectedUsers = users.filter(user => user.isConnected);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Multi-User Socket.IO Test</Text>
        <Text style={styles.serverUrl}>{SERVER_URL}</Text>
      </View>

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          👥 {users.length} Users | 🟢 {users.filter(u => u.isConnected).length} Connected
        </Text>
      </View>

      {/* User List */}
      <ScrollView horizontal style={styles.userList} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.userChip, !selectedUserId && styles.userChipSelected]}
          onPress={() => setSelectedUserId(null)}
        >
          <Text style={styles.userChipText}>All</Text>
        </TouchableOpacity>
        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userChip,
              user.isConnected ? styles.userChipConnected : styles.userChipDisconnected,
              selectedUserId === user.id && styles.userChipSelected
            ]}
            onPress={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
          >
            <Text style={styles.userChipText}>
              {user.isConnected ? '🟢' : '🔴'} {user.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.buttonCreate]}
          onPress={() => setShowUserModal(true)}
        >
          <Text style={styles.buttonText}>Create Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonMessaging]}
          onPress={() => setShowMessagingModal(true)}
          disabled={connectedUsers.length === 0}
        >
          <Text style={styles.buttonText}>💬 Messaging</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonTest, (users.filter(u => u.isConnected).length === 0 || isRunning) && styles.buttonDisabled]}
          onPress={runMultiUserTests}
          disabled={users.filter(u => u.isConnected).length === 0 || isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrivate]}
          onPress={testPrivateMessaging}
          disabled={users.filter(u => u.isConnected).length < 2}
        >
          <Text style={styles.buttonText}>Private Msgs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.buttonDisconnect]}
          onPress={disconnectAllUsers}
          disabled={users.length === 0}
        >
          <Text style={styles.buttonText}>Disconnect All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonClear]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.logContainer}
        contentContainerStyle={styles.logContent}
      >
        {filteredLogs.map((log) => (
          <View key={log.id} style={styles.logEntry}>
            <Text style={styles.timestamp}>{log.timestamp}</Text>
            <Text style={[styles.logMessage, getLogStyle(log.type)]}>
              {log.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Create Users Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Test Users</Text>
            
            <Text style={styles.modalLabel}>Number of users (2-10):</Text>
            <TextInput
              style={styles.modalInput}
              value={newUserCount}
              onChangeText={setNewUserCount}
              keyboardType="numeric"
              placeholder="2"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonCreate]}
                onPress={createUsers}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Messaging Modal */}
      <Modal
        visible={showMessagingModal}
        animationType="slide"
        onRequestClose={() => setShowMessagingModal(false)}
      >
        <SafeAreaView style={styles.messagingContainer}>
          <View style={styles.messagingHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMessagingModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.messagingTitle}>💬 Live Messaging Test</Text>
            <TouchableOpacity
              style={styles.clearMessagesButton}
              onPress={clearMessages}
            >
              <Text style={styles.clearMessagesText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Messaging Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, messagingMode === 'room' && styles.modeButtonActive]}
              onPress={() => setMessagingMode('room')}
            >
              <Text style={styles.modeButtonText}>Room Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, messagingMode === 'private' && styles.modeButtonActive]}
              onPress={() => setMessagingMode('private')}
            >
              <Text style={styles.modeButtonText}>Private Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Message History */}
          <ScrollView
            ref={messageScrollViewRef}
            style={styles.messageHistory}
            contentContainerStyle={styles.messageHistoryContent}
          >
            {messages
              .filter(msg => messagingMode === 'room' ? msg.type === 'room' : msg.type === 'private')
              .map((message) => (
              <View key={message.id} style={[
                styles.messageItem,
                message.direction === 'sent' ? styles.messageItemSent : styles.messageItemReceived
              ]}>
                <Text style={styles.messageSender}>
                  {message.type === 'private' 
                    ? `${message.sender.name} → ${message.receiver?.name || 'Unknown'}`
                    : `${message.sender.name} (${message.roomId})`
                  }
                </Text>
                <Text style={styles.messageText}>{message.message}</Text>
                <Text style={styles.messageTime}>{message.timestamp}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.messageInputContainer}
          >
            {messagingMode === 'room' ? (
              <View style={styles.roomMessageInput}>
                <View style={styles.senderSelector}>
                  <Text style={styles.selectorLabel}>From:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {connectedUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.selectorChip,
                          selectedSender?.id === user.id && styles.selectorChipSelected
                        ]}
                        onPress={() => setSelectedSender(user)}
                      >
                        <Text style={styles.selectorChipText}>{user.name.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.messageTextInput}
                    value={messageInput}
                    onChangeText={setMessageInput}
                    placeholder={`Send message to room: ${currentRoom}`}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, (!messageInput.trim() || !selectedSender) && styles.sendButtonDisabled]}
                    onPress={sendRoomMessage}
                    disabled={!messageInput.trim() || !selectedSender}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.privateMessageInput}>
                <View style={styles.privateSelectorRow}>
                  <View style={styles.privateSelectorHalf}>
                    <Text style={styles.selectorLabel}>From:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {connectedUsers.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[
                            styles.selectorChip,
                            selectedSender?.id === user.id && styles.selectorChipSelected
                          ]}
                          onPress={() => setSelectedSender(user)}
                        >
                          <Text style={styles.selectorChipText}>{user.name.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.privateSelectorHalf}>
                    <Text style={styles.selectorLabel}>To:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {connectedUsers.filter(user => user.id !== selectedSender?.id).map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[
                            styles.selectorChip,
                            selectedReceiver?.id === user.id && styles.selectorChipSelected
                          ]}
                          onPress={() => setSelectedReceiver(user)}
                        >
                          <Text style={styles.selectorChipText}>{user.name.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.messageTextInput}
                    value={privateMessageInput}
                    onChangeText={setPrivateMessageInput}
                    placeholder={`Send private message to ${selectedReceiver?.name || 'select user'}`}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, (!privateMessageInput.trim() || !selectedSender || !selectedReceiver) && styles.sendButtonDisabled]}
                    onPress={sendPrivateMessage}
                    disabled={!privateMessageInput.trim() || !selectedSender || !selectedReceiver}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  serverUrl: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  userList: {
    maxHeight: 50,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  userChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 8,
  },
  userChipConnected: {
    backgroundColor: '#c8e6c9',
  },
  userChipDisconnected: {
    backgroundColor: '#ffcdd2',
  },
  userChipSelected: {
    backgroundColor: '#2196F3',
  },
  userChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonCreate: {
    backgroundColor: '#4CAF50',
  },
  buttonMessaging: {
    backgroundColor: '#E91E63',
  },
  buttonTest: {
    backgroundColor: '#FF9800',
  },
  buttonPrivate: {
    backgroundColor: '#9C27B0',
  },
  buttonDisconnect: {
    backgroundColor: '#f44336',
  },
  buttonClear: {
    backgroundColor: '#607D8B',
  },
  buttonCancel: {
    backgroundColor: '#757575',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  logContent: {
    padding: 8,
  },
  logEntry: {
    marginBottom: 6,
  },
  timestamp: {
    color: '#888',
    fontSize: 9,
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logInfo: {
    color: '#fff',
  },
  logSuccess: {
    color: '#4CAF50',
  },
  logError: {
    color: '#f44336',
  },
  logWarning: {
    color: '#FF9800',
  },
  logMessage: {
    color: '#2196F3',
  },
  logNotification: {
    color: '#9C27B0',
  },
  logTest: {
    color: '#FFEB3B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  // Messaging Modal Styles
  messagingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagingHeader: {
    backgroundColor: '#E91E63',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  clearMessagesButton: {
    padding: 8,
  },
  clearMessagesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#E91E63',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  messageHistory: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 8,
  },
  messageHistoryContent: {
    padding: 12,
  },
  messageItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageItemSent: {
    backgroundColor: '#E91E63',
    alignSelf: 'flex-end',
  },
  messageItemReceived: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 9,
    color: '#999',
    textAlign: 'right',
  },
  messageInputContainer: {
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 12,
  },
  roomMessageInput: {
    
  },
  privateMessageInput: {
    
  },
  senderSelector: {
    marginBottom: 12,
  },
  privateSelectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  privateSelectorHalf: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
  },
  selectorChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  selectorChipSelected: {
    backgroundColor: '#E91E63',
  },
  selectorChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SocketIOTest;