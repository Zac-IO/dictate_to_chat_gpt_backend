import {ChatGPTAPI} from 'chatgpt';
import * as dotenv from 'dotenv';
import fs from "fs";
import ffmpeg from "fluent-ffmpeg"
import {Readable} from "stream"
import * as mic from "mic"
import ffmpegPath from "@ffmpeg-installer/ffmpeg"
import {Configuration, OpenAIApi} from "openai";

dotenv.config()
ffmpeg.setFfmpegPath(ffmpegPath.path);
const configuration = new Configuration({
    apiKey:process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);

//process.env.OPEN_API_KEY

// Record audio
function recordAudio(filename) {
    return new Promise((resolve, reject) => {
        const micInstance = new mic({
            rate: '16000',
            channels: '1',
            fileType: 'wav',
        });

        const micInputStream = micInstance.getAudioStream();
        const output = fs.createWriteStream(filename);
        const writable = new Readable().wrap(micInputStream);

        console.log('Recording... Press Ctrl+C to stop.');

        writable.pipe(output);

        micInstance.start();

        process.on('SIGINT', () => {
            micInstance.stop();
            console.log('Finished recording');
            // @ts-ignore
            resolve();
        });

        micInputStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function transcribe_audio(file_name){
    const file_stream = fs.createReadStream(file_name)
    const buff = new Array();
    file_stream.on("data",(chunk) => {buff.push(chunk)})
    file_stream.on("close", async () => {
        const file =new File(buff, file_name)
        const transcript = await openai.createTranscription(file, "whisper-1")
        return transcript.data.text
    })

}
async function main() {
    const audioFilename = "recorded_audio.wav";
    await recordAudio(audioFilename);
    const transcription = await transcribe_audio(audioFilename);
    console.log("Transcription:", transcription);
}

main();

export async function transcribe_file(){
    const api = new ChatGPTAPI({apiKey:process.env.OPEN_API_KEY})
}
