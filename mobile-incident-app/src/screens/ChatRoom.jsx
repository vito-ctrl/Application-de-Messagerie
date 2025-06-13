import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import MessageInput from "../components/MessageInput";

export const ChatRoom = () => {
    const [messages, setMessages] = useState([])
    const scrollViewRef = useRef();
    
    const received = [
      "hi", "hru", "all good"
    ]
    
    const handleSendMessage  = (message) => {
      setMessages((prev) => [...prev, message]);
    }
    
    useEffect(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);
    console.log('in the parent comp : ', messages)

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90} 
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.message}>Hello 👋</Text>
        <Text style={styles.message}>How are you?</Text>
        <Text style={styles.message}>I'm good, thanks!</Text>
        
        <Text style={styles.received}>all good</Text>
        {messages.map((msg, i) => (
          <Text key={i} style={styles.message}>{msg}</Text>
        ))}
        {/* {received.map((element, index) => (
          <Text key={index} style={styles.received}>{element}</Text>
        ))} */}
      </ScrollView>

      <MessageInput sendedMessage={handleSendMessage}/>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "flex-end",
  },
  message: {
    padding: 10,
    backgroundColor: "#e1e1e1",
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-end",
  },
  received: {
    padding: 10,
    color: 'white',
    backgroundColor: "black",
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  }
});
