import bot from './assets/bot.svg';
import user from './assets/user.svg';
import DetectLanguage from 'detectlanguage';

const detectlanguage = new DetectLanguage('2e6418dcb21d33e304463b333a62a9c9');

const form = document.querySelector('form');
const input = document.querySelector('textarea');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;
let disable = false;

function loader(element) {
    element.textContent = '';
    disable = true;

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0;
    let scrollInterval = setInterval(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 500);
    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            chatContainer.scrollTop = chatContainer.scrollHeight;
            clearInterval(interval);
            clearInterval(scrollInterval);
        }
    }, 20);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return `
        <div class="wrapper ${isAi ? 'ai' : 'user'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `;
}

const handleSubmit = async (e) => {
    e.preventDefault();

    if (disable) return;

    const data = new FormData(form);

    if (!data.get('prompt')) return;

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

    // to clear the textarea input
    form.reset();

    // bot's chatstripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, '', uniqueId);

    // to focus scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div
    const messageDiv = document.getElementById(uniqueId);

    // messageDiv.innerHTML = "..."
    loader(messageDiv);

    const response = await fetch(import.meta.env.VITE_SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: data.get('prompt'),
        }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';
    let responseMessage = '';

    if (response.ok) {
        const data = await response.json();
        responseMessage = data.bot.trim(); // trims any trailing spaces/'\n'
    } else {
        const error = await response.json();
        responseMessage = error.message;
    }
    disable = false;

    textToSpeechAndTyping(messageDiv, responseMessage, 1000);
};

input.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        e.preventDefault();
    }
});

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e);
    }
});

function textToSpeechAndTyping(element, text, typingDelay) {
    detectlanguage
        .detectCode(text)
        .then((code) => {
            if (responsiveVoice.voiceSupport()) {
                switch (code) {
                    case 'vi':
                        responsiveVoice.speak(text, 'Vietnamese Female');
                        break;
                    case 'en':
                    default:
                        responsiveVoice.speak(text, 'US English Female');
                }
            }
            setTimeout(() => {
                typeText(element, text);
            }, typingDelay);
        })
        .catch((error) => console.log(error));
}
