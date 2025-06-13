import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
  const [login, setLogin] = useState({});
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters long' : '';
      default:
        return '';
    }
  };

  const handleInput = (name, value) => {
    setLogin({
      ...login,
      [name]: value
    });

    // Validate the field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    const newErrors = {};
    Object.keys(login).forEach(key => {
      const error = validateField(key, login[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // Check if all required fields are filled
    const requiredFields = ['email', 'password'];
    requiredFields.forEach(field => {
      if (!login[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch('http://192.168.20.85:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(login)
      });
      const data = await res.json();
      
      if (res.ok) {
        // await AsyncStorage.setItem("SighnToken", data.token);
        console.log('login successful');
        Alert.alert('Success', 'user loged in successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('SocketTest') }
        ]);
      } else {
        // Handle error response from server
        setErrors(prev => ({
          ...prev,
          serverError: data.message || "Login failed"
        }));
      }
    //   console.log(data);
      if (!res.ok) {
        console.error('request error');
      }
    } catch (error) {
      console.log(error);
      setErrors(prev => ({
        ...prev,
        serverError: "Network error. Please try again."
      }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError
              ]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={login.email || ''}
              onChangeText={(value) => handleInput('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.password && styles.inputError
              ]}
              placeholder="Password"
              placeholderTextColor="#999"
              value={login.password || ''}
              onChangeText={(value) => handleInput('password', value)}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Server Error */}
          {errors.serverError && (
            <Text style={[styles.errorText, styles.serverError]}>
              {errors.serverError}
            </Text>
          )}

          {/* Sign In Button */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff4b2b',
    borderWidth: 2,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#ff4b2b',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#ff4b2b',
    fontSize: 14,
    fontWeight: '500',
  },
  serverError: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: 'black',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#ff4b2b',
    fontSize: 14,
    fontWeight: 'bold',
  },
});