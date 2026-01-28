/**
 * Audio conversion utilities
 * Converts various audio formats to WAV format using Web Audio API
 */

/**
 * Convert any audio format to WAV format
 * @param audioFile - The audio file to convert
 * @returns Promise<Blob> - WAV file as Blob
 */
export async function convertAudioToWav(audioFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Decode the audio file
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert to WAV
        const wavBlob = audioBufferToWav(audioBuffer);
        resolve(wavBlob);
      } catch (error) {
        reject(new Error(`Failed to convert audio: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read audio file"));
    };

    reader.readAsArrayBuffer(audioFile);
  });
}

/**
 * Convert AudioBuffer to WAV Blob
 * @param audioBuffer - The decoded audio buffer
 * @returns Blob - WAV file as Blob
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameLength = audioBuffer.length;
  const format = 1; // PCM format

  // Create the WAV file structure
  const channelData = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  // Create the WAV header
  const headerLength = 44;
  const bufferLength = headerLength + frameLength * blockAlign;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF"); // Chunk ID
  view.setUint32(4, bufferLength - 8, true); // Chunk size
  writeString(8, "WAVE"); // Format

  writeString(12, "fmt "); // Subchunk1 ID
  view.setUint32(16, 16, true); // Subchunk1 size (16 for PCM)
  view.setUint16(20, format, true); // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample

  writeString(36, "data"); // Subchunk2 ID
  view.setUint32(40, frameLength * blockAlign, true); // Subchunk2 size

  // Write audio samples
  const offset = headerLength;
  const volume = 0.8; // Volume level (0-1)
  let index = 0;

  for (let i = 0; i < frameLength; i++) {
    for (let j = 0; j < numChannels; j++) {
      const sample = Math.max(-1, Math.min(1, channelData[j][i])) * volume;
      const s = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset + index, s, true);
      index += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Convert audio file to WAV and return as data URI
 * @param audioFile - The audio file to convert
 * @returns Promise<string> - WAV file as data URI
 */
export async function convertAudioToWavDataUri(
  audioFile: File
): Promise<string> {
  const wavBlob = await convertAudioToWav(audioFile);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to convert WAV to data URI"));
    };
    reader.readAsDataURL(wavBlob);
  });
}

/**
 * Check if audio file needs conversion (not already WAV)
 * @param file - The audio file to check
 * @returns boolean - True if file needs conversion
 */
export function needsAudioConversion(file: File): boolean {
  return !file.type.includes("wav");
}
