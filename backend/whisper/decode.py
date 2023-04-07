import whisper
import torch

import os
import sys


os.chdir(sys.path[0])

model = whisper.load_model("base")

audio = whisper.load_audio("../../video.mp3")
trimmed_audio = whisper.pad_or_trim(audio)
mel = whisper.log_mel_spectrogram(trimmed_audio).to(model.device)

_, probs = model.detect_language(mel)
lang = max(probs, key=probs.get)
# print(f"Detected language: {lang}")

# options = whisper.DecodingOptions(fp16=torch.cuda.is_available(), language=lang,without_timestamps=True)
# result = whisper.decode(model, audio, options)

result = model.transcribe(audio=audio,fp16=torch.cuda.is_available(),language=lang,without_timestamps=True,verbose=True)
# print(result['text'])



