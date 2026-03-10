import Groq from "groq-sdk";
import { env } from "../config/env.js";
import fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function transcribeAudio(audioFilePath: string): Promise<string> {
    try {
        console.log(`Processing audio file: ${audioFilePath}`);

        const tempMp3Path = `${audioFilePath}.mp3`;

        // Wait for ffmpeg to convert the file
        await new Promise((resolve, reject) => {
            ffmpeg(audioFilePath)
                .toFormat('mp3')
                .on('error', (err) => reject(err))
                .on('end', () => resolve(true))
                .save(tempMp3Path);
        });

        console.log(`Transcribing converted file: ${tempMp3Path}`);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempMp3Path),
            model: "whisper-large-v3",
            response_format: "verbose_json",
        });

        // Cleanup the temporary MP3 file
        try {
            fs.unlinkSync(tempMp3Path);
        } catch (e) {
            console.error(`Failed to delete temp mp3: ${tempMp3Path}`, e);
        }

        return transcription.text;
    } catch (error) {
        console.error("Error transcribing audio with Groq:", error);
        throw error;
    }
}
