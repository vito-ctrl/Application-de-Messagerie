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

// Add navigation prop here
export default function Register({ navigation }) {
  const [signup, setSignup] = useState({});
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length < 2 ? 'Name must be at least 2 characters long' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        // More comprehensive password validation to match server requirements
        if (value.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Password must contain at least one number';
        }
        if (!/(?=.*[@$!%*?&])/.test(value)) {
          return 'Password must contain at least one special character (@$!%*?&)';
        }
        return '';
      case 'Phone':
        const phoneRegex = /^[0-9]{10,}$/;
        return !phoneRegex.test(value.replace(/\s/g, '')) ? 'Please enter a valid phone number (at least 10 digits)' : '';
      case 'comfiPassword':
        return value !== signup.password ? 'Confirmation password does not match' : '';
      default:
        return '';
    }
  };

  const handleInput = (name, value) => {
    setSignup({
      ...signup,
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
    Object.keys(signup).forEach(key => {
      const error = validateField(key, signup[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // Check if all required fields are filled
    const requiredFields = ['name', 'email', 'Phone', 'password', 'comfiPassword'];
    requiredFields.forEach(field => {
      if (!signup[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      console.log('Attempting to register with data:', signup);
      
      const res = await fetch('http://192.168.1.6:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(signup)
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      // Check if response is actually JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await res.text();
        console.log('Non-JSON response received:', textResponse);
        throw new Error('Server returned non-JSON response. Check if the server is running and the endpoint exists.');
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        // await AsyncStorage.setItem("SighnToken", data.token);
        console.log('Registration successful');
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        // Handle error response from server
        console.log('Server validation errors:', data);
        
        if (data.errors && Array.isArray(data.errors)) {
          // Handle server validation errors
          const serverErrors = {};
          data.errors.forEach(error => {
            if (error.path && error.msg) {
              serverErrors[error.path] = error.msg;
            }
          });
          
          setErrors(prev => ({
            ...prev,
            ...serverErrors,
            serverError: data.message || `Registration failed (${res.status})`
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            serverError: data.message || `Registration failed (${res.status})`
          }));
        }
      }
    } catch (error) {
      console.log('Full error object:', error);
      
      let errorMessage = "Network error. Please try again.";
      
      if (error.message.includes('Network request failed')) {
        errorMessage = "Cannot connect to server. Please check your connection and ensure the server is running.";
      } else if (error.message.includes('JSON Parse error') || error.message.includes('non-JSON response')) {
        errorMessage = "Server error. The server may be down or the endpoint may not exist.";
      }
      
      setErrors(prev => ({
        ...prev,
        serverError: errorMessage
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
          <Text style={styles.title}>Create Account</Text>
          
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError
              ]}
              placeholder="Name"
              placeholderTextColor="#999"
              value={signup.name || ''}
              onChangeText={(value) => handleInput('name', value)}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError
              ]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={signup.email || ''}
              onChangeText={(value) => handleInput('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.Phone && styles.inputError
              ]}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              value={signup.Phone || ''}
              onChangeText={(value) => handleInput('Phone', value)}
              keyboardType="phone-pad"
            />
            {errors.Phone ? <Text style={styles.errorText}>{errors.Phone}</Text> : null}
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
              value={signup.password || ''}
              onChangeText={(value) => handleInput('password', value)}
              secureTextEntry
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors.comfiPassword && styles.inputError
              ]}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={signup.comfiPassword || ''}
              onChangeText={(value) => handleInput('comfiPassword', value)}
              secureTextEntry
            />
            {errors.comfiPassword ? <Text style={styles.errorText}>{errors.comfiPassword}</Text> : null}
          </View>

          {/* Server Error */}
          {errors.serverError ? (
            <Text style={[styles.errorText, styles.serverError]}>
              {errors.serverError}
            </Text>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
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
    marginBottom: 30,
    color: '#333',
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