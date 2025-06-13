import { TextInput, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useState } from "react";

const MessageInput = ({ sendedMessage }) => {
  const [input, setInput] = useState('');

  const handlePress = () => {
    if (input.trim() === '') return;

    sendedMessage(input);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={(text) => setInput(text)}
        style={styles.input}
        placeholder="Message"
        value={input}
      />
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MessageInput;
