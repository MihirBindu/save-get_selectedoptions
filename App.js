// App.js
import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";
import ProfileScreen from "./ProfileScreen";
import Level1Screen from "./Level1Screen";
import Level2Screen from "./Level2Screen";
import Level3Screen from "./Level3Screen";
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }} // Hide header for all screens
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Level1Screen" component={Level1Screen} />
        <Stack.Screen name="Level2Screen" component={Level2Screen} />
        <Stack.Screen name="Level3Screen" component={Level3Screen} />
        <Stack.Screen name="SignIn" component={SignInForm} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require("./assets/image2.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <SignUpForm />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
  },
  linkText: {
    color: "blue",
    marginTop: 10,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover", // or "stretch"
    justifyContent: "center",
  },
});

export default App;
