import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import SimpleTabBar from '../components/MyTabBar';

export default function TicketForm({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async() => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    const res = await fetch('http://localhost:5000/api/tickets',{
        method: 'POST',
        headers: {
            'authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzBhMzNlYTc3MDE2MGEzZjlkYzZhZCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4MDE5Mjg4LCJleHAiOjE3NDg2MjQwODh9.qCNhnGm5vTMUS_fCOhR9RCVZlizm7Huema7-Kfth7u4',
            'Content-Type': 'application/json'
        }
    })
    const result = await res.json()
    console.log(result)

    // Simulate ticket submission
    Alert.alert('Success', 'Ticket submitted successfully!', [
      {
        text: 'OK',
        onPress: () => setForm({ name: '', email: '', subject: '', message: '' })
      }
    ]);
  };


  console.log(form)

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Submit a Ticket
        </Text>

        <TextInput
          placeholder="Name"
          value={form.name}
          onChangeText={(value) => handleChange('name', value)}
          style={styles.input}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Email"
          value={form.email}
          onChangeText={(value) => handleChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Subject"
          value={form.subject}
          onChangeText={(value) => handleChange('subject', value)}
          style={styles.input}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Message"
          value={form.message}
          onChangeText={(value) => handleChange('message', value)}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.messageInput]}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
      <SimpleTabBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra space for fixed tab bar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});