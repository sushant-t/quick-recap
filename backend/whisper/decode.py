from numpy import ndarray
import whisper
import torch

import os
import sys
import argparse

os.chdir(sys.path[0])

def get_audio_duration(audio: ndarray): # gives us audio duration from 16 kHz waveform in seconds
    return len(audio)/16000

def main():
    parser = argparse.ArgumentParser(description='Whisper')
    parser.add_argument('--model_size', action="store", dest="model_size", default="tiny")
    args = parser.parse_args()

    model = whisper.load_model(args.model_size)

    audio = whisper.load_audio("../../video.mp3")

    print("backend: audio_duration={0}".format(get_audio_duration(audio)))
    trimmed_audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(trimmed_audio).to(model.device)

    _, probs = model.detect_language(mel)
    lang = max(probs, key=probs.get)

    model.transcribe(audio=audio,fp16=torch.cuda.is_available(),language=lang,without_timestamps=True,verbose=True)


main()
