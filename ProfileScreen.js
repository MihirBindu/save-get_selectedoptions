// ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  getItemByPartitionKeyLevel2,
  getItemByPartitionKeyLevel3,
  getItemByPartitionKeyLevel4,
  getItemByPartitionKey,
} from "./dynamoDbServicemcq";
import { getUserProgress, getSelectedOptions } from "./dynamoDbService"; // Import the new function

const ProfileScreen = ({ route }) => {
  // Extracting user data from navigation params
  const { userData } = route.params;

  // State variables
  const [userPoints, setUserPoints] = useState(null);
  const [levelData, setLevelData] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });

  // Navigation and focus hooks
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Fetch data for each level and user points
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch last attempted question for Level 1
        const lastAttemptedQuestionLevel1 = await getUserProgress(
          userData.username,
          1
        );
        // Fetch selected options for Level 1
        const selectedOptionsLevel1 = await getSelectedOptions(
          userData.username,
          1
        );
        // Fetch data for Level 1 using the last attempted question from Level 1
        const dataLevel1 = await getItemByPartitionKey(
          lastAttemptedQuestionLevel1,
          1
        );
        setLevelData((prevData) => ({ ...prevData, 1: dataLevel1 }));
        setUserPoints(userData.points);
        // Similar logic for Level 3 and Level 4
      } catch (error) {
        console.error("Error fetching data for levels:", error.message);
      }
    };

    // Fetch data only when the screen is focused
    if (isFocused) {
      fetchData();
    }
  }, [isFocused, userData]);

  // Handle click on Stats button
  const handleStatsButtonClick = () => {
    // Navigate to StatsScreen
    navigation.navigate("StatsScreen", {
      username: userData.username,
    });
  };

  // Handle click on Level buttons
  const handleLevelButtonClick = async (level) => {
    try {
      // Fetch last attempted question for the selected level
      const lastAttemptedQuestion = await getUserProgress(
        userData.username,
        level
      );
      // Fetch selected options for the selected level
      const selectedOptions = await getSelectedOptions(
        userData.username,
        level
      );
      // Fetch data for the selected level using the last attempted question
      const data = await getItemByPartitionKey(lastAttemptedQuestion, level);

      setLevelData((prevData) => ({ ...prevData, [level]: data }));
      setUserPoints(userData.points);

      // Navigate to the corresponding Level screen
      navigation.navigate(`Level${level}Screen`, {
        username: userData.username,
        points: userData.points,
        questionId: lastAttemptedQuestion,
        selectedOptions: selectedOptions, // Pass selected options to the Level screen
      });
    } catch (error) {
      console.error(`Error fetching data for level ${level}:`, error.message);
    }
  };

  // Render UI
  return (
    <ImageBackground
      source={require("./assets/image5.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        {/* Level buttons */}
        {Array.from({ length: 4 }, (_, index) => index + 1).map((level) => (
          <TouchableOpacity
            key={level}
            style={styles.levelButtonStyles[level]}
            onPress={() => handleLevelButtonClick(level)}
          >
            <Text style={styles.buttonText}>Level {level}</Text>
          </TouchableOpacity>
        ))}

        {/* Practice and Stats buttons */}
        <TouchableOpacity
          style={styles.Practice}
          onPress={() => handleLevelButtonClick("Practice")}
        >
          <Text style={styles.buttonText}>PRACTICE QUESTION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Stats} onPress={handleStatsButtonClick}>
          <Text style={styles.buttonText}>YOUR STATS</Text>
        </TouchableOpacity>

        {/* Display user data for Level 1 if available */}
        {levelData[1] && (
          <View style={styles.level1DataContainer}>
            {/* Add other data fields as needed */}
            <Text>Points: {userPoints}</Text>
            {/* Add other user-related data */}
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
  },
  // Styles for Level buttons
  levelButtonStyles: {
    1: {
      marginTop: 20,
      backgroundColor: "#40E0D0",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      right: 80,
      top: -87,
      height: 80,
      width: 110,
    },
    2: {
      // Add or modify styles as needed
      marginTop: 20,
      backgroundColor: "#40E0D0",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      left: 80,
      top: -187,
      height: 80,
      width: 110,
    },
    3: {
      // Add or modify styles as needed
      marginTop: 20,
      backgroundColor: "#40E0D0",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      right: 80,
      top: -157,
      height: 80,
      width: 110,
    },
    4: {
      // Add or modify styles as needed
      marginTop: 20,
      backgroundColor: "#40E0D0",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      left: 80,
      top: -257,
      height: 80,
      width: 110,
    },
  },
  // Styles for Practice and Stats buttons
  Practice: {
    marginTop: 20,
    backgroundColor: "#40E0D0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    top: -207,
    height: 80,
    width: 310,
  },
  Stats: {
    marginTop: 20,
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    top: -187,
    height: 80,
    width: 310,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    alignSelf: "center",
    top: 10,
  },
  level1DataContainer: {
    marginTop: 20,
  },
});

export default ProfileScreen;
