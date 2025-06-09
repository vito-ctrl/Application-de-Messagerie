// index.js
import { View, StyleSheet } from "react-native";
import MyStack from "../src/components/Stack";
import {AsyncStorage} from 'react-native';

export default function Page() {
  const storage = async() => {
    const req = await AsyncStorage.setItem('key', '1234567')
  } 
  
  const res = AsyncStorage.getItem('key')
  console.log(res);

  return (
    <View style={styles.container}>
      <MyStack />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});