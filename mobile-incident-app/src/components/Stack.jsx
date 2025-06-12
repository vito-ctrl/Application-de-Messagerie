import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import register from '../screens/auth/Register'
import SocketIOTest from "../screens/SocketIOTest"

const Stack = createNativeStackNavigator();

export default function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={Login}
        // options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={register}
        // options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SocketTest"
        component={SocketIOTest}
        // options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}