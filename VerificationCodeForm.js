// VerificationCodeForm.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { confirmSignUp } from "./cognitoService";

const VerificationCodeForm = ({
  username,
  onVerificationSuccess,
  onVerificationError,
}) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerification = async () => {
    try {
      await confirmSignUp(username, verificationCode);
      setErrorMessage("");
      onVerificationSuccess();
    } catch (error) {
      setErrorMessage(error.message);
      onVerificationError();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Verification Code"
          value={verificationCode}
          onChangeText={(text) => setVerificationCode(text)}
        />
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerification}
        >
          <Text style={{ color: "white" }}>Verify</Text>
        </TouchableOpacity>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    top: 40,
  },
  form: {
    width: "80%",
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
  verifyButton: {
    backgroundColor: "green", // Choose your color
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

export default VerificationCodeForm;
