import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TicketForm from '../screens/TicketForm';
import TicketCard from './TicketCard';
import Login from '../screens/auth/Login';
import register from '../screens/auth/Register'

const Stack = createNativeStackNavigator();

export default function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TicketCard"
        component={TicketCard}
        // options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TicketForm"
        component={TicketForm}
        // options={{ headerShown: false }}
      />
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

    </Stack.Navigator>
  );
}