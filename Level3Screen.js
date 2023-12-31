import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from "react-native";
import { getItemByPartitionKey3 } from "./dynamoDbServicemcq"; // Adjust the import based on your service
import {
  savePointsToDynamoDB,
  saveAnswerStatusToDynamoDB,
  getItemByUsername,
  saveLastAttemptedQuestion,
} from "./dynamoDbService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressCircle from "react-native-progress/Circle";
import { useNavigation } from "@react-navigation/native";

const MAX_POINTS = 100;

const Level3Screen = ({ route }) => {
  const { level3Data, username, questionId } = route.params;
  const navigation = useNavigation();

  const [currentId, setCurrentId] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(level3Data);
  const [selectedOptions3, setSelectedOptions3] = useState({});
  const [userPoints, setUserPoints] = useState(0);
  const [optionsData, setOptionsData] = useState([]);

  const CircleButton = ({ title, onPress }) => (
    <TouchableOpacity style={styles.circleButton} onPress={onPress}>
      <Text style={styles.circleButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    setCurrentId(questionId);

    const fetchQuestion = async () => {
      try {
        const currentQuestion = await getItemByPartitionKey3(questionId);
        setCurrentQuestion(currentQuestion);
      } catch (error) {
        console.error("Error fetching question:", error.message);
      }
    };

    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const userData = await getItemByUsername(username);
        console.log("Fetched User Data:", userData);
        const points = userData.points_level3 || 0;
        setUserPoints(points);
      } catch (dbError) {
        console.error("Error fetching user data:", dbError.message);
      }
    };

    // Fetch user points when the component mounts or when the username changes
    fetchUserPoints();
  }, [username]); // Ensure that username is included in the dependency array

  useEffect(() => {
    // Update optionsData when currentQuestion changes
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

  const loadSelectedOptions = async () => {
    try {
      const storedOptions = await AsyncStorage.getItem(
        `${username}_selectedOptions_Level3`
      );
      if (storedOptions) {
        setSelectedOptions3(JSON.parse(storedOptions));
      }
    } catch (error) {
      console.error("Error loading selected options:", error.message);
    }
  };

  const saveSelectedOptions = async () => {
    try {
      await AsyncStorage.setItem(
        `${username}_selectedOptions_Level3`,
        JSON.stringify(selectedOptions3)
      );
    } catch (error) {
      console.error("Error saving selected options:", error.message);
    }
  };

  useEffect(() => {
    loadSelectedOptions();
  }, []);

  useEffect(() => {
    saveSelectedOptions();
  }, [selectedOptions3]);

  const renderOption = ({ item, index }) => {
    const selectedOptionInfo = selectedOptions3[currentId];

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

  const handleOptionPress = async (index, selectedAnswer) => {
    if (selectedOptions3[currentId]) {
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    setSelectedOptions3((prevSelectedOptions) => ({
      ...prevSelectedOptions,
      [currentId]: {
        selectedOption: index,
        isCorrect: isCorrect,
      },
    }));

    const questionIdString = currentId.toString();
    if (isCorrect) {
      const updatedPoints = userPoints + 1;
      setUserPoints(updatedPoints);

      try {
        await savePointsToDynamoDB(username, updatedPoints, 3); // Pass the correct level parameter (3 in this case)
        await saveAnswerStatusToDynamoDB(username, questionIdString, "correct");
      } catch (dbError) {
        console.error("Error saving data to DynamoDB:", dbError.message);
      }
    } else {
      try {
        await saveAnswerStatusToDynamoDB(
          username,
          questionIdString,
          "incorrect"
        );
      } catch (dbError) {
        console.error("Error saving data to DynamoDB:", dbError.message);
      }
    }
  };

  const handleNext = async () => {
    const nextId = parseInt(currentId, 10) + 1;
    const nextQuestionId = nextId.toString();

    // Log values for debugging
    console.log("username:", username);
    console.log("nextId:", nextId);
    console.log("nextQuestionId:", nextQuestionId);

    try {
      const nextQuestion = await getItemByPartitionKey3(nextId);

      if (!nextQuestion || typeof nextQuestion.id_level_3 === "undefined") {
        console.error("Invalid question data:", nextQuestion);
        return;
      }

      await saveLastAttemptedQuestion(username, 3, nextId, nextQuestionId); // Assuming level 3, modify the level accordingly
      setCurrentId(nextQuestion.id_level_3);
      setCurrentQuestion(nextQuestion);
    } catch (error) {
      console.error("Error fetching next question:", error.message);
    }
  };

  const handlePrevious = async () => {
    const previousId = parseInt(currentId, 10) - 1;

    if (previousId >= 1) {
      try {
        const previousQuestion = await getItemByPartitionKey3(previousId);
        await saveLastAttemptedQuestion(
          username,
          3,
          previousId,
          previousQuestion.id_level_3
        );
        setCurrentId(previousQuestion.id_level_3);
        setCurrentQuestion(previousQuestion);
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
                  Q{currentQuestion.id_level_3}
                </Text>
              </View>

              {/* Existing components */}
              <View style={styles.progressBarContainer}>
                <ProgressCircle
                  size={62}
                  thickness={8}
                  progress={userPoints / MAX_POINTS}
                  showsText={true}
                  formatText={() => `Points: ${userPoints}`} // Display the updated user points
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
                          selectedOptions3 &&
                            selectedOptions3[currentId] &&
                            selectedOptions3[currentId].selectedOption ===
                              index &&
                            (selectedOptions3[currentId].isCorrect
                              ? styles.correctOption
                              : styles.incorrectOption),
                        ]}
                        onPress={() => handleOptionPress(index, item)}
                        disabled={
                          selectedOptions3 &&
                          selectedOptions3[currentId] !== undefined
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
});

export default Level3Screen;
