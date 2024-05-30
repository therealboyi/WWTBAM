document.addEventListener('DOMContentLoaded', () => {
    const tokenUrl = 'https://opentdb.com/api_token.php?command=request';
    const unsplashAccessKey = ''; // Replace with your Unsplash API Access Key
    let apiUrl = 'https://opentdb.com/api.php?amount=10&category=11&difficulty=easy&type=multiple';
    const gameContainer = document.getElementById('game');
    const startGameButton = document.getElementById('start-game');
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options');
    const lifelineButton = document.getElementById('lifeline');
    const resetButton = document.getElementById('reset');
    const currentCountElement = document.getElementById('current-count');
    const lifelineCountElement = document.getElementById('lifeline-count');
    const messageElement = document.getElementById('message');
    const continueButton = document.createElement('button');
    const gameOptionsForm = document.getElementById('game-options');
    const numQuestionsInput = document.getElementById('num-questions');
    const categorySelect = document.getElementById('category');
    const difficultySelect = document.getElementById('difficulty');
    const questionImage = document.getElementById('question-image');
    const defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/en/b/bd/Logo_of_Nigerian_Millionaire.jpg';

    continueButton.textContent = 'Continue';
    continueButton.classList.add('hidden');
    continueButton.addEventListener('click', () => {
        if (isAnswerCorrect) {
            resetSelectedOptions();
            if (currentQuestionIndex < questions.length) {
                displayQuestion(questions[currentQuestionIndex]);
                continueButton.classList.add('hidden');
                lifelineButton.classList.remove('hidden');
            } else {
                showFinalScore();
            }
            isAnswerCorrect = false; // Reset the flag
        }
    });

    gameContainer.appendChild(continueButton);

    const backgroundMusic = document.getElementById('background-music');
    const winMusic = document.getElementById('win-music');
    const loseMusic = document.getElementById('lose-music');

    // Set volume to 25%
    backgroundMusic.volume = 0.25;
    winMusic.volume = 0.25;
    loseMusic.volume = 0.25;

    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswer;
    let lifelineUsed = false;
    let currentCount = 0;
    let lifelinesRemaining = 3;
    let isAnswerCorrect = false; // Flag to track if the answer was correct

    async function startGame() {
        try {
            // Construct the API URL based on the form values
            const numQuestions = numQuestionsInput.value;
            const category = categorySelect.value;
            const difficulty = difficultySelect.value;
            let apiUrl = `https://opentdb.com/api.php?amount=${numQuestions}&type=multiple`;

            if (category) {
                apiUrl += `&category=${category}`;
            }
            if (difficulty) {
                apiUrl += `&difficulty=${difficulty}`;
            }

            console.log('API URL:', apiUrl); // Debugging

            startGameButton.classList.add('hidden');
            gameOptionsForm.classList.add('hidden');
            currentCountElement.classList.remove('hidden');
            lifelineCountElement.classList.remove('hidden');
            questionContainer.classList.remove('hidden');
            lifelineButton.classList.remove('hidden');
            backgroundMusic.play();
            await initializeGame(apiUrl);
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    async function initializeGame(apiUrl) {
        try {
            const tokenResponse = await fetch(tokenUrl);
            const tokenData = await tokenResponse.json();
            const token = tokenData.token;
            apiUrl += `&token=${token}`;
            await fetchQuestions(apiUrl);
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    }

    async function fetchQuestions(apiUrl) {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            questions = data.results;
            displayQuestion(questions[currentQuestionIndex]);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    }

    async function fetchUnsplashImage(query) {
        try {
            const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&client_id=${unsplashAccessKey}`);
            const data = await response.json();
            if (data.results.length > 0) {
                return data.results[0].urls.small;
            } else {
                return defaultImageUrl;
            }
        } catch (error) {
            console.error('Error fetching image from Unsplash:', error);
            return defaultImageUrl;
        }
    }

    async function displayQuestion(questionData) {
        questionElement.innerHTML = decodeHTMLEntities(questionData.question);
        optionsContainer.innerHTML = '';

        correctAnswer = decodeHTMLEntities(questionData.correct_answer);
        const options = [...questionData.incorrect_answers.map(decodeHTMLEntities), correctAnswer];
        shuffleArray(options);

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option');
            button.addEventListener('click', () => selectOption(button, option));
            optionsContainer.appendChild(button);
        });

        lifelineUsed = false;

        // Hide the image element initially
        questionImage.style.display = 'none';

        // Fetch image from Unsplash
        const imageQuery = questionData.category + ' ' + questionData.question.split(' ').slice(0, 5).join(' ');
        const imageUrl = await fetchUnsplashImage(imageQuery);
        
        // Update the image source and show the image
        questionImage.src = imageUrl;
        questionImage.onload = () => {
            questionImage.style.display = 'block';
        };
        questionImage.onerror = () => {
            questionImage.src = defaultImageUrl;
            questionImage.style.display = 'block';
        };
    }

    function decodeHTMLEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function selectOption(button, selectedOption) {
        resetSelectedOptions();
        lifelineButton.classList.add('hidden');
        button.classList.add('selected');
        disableOptions();
        setTimeout(() => {
            if (selectedOption === correctAnswer) {
                button.style.backgroundColor = 'green';
                blinkCorrectAnswer();
                currentCount += 1000000;
                currentCountElement.textContent = `Amount Won: $${currentCount.toLocaleString()}`;
                currentQuestionIndex++;
                isAnswerCorrect = true;
                if (currentQuestionIndex < questions.length) {
                    continueButton.classList.remove('hidden');
                } else {
                    backgroundMusic.pause();
                    winMusic.play();
                    messageElement.textContent = `Congratulations! You are now a Millionaire!!! $${currentCount.toLocaleString()}`;
                    messageElement.classList.remove('hidden');
                    hideGameElements();
                }
            } else {
                button.style.backgroundColor = 'red';
                showCorrectAnswer();
                backgroundMusic.pause();
                loseMusic.play();
                messageElement.textContent = `Wrong! The correct answer was ${correctAnswer}.`;
                messageElement.classList.remove('hidden');
                isAnswerCorrect = false; // Set the flag to false since the answer was wrong
                showFinalScore(); // Show the final score after the wrong answer
            }
        }, 500);
    }

    function disableOptions() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.disabled = true; // Disable each option
        });
    }

    function resetSelectedOptions() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.classList.remove('selected');
            option.style.backgroundColor = '';
            option.disabled = false; // Enable each option
        });
    }

    function showCorrectAnswer() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            if (option.textContent === correctAnswer) {
                option.style.backgroundColor = 'green';
                option.classList.add('blink');
                setTimeout(() => {
                    option.classList.remove('blink');
                }, 2000);
            }
        });
    }

    function blinkCorrectAnswer() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            if (option.textContent === correctAnswer) {
                option.style.backgroundColor = 'green';
                option.classList.add('blink');
                setTimeout(() => {
                    option.classList.remove('blink');
                    option.style.backgroundColor = 'green';
                }, 2000);
            }
        });
    }

    function hideGameElements() {
        questionContainer.classList.add('hidden');
        resetButton.classList.remove('hidden');
        currentCountElement.classList.add('hidden');
        lifelineCountElement.classList.add('hidden');
    }

    function showFinalScore() {
        questionContainer.classList.add('hidden');
        currentCountElement.classList.add('hidden');
        lifelineCountElement.classList.add('hidden');
        messageElement.textContent = `You walked away with $${currentCount.toLocaleString()}`;
        messageElement.classList.remove('hidden');
        continueButton.classList.add('hidden');
        resetButton.classList.remove('hidden');
        resetButton.style.marginTop = '20px'; // Add margin top to position it correctly
    }

    function resetGame() {
        currentQuestionIndex = 0;
        currentCount = 0;
        lifelinesRemaining = 3;
        currentCountElement.textContent = 'Amount Won: $0';
        lifelineCountElement.textContent = 'Lifelines Remaining: 3';
        questionContainer.classList.add('hidden');
        lifelineButton.classList.add('hidden');
        resetButton.classList.add('hidden');
        winMusic.pause();
        loseMusic.pause();
        backgroundMusic.currentTime = 0; // Reset the music to the beginning
        backgroundMusic.play();
        messageElement.classList.add('hidden');
        startGameButton.classList.remove('hidden');
        gameOptionsForm.classList.remove('hidden');
        questionImage.src = defaultImageUrl; // Reset to default image
    }

    function useLifeline() {
        if (lifelineUsed || lifelinesRemaining === 0) return;

        const options = Array.from(document.getElementsByClassName('option'));
        let incorrectOptions = options.filter(option => option.textContent !== correctAnswer);
        shuffleArray(incorrectOptions);

        incorrectOptions.slice(0, 2).forEach(option => option.style.display = 'none');
        lifelineUsed = true;
        lifelinesRemaining--;
        lifelineCountElement.textContent = `Lifelines Remaining: ${lifelinesRemaining}`;
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            backgroundMusic.pause();
        } else {
            backgroundMusic.play();
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    startGameButton.addEventListener('click', startGame);
    lifelineButton.addEventListener('click', useLifeline);
    resetButton.addEventListener('click', resetGame);
});
