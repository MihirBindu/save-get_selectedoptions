// Import necessary dependencies
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Button,
  ScrollView,
  ImageBackground,
} from "react-native";
import { getItemByPartitionKey } from "./dynamoDbServicemcq";
import { getItemByUsername } from "./dynamoDbService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressCircle from "react-native-progress/Circle";
import { useNavigation } from "@react-navigation/native";

// Define a constant for maximum points
const MAX_POINTS = 100;

const Level1Screen = ({ route }) => {
  // Destructure parameters from route
  const { level1Data, username, questionId } = route.params;
  const navigation = useNavigation();

  // State variables
  const [currentId, setCurrentId] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(level1Data);
  const [selectedOptions2, setSelectedOptions2] = useState({});
  const [userPoints, setUserPoints] = useState(0);
  const [optionsData, setOptionsData] = useState([]);

  // Define a reusable CircleButton component
  const CircleButton = ({ title, onPress }) => (
    <TouchableOpacity style={styles.circleButton} onPress={onPress}>
      <Text style={styles.circleButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  // Fetch question when component mounts or questionId changes
  useEffect(() => {
    setCurrentId(questionId);

    const fetchQuestion = async () => {
      try {
        const currentQuestion = await getItemByPartitionKey(questionId);
        setCurrentQuestion(currentQuestion);
      } catch (error) {
        console.error("Error fetching question:", error.message);
      }
    };

    fetchQuestion();
  }, [questionId]);

  // Fetch user points when the component mounts or username changes
  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const userData = await getItemByUsername(username);

        // Check if the user has previously attempted any questions
        if (userData.level1_lastAttemptedQuestion > 0) {
          setUserPoints(userData.points_level1 || 0);
        } else {
          // Reset the state if the user hasn't attempted any questions
          setUserPoints(0);
          setSelectedOptions2({});
        }
      } catch (dbError) {
        console.error("Error fetching user data:", dbError.message);
      }
    };

    // Fetch user points when the component mounts or when the username changes
    fetchUserPoints();

    // Log the updated value of userPoints
    console.log("User Points", userPoints);
  }, [username]);

  // Update optionsData when currentQuestion changes
  useEffect(() => {
    if (currentQuestion) {
      const updatedOptionsData = [
        currentQuestion.option1,
        currentQuestion.option2,
        currentQuestion.option3,
        currentQuestion.option4,
      ].filter((option) => option !== null && option !== undefined);

      setOptionsData(updatedOptionsData);
    }
  }, [currentQuestion]);

  // Render individual options
  const renderOption = ({ item, index }) => {
    const selectedOptionInfo = selectedOptions2[currentId];

    return (
      <TouchableOpacity
        style={[
          styles.button,
          selectedOptionInfo &&
            selectedOptionInfo.selectedOption === index &&
            (selectedOptionInfo.isCorrect
              ? styles.correctOption
              : styles.incorrectOption),
        ]}
        onPress={() => handleOptionPress(index, item)}
        disabled={selectedOptionInfo !== undefined}
      >
        <Text>{optionsData[index]}</Text>
      </TouchableOpacity>
    );
  };

  // Handle option press
  const handleOptionPress = async (index, selectedAnswer) => {
    if (selectedOptions2[currentId]) {
      return;
    }

    // Check if the selected option is correct
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    console.log("Correct Answer Index:", currentQuestion.correctAnswer);
    console.log("Selected Option Index:", index);
    console.log("Is Correct:", isCorrect);

    setSelectedOptions2((prevSelectedOptions) => ({
      ...prevSelectedOptions,
      [currentId]: {
        selectedOption: index,
        isCorrect: isCorrect,
      },
    }));

    // Update points if the selected option is correct
    if (isCorrect) {
      const updatedPoints = userPoints + 1; // Adjust the points as needed
      setUserPoints(updatedPoints);
    }

    // Introduce a delay (e.g., 500 milliseconds) before additional actions
    setTimeout(async () => {
      // You can add more logic here if needed
    }, 500);
  };

  // Handle next question
  const handleNext = async () => {
    const nextId = parseInt(currentId, 10) + 1;
    const nextQuestionId = nextId.toString();

    // Log values for debugging
    console.log("username:", username);
    console.log("nextId:", nextId);
    console.log("nextQuestionId:", nextQuestionId);

    try {
      const nextQuestion = await getItemByPartitionKey(nextId);

      if (!nextQuestion || typeof nextQuestion.id === "undefined") {
        console.error("Invalid question data:", nextQuestion);
        return;
      }

      // Introduce a delay (e.g., 500 milliseconds) before saving the last attempted question
      setTimeout(async () => {
        // You can add more logic here if needed
        setCurrentId(nextQuestion.id);
        setCurrentQuestion(nextQuestion);
      }, 500);
    } catch (error) {
      console.error("Error fetching next question:", error.message);
    }
  };

  // Handle previous question
  const handlePrevious = async () => {
    const previousId = parseInt(currentId, 10) - 1;

    if (previousId >= 1) {
      try {
        const previousQuestion = await getItemByPartitionKey(previousId);

        if (!previousQuestion || typeof previousQuestion.id === "undefined") {
          console.error("Invalid question data:", previousQuestion);
          return;
        }

        // Introduce a delay (e.g., 500 milliseconds) before saving the last attempted question
        setTimeout(async () => {
          // You can add more logic here if needed
          setCurrentId(previousQuestion.id);
          setCurrentQuestion(previousQuestion);
        }, 500);
      } catch (error) {
        console.error("Error fetching previous question:", error.message);
      }
    }
  };

  return (
    <ImageBackground
      source={require("./assets/image4.png")}
      style={styles.backgroundImage}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {currentQuestion && (
            <View style={styles.card}>
              {/* New View for the small card */}
              <View style={styles.questionCard}>
                {/* Display Q{currentQuestion.id} in the small card */}
                <Text style={styles.questionCardText}>
                  Q{currentQuestion.id}
                </Text>
              </View>

              {/* Existing components */}
              <View style={styles.progressBarContainer}>
                <ProgressCircle
                  size={62}
                  thickness={8}
                  progress={userPoints / MAX_POINTS}
                  showsText={true}
                  formatText={() =>
                    `Points: ${Math.round((userPoints / MAX_POINTS) * 100)}`
                  } // Round and display percentage
                />
              </View>
              <Image
                source={require("./assets/image6.png")}
                style={styles.imageBelowProgressBar}
              />
              <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.questionContainer}>
                  <Text style={styles.question}>
                    {currentQuestion.question}
                  </Text>
                  {currentQuestion.objectURL && (
                    <Image
                      source={{ uri: currentQuestion.objectURL }}
                      style={styles.image}
                    />
                  )}
                </View>

                {optionsData.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {optionsData.map((item, index) => (
                      <TouchableOpacity
                        key={index.toString()}
                        style={[
                          styles.button,
                          selectedOptions2 &&
                            selectedOptions2[currentId] &&
                            selectedOptions2[currentId].selectedOption ===
                              index &&
                            (selectedOptions2[currentId].isCorrect
                              ? styles.correctOption
                              : styles.incorrectOption),
                        ]}
                        onPress={() => handleOptionPress(index, item)}
                        disabled={
                          selectedOptions2 &&
                          selectedOptions2[currentId] !== undefined
                        }
                      >
                        <Text>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
              <View style={styles.buttonContainer}>
                <CircleButton title="Prev" onPress={handlePrevious} />
                <TouchableOpacity
                  style={styles.yourStatsButton}
                  onPress={() => {
                    navigation.navigate("StatsScreen", { username });
                  }}
                >
                  <Text style={styles.yourStatsButtonText}>Your Stats</Text>
                </TouchableOpacity>
                <CircleButton title="Next" onPress={handleNext} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    height: 725, // Fixed height
    marginTop: 65,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "contain",
    justifyContent: "center",
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "contain",
    marginTop: 10,
    borderRadius: 5,
  },
  optionsContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: "#57d7e3",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  correctOption: {
    backgroundColor: "green",
  },
  incorrectOption: {
    backgroundColor: "red",
  },
  pointsText: {
    alignSelf: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  optionsContainer: {
    marginTop: 10,
    marginBottom: 10, // Adjusted marginBottom
  },
  optionsContent: {
    flexGrow: 1,
    maxHeight: 210, // Adjust the height as needed
  },
  questionCard: {
    backgroundColor: "#ffb58a",
    padding: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
    // marginBottom: 5, // Adjust as needed
  },
  questionCardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  questionContainer: {
    backgroundColor: "#004aad",
    padding: 15,
    borderRadius: 10,
    marginTop: 15, // Adjusted marginTop
    marginBottom: 10, // Adjusted marginBottom
    // top: -10,
  },
  question: {
    color: "#fff", // Set the text color to white
    fontSize: 15,
    // fontWeight: "bold",
    marginBottom: 10,
  },
  progressBarContainer: {
    alignSelf: "flex-end",
    // marginTop: 5,
    top: -50,
    left: 5,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: "#004aad",
    justifyContent: "center",
    alignItems: "center",
  },
  circleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageBelowProgressBar: {
    width: "50%",
    height: 50, // Adjust the height as needed
    resizeMode: "contain",
    // marginTop: 10,
    borderRadius: 5,
    top: -105,
    left: 83,
  },
  contentContainer: {
    marginTop: -70,
  },
  scrollContent: {
    flexGrow: 1,
  },
  yourStatsButton: {
    width: 120,
    height: 60,
    borderRadius: 25,
    backgroundColor: "#000", // Black background color
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fff", // White border color
    borderWidth: 2, // Border width
    marginHorizontal: 10, // Adjust as needed
  },

  yourStatsButtonText: {
    color: "#fff", // White text color
    fontSize: 16,
    fontWeight: "bold",
  },
  correctOption: {
    backgroundColor: "green",
  },
  incorrectOption: {
    backgroundColor: "red",
  },
});

export default Level1Screen;
