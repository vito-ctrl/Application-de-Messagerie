// index.js
import { View, StyleSheet } from "react-native";
import MyStack from "../src/components/Stack";

export default function Page() {

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