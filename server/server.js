import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openAi = new OpenAIApi(configuration);

const app = express();
app.use(
    cors({
        origin: '*',
    }),
);
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello from CodeX chat bot',
    });
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        const response = await openAi.createCompletion({
            model: 'text-davinci-003',
            prompt: `${prompt}`,
            temperature: 0.5, // Higher values means the model will take more risks.
            max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
            top_p: 1, // alternative to sampling with temperature, called nucleus sampling
            frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
        });
        res.status(200).send({
            bot: response.data.choices[0].text,
        });
    } catch (error) {
        const errorStatus = error.status;
        if (errorStatus === 429) {
            return res.status(429).send({
                status: 429,
                message: 'Too many request, please wait!',
            });
        }
        if (errorStatus === 401) {
            return res.status(401).send({
                status: 401,
                message: 'Đứa mô chơi mất dạy xóa API KEY của tui gùi!',
            });
        }
        res.status(errorStatus).send({
            status: errorStatus,
            message: 'Something went wrong, please try again later.',
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
