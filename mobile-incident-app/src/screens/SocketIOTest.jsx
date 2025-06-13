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
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import io from 'socket.io-client';

const { width, height } = Dimensions.get('window');
const SERVER_URL = `http://192.168.20.85:3000`; 

export default function SocketIOTest  () {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [privateMessageInput, setPrivateMessageInput] = useState('');
  const [messagingMode, setMessagingMode] = useState('room');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messageScrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Add message to chat
  const addMessage = (messageData) => {
    const messageEntry = {
      id: Date.now() + Math.random(),
      ...messageData,
      timestamp: messageData.timestamp || new Date().toLocaleTimeString(),
    };
    
    setMessages(prevMessages => [...prevMessages, messageEntry]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messageScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Create a test user function (for demo purposes)
  const createTestUser = async () => {
    try {
      console.log('🔄 Creating/authenticating test user...');
      
      const testUser = {
        name: 'hamza',
        email: 'hamza@gmail.com',
        password: 'Hamza123@'
      };

      const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      });

      const data = await response.json();
      console.log('Signup response:', data);
      
      if (data.status === 'success') {
        console.log('✅ Test user created successfully');
        return { token: data.token, user: data.user };
      } else if (data.message && data.message.includes('already exists')) {
        console.log('🔄 User exists, trying to login...');
        // User exists, try to login
        return await authenticateUser(testUser.email, testUser.password);
      } else {
        throw new Error(data.message || 'Failed to create test user');
      }
    } catch (error) {
      console.log('🔄 Creating test user failed, trying to login:', error.message);
      // If creation fails, try to login with existing credentials
      return await authenticateUser('test@example.com', 'password123');
    }
  };

  // Authentication function
  const authenticateUser = async (email, password) => {
    try {
      console.log('🔐 Authenticating user:', email);
      
      const response = await fetch(`${SERVER_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Signin response:', data);
      
      if (data.status === 'success') {
        console.log('✅ Authentication successful');
        return { token: data.token, user: data.user };
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  };

  // Connect to Socket.IO
  const connectToSocket = async () => {
    if (isConnecting) {
      console.log('⏳ Connection already in progress...');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      console.log('🔄 Starting socket connection...');
      
      // Disconnect existing socket
      if (socketRef.current) {
        console.log('🔄 Disconnecting existing socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Create or authenticate test user
      let authData;
      try {
        authData = await createTestUser();
      } catch (error) {
        throw new Error(`Failed to authenticate: ${error.message}`);
      }

      const { token, user } = authData;
      
      if (!token || !user) {
        throw new Error('Invalid authentication data received');
      }
      
      console.log('🔐 Connecting with token:', token ? 'Present' : 'Missing');
      console.log('👤 User:', user.name, user.email);
      
      const socket = io(SERVER_URL, {
        auth: { token: token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current = socket;

      // Set current user info
      setCurrentUser({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Connected to server with socket ID:', socket.id);
        setIsConnected(true);
        setConnectionError(null);
        setIsConnecting(false);
        
        addMessage({
          type: 'system',
          message: '🟢 Connected to server',
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Auto-join the general room
        console.log('🏠 Auto-joining room:', currentRoom);
        socket.emit('joinRoom', {
          roomId: currentRoom,
          metadata: { name: 'General Chat', description: 'Main chat room' }
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setIsConnected(false);
        setConnectionError(`Disconnected: ${reason}`);
        setIsConnecting(false);
        
        addMessage({
          type: 'system',
          message: `🔴 Disconnected: ${reason}`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        setConnectionError(`Connection error: ${error.message}`);
        setIsConnected(false);
        setIsConnecting(false);
        
        addMessage({
          type: 'system',
          message: `❌ Connection error: ${error.message}`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      // Message events
      socket.on('privateMessage', (data) => {
        console.log('📧 Private message received:', data);
        addMessage({
          type: 'private',
          sender: data.sender,
          receiver: user,
          message: data.message,
          direction: 'received',
          timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
        });
      });

      socket.on('roomMessage', (data) => {
        console.log('🏠 Room message received:', data);
        addMessage({
          type: 'room',
          sender: data.sender,
          roomId: data.roomId,
          message: data.message,
          direction: data.sender.email === user.email ? 'sent' : 'received',
          timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
        });
      });

      // Message delivery confirmations
      socket.on('messageDelivered', (data) => {
        console.log('✅ Message delivered:', data);
      });

      socket.on('messageError', (data) => {
        console.error('❌ Message error:', data);
        Alert.alert('Message Error', data.error);
        addMessage({
          type: 'system',
          message: `❌ Message error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      // Room events
      socket.on('roomJoined', (data) => {
        console.log(`🏠 Joined room: ${data.roomId}`, data);
        addMessage({
          type: 'system',
          message: `🏠 Joined room: ${data.roomId} (${data.userCount} users)`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      socket.on('userJoinedRoom', (data) => {
        console.log('👋 User joined room:', data);
        addMessage({
          type: 'system',
          message: `👋 ${data.user.name} joined the room`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      socket.on('userLeftRoom', (data) => {
        console.log('👋 User left room:', data);
        addMessage({
          type: 'system',
          message: `👋 ${data.user.name} left the room`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      socket.on('connectedUsers', (data) => {
        console.log('👥 Connected users received:', data);
        setConnectedUsers(data.users || []);
      });

      socket.on('userOnline', (data) => {
        console.log('🟢 User online:', data);
        setConnectedUsers(prev => {
          const exists = prev.some(existingUser => existingUser.userId === data.userId);
          if (exists) return prev;
          
          return [...prev, {
            userId: data.userId,
            id: data.userId,
            name: data.user.name,
            email: data.user.email,
            status: 'online'
          }];
        });
        
        addMessage({
          type: 'system',
          message: `🟢 ${data.user.name} came online`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      socket.on('userOffline', (data) => {
        console.log('🔴 User offline:', data);
        setConnectedUsers(prev => prev.filter(user => user.userId !== data.userId));
        
        addMessage({
          type: 'system',
          message: `🔴 ${data.user.name} went offline`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

      // Typing indicators
      socket.on('userTyping', (data) => {
        const { userId, user: typingUser, isTyping } = data;
        
        setTypingUsers(prev => {
          if (isTyping) {
            const exists = prev.some(u => u.userId === userId);
            if (!exists) {
              return [...prev, { userId, name: typingUser.name }];
            }
            return prev;
          } else {
            return prev.filter(u => u.userId !== userId);
          }
        });

        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        }, 3000);
      });

      socket.on('error', (error) => {
        console.error('🚨 Socket error:', error);
        addMessage({
          type: 'system',
          message: `🚨 Socket error: ${error.message || error}`,
          timestamp: new Date().toLocaleTimeString()
        });
      });

    } catch (error) {
      console.error('❌ Socket connection failed:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
      Alert.alert('Connection Error', error.message);
      
      addMessage({
        type: 'system',
        message: `❌ Connection failed: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  // Handle typing indicator
  const handleTyping = (text, isPrivate = false) => {
    if (isPrivate) {
      setPrivateMessageInput(text);
    } else {
      setMessageInput(text);
    }

    if (socketRef.current && isConnected) {
      if (text.length > 0 && !isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', {
          roomId: messagingMode === 'room' ? currentRoom : null,
          isTyping: true
        });
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          socketRef.current.emit('typing', {
            roomId: messagingMode === 'room' ? currentRoom : null,
            isTyping: false
          });
        }
      }, 1000);
    }
  };

  // Send room message
  const sendRoomMessage = () => {
    if (!messageInput.trim() || !socketRef.current || !isConnected) {
      console.log('❌ Cannot send room message:', {
        hasMessage: !!messageInput.trim(),
        hasSocket: !!socketRef.current,
        isConnected
      });
      
      Alert.alert('Cannot Send Message', 'Please check your connection and try again.');
      return;
    }

    console.log('📤 Sending room message to:', currentRoom, 'Message:', messageInput.trim());
    
    try {
      socketRef.current.emit('roomMessage', {
        roomId: currentRoom,
        message: messageInput.trim()
      });

      setMessageInput('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketRef.current.emit('typing', {
          roomId: currentRoom,
          isTyping: false
        });
      }
      
      console.log('✅ Room message sent');
    } catch (error) {
      console.error('❌ Error sending room message:', error);
      Alert.alert('Send Error', 'Failed to send message');
    }
  };

  // Send private message
  const sendPrivateMessage = () => {
    if (!privateMessageInput.trim() || !selectedReceiver || !socketRef.current || !isConnected) {
      console.log('❌ Cannot send private message:', {
        hasMessage: !!privateMessageInput.trim(),
        hasReceiver: !!selectedReceiver,
        hasSocket: !!socketRef.current,
        isConnected
      });
      
      Alert.alert('Cannot Send Message', 'Please select a recipient and check your connection.');
      return;
    }

    console.log('📤 Sending private message to:', selectedReceiver.userId, 'Message:', privateMessageInput.trim());
    
    try {
      socketRef.current.emit('privateMessage', {
        recipientId: selectedReceiver.userId,
        message: privateMessageInput.trim()
      });

      // Add to local message history
      addMessage({
        type: 'private',
        sender: currentUser,
        receiver: selectedReceiver,
        message: privateMessageInput.trim(),
        direction: 'sent'
      });

      setPrivateMessageInput('');
      console.log('✅ Private message sent');
    } catch (error) {
      console.error('❌ Error sending private message:', error);
      Alert.alert('Send Error', 'Failed to send private message');
    }
  };

  // Join a new room
  const joinRoom = (roomId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinRoom', {
        roomId,
        metadata: { name: roomId, description: `Chat room: ${roomId}` }
      });
      setCurrentRoom(roomId);
      setShowRoomModal(false);
      setNewRoomName('');
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectedUsers([]);
      setCurrentUser(null);
    }
  };

  // Initialize connection on mount
  useEffect(() => {
    console.log('🚀 Component mounted, initializing connection...');
    connectToSocket();

    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnectSocket();
    };
  }, []);

  // Filter messages based on current mode
  const filteredMessages = messages.filter(msg => {
    if (messagingMode === 'room') {
      return msg.type === 'room' || msg.type === 'system';
    } else {
      return msg.type === 'private';
    }
  });

  // Render message item
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.direction === 'sent' || 
      (item.sender && currentUser && item.sender.email === currentUser.email);

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {item.type === 'system' ? (
          <View style={styles.systemMessage}>
            <Text style={styles.systemText}>{item.message}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        ) : (
          <>
            {!isOwnMessage && item.sender && (
              <Text style={styles.senderName}>{item.sender.name}</Text>
            )}
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
            <Text style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {item.timestamp}
            </Text>
          </>
        )}
      </View>
    );
  };

  // Render user item for selection
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedReceiver?.userId === item.userId && styles.selectedUser
      ]}
      onPress={() => {
        setSelectedReceiver(item);
        setShowUserModal(false);
      }}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💬 Messaging</Text>
        <View style={styles.connectionStatus}>
          <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
            {isConnecting ? '🟡 Connecting...' : isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, messagingMode === 'room' && styles.activeModeButton]}
          onPress={() => setMessagingMode('room')}
        >
          <Text style={[styles.modeButtonText, messagingMode === 'room' && styles.activeModeButtonText]}>
            🏠 Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, messagingMode === 'private' && styles.activeModeButton]}
          onPress={() => setMessagingMode('private')}
        >
          <Text style={[styles.modeButtonText, messagingMode === 'private' && styles.activeModeButtonText]}>
            📧 Private
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Context Display */}
      <View style={styles.contextBar}>
        {messagingMode === 'room' ? (
          <TouchableOpacity 
            style={styles.contextButton}
            onPress={() => setShowRoomModal(true)}
          >
            <Text style={styles.contextText}>Room: {currentRoom}</Text>
            <Text style={styles.changeText}>Tap to change</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.contextButton}
            onPress={() => setShowUserModal(true)}
          >
            <Text style={styles.contextText}>
              To: {selectedReceiver ? selectedReceiver.name : 'Select user'}
            </Text>
            <Text style={styles.changeText}>Tap to change</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={messageScrollViewRef}
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          messageScrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Text>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={messagingMode === 'room' ? messageInput : privateMessageInput}
            onChangeText={(text) => handleTyping(text, messagingMode === 'private')}
            placeholder={messagingMode === 'room' ? 'Type a message...' : 'Type a private message...'}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!isConnected || (messagingMode === 'room' ? !messageInput.trim() : !privateMessageInput.trim() || !selectedReceiver)) && styles.disabledButton
            ]}
            onPress={messagingMode === 'room' ? sendRoomMessage : sendPrivateMessage}
            disabled={!isConnected || (messagingMode === 'room' ? !messageInput.trim() : !privateMessageInput.trim() || !selectedReceiver)}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={clearMessages}>
          <Text style={styles.actionButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, !isConnected && styles.disabledButton]} 
          onPress={connectToSocket}
          disabled={isConnected || isConnecting}
        >
          <Text style={styles.actionButtonText}>🔄 Reconnect</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, !isConnected && styles.disabledButton]} 
          onPress={disconnectSocket}
          disabled={!isConnected}
        >
          <Text style={styles.actionButtonText}>🔌 Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* User Selection Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={connectedUsers.filter(user => user.userId !== currentUser?.id)}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.userId}
              style={styles.userList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Room Selection Modal */}
      <Modal
        visible={showRoomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Room</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRoomModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.roomInputContainer}>
              <TextInput
                style={styles.roomInput}
                value={newRoomName}
                onChangeText={setNewRoomName}
                placeholder="Enter room name..."
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.joinButton, !newRoomName.trim() && styles.disabledButton]}
                onPress={() => newRoomName.trim() && joinRoom(newRoomName.trim())}
                disabled={!newRoomName.trim()}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.predefinedRooms}>
              <Text style={styles.predefinedTitle}>Quick Join:</Text>
              {['general', 'random', 'help', 'announcements'].map(room => (
                <TouchableOpacity
                  key={room}
                  style={[styles.roomOption, currentRoom === room && styles.selectedRoom]}
                  onPress={() => joinRoom(room)}
                >
                  <Text style={styles.roomOptionText}>#{room}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Connection Error Display */}
      {connectionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{connectionError}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  activeModeButton: {
    backgroundColor: '#007bff',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  contextBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contextButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  changeText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginVertical: 2,
    maxWidth: '90%',
  },
  systemText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownMessageText: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  otherMessageText: {
    backgroundColor: '#fff',
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 4,
  },
  ownTimestamp: {
    color: '#666',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#999',
    textAlign: 'left',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: width * 0.9,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  userList: {
    maxHeight: height * 0.5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUser: {
    backgroundColor: '#e3f2fd',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  roomInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  roomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  predefinedRooms: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  predefinedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  roomOption: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedRoom: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  roomOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '500',
  },
});