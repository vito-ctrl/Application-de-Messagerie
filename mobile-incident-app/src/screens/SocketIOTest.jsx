// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';

// Update this to your actual server address
const SOCKET_SERVER_URL = 'http://192.168.30.136:3000'; 

export default function SocketIOTest() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'], // avoid long polling
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
    });

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: msg }]);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.emit('message', message);
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: `You: ${message}` }]);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
      />
      <TextInput
        placeholder="Type a message"
        value={message}
        onChangeText={setMessage}
        style={styles.input}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    borderColor: '#aaa',
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  message: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
