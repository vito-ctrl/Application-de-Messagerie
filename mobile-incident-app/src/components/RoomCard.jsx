import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SimpleTabBar from './MyTabBar'

const TicketCard = ({ navigation }) => {
  return (
    <>
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardName}>cardName</Text>
          <Text style={styles.wordSubject}>Subject</Text>
          <Text style={styles.wordType}>adjective</Text>
          <Text style={styles.Message}>
            well meaning and kindly.{"\n"}
            "a benevolent smile"
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardName}>cardName</Text>
          <Text style={styles.wordSubject}>Subject</Text>
          <Text style={styles.wordType}>adjective</Text>
          <Text style={styles.Message}>
            well meaning and kindly.{"\n"}
            "a benevolent smile"
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardName}>cardName</Text>
          <Text style={styles.wordSubject}>Subject</Text>
          <Text style={styles.wordType}>adjective</Text>
          <Text style={styles.Message}>
            well meaning and kindly.{"\n"}
            "a benevolent smile"
          </Text>
        </View>
      </View>
      <SimpleTabBar navigation={navigation} />
    </View>
    </>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for fixed tab bar
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wordSubject: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  wordType: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
  },
  Message: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default TicketCard;