import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import Login from '../screens/auth/Login';
// import register from '../screens/auth/Register'
import { ChatRoom } from '../screens/ChatRoom';

const Stack = createNativeStackNavigator();

export default function MyStack() {
  return (
    <Stack.Navigator>
      {/* <Stack.Screen
        name="Login"
        component={Login}
      />
      <Stack.Screen
        name="Register"
        component={register}
      /> */}
      <Stack.Screen
        name="Chat Room"
        component={ChatRoom}
      />
    </Stack.Navigator>
  );
}