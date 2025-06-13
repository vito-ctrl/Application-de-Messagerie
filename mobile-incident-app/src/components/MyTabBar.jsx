import { View, Text, TouchableOpacity } from 'react-native';

export default function SimpleTabBar({ navigation }) { // Add navigation prop
  const handleTabPress = (screenName) => {
    navigation.navigate(screenName); // Use navigation prop
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleTabPress('TicketCard')}
      >
        <Text style={styles.tabText}>Tickets</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleTabPress('Login')}
      >
        <Text style={styles.tabText}>Login</Text>
      </TouchableOpacity>
       {/* <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleTabPress('SocketIOTest')}
      >
        <Text style={styles.tabText}>SocketTest</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = {
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeTab: {
    color: '#007bff',
    fontWeight: 'bold',
  },
};