// SignUpForm.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { signUp } from "./cognitoService";
import { saveUsernameToDynamoDB } from "./dynamoDbService";
import VerificationCodeForm from "./VerificationCodeForm";

const SignUpForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const handleSignUp = async () => {
    try {
      await signUp(username, password, email);
      // await saveUsernameToDynamoDB(username, 0);
      setErrorMessage("");
      setShowVerification(true); // Show the verification code form
      console.log("Sign-up successful");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleVerificationSuccess = () => {
    // Handle successful verification (e.g., navigate to the next screen)
    console.log("Verification successful");
    // Add navigation logic or any other action after successful verification
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={(text) => setUsername(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <View style={{ marginVertical: 10 }} />
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={{ color: "white" }}>Sign Up</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {showVerification && (
        <VerificationCodeForm
          username={username}
          onVerificationSuccess={handleVerificationSuccess}
          onVerificationError={() => setShowVerification(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  signUpButton: {
    backgroundColor: "blue",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
});

export default SignUpForm;
