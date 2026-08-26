#!/home/ps/.venv/bin/python
import argparse
import asyncio
import json
from array import array
from pathlib import Path
import re

import edge_tts
import lameenc
import miniaudio
from edge_tts.exceptions import NoAudioReceived


VOICES = {
    "en_female": "en-US-EmmaMultilingualNeural",
    "en_male": "en-US-AndrewMultilingualNeural",
    "jp_female": "ja-JP-NanamiNeural",
}

RATES = {
    "en_slow": "-20%",
    "jp_default": "+0%",
}

FIVE_EN_SEQUENCE = (
    "female_slow",
    "female_slow",
    "male_slow",
    "male_slow",
    "female_slow",
)

SENTENCE_BLOCK_RE = re.compile(
    r'sid:\s*"(?P<sid>s\d+[A-Za-z]?)"\s*,\s*'
    r'english:\s*(?P<english_quote>["\'])'
    r'(?P<english>(?:\\.|(?!(?P=english_quote)).)*)'
    r'(?P=english_quote)\s*,\s*'
    r'japanese:\s*(?P<japanese_quote>["\'])'
    r'(?P<japanese>(?:\\.|(?!(?P=japanese_quote)).)*)'
    r'(?P=japanese_quote)',
    re.DOTALL,
)

VOCAB_BLOCK_RE = re.compile(r"vocab:\s*\[(?P<vocab>.*)\]\s*\};?\s*$", re.DOTALL)
VOCAB_ENTRY_RE = re.compile(
    r'vid:\s*"(?P<vid>v\d+)"\s*,\s*'
    r'word:\s*(?P<word_quote>["\'])'
    r'(?P<word>(?:\\.|(?!(?P=word_quote)).)*)'
    r'(?P=word_quote)',
    re.DOTALL,
)


def unescape_js_string(value: str) -> str:
    def replace_unicode(match: re.Match[str]) -> str:
        return chr(int(match.group(1), 16))

    value = re.sub(r"\\u([0-9a-fA-F]{4})", replace_unicode, value)
    replacements = {
        r"\\n": "\n",
        r"\\r": "\r",
        r"\\t": "\t",
        r'\\"': '"',
        r"\\'": "'",
        r"\\\\": "\\",
    }
    for src, dest in replacements.items():
        value = value.replace(src, dest)
    return value


def sanitize_tts_text(value: str) -> str:
    return value.replace('"', "").replace("“", "").replace("”", "")


def sanitize_tts_word(value: str) -> str:
    # The tilde in phrasal-verb entries is a dictionary placeholder, not speech.
    return re.sub(r"\s+", " ", sanitize_tts_text(value).replace("~", " ")).strip()


def load_section_payload(section_file: Path) -> dict:
    if section_file.suffix == ".json":
        return json.loads(section_file.read_text(encoding="utf-8"))

    source = section_file.read_text(encoding="utf-8")
    section_name = section_file.stem
    sentences = []
    for match in SENTENCE_BLOCK_RE.finditer(source):
        sid = match.group("sid")[1:]
        english = unescape_js_string(match.group("english"))
        japanese = unescape_js_string(match.group("japanese"))
        sentences.append(
            {
                "id": sid,
                "english": english,
                "japanese": japanese,
            }
        )

    vocab_match = VOCAB_BLOCK_RE.search(source)
    vocab = []
    if vocab_match:
        for match in VOCAB_ENTRY_RE.finditer(vocab_match.group("vocab")):
            vocab.append(
                {
                    "id": match.group("vid")[1:],
                    "word": unescape_js_string(match.group("word")),
                }
            )

    if not sentences or not vocab:
        raise RuntimeError(f"Missing sentence or vocab data in {section_file}")

    return {"section": section_name, "sentences": sentences, "vocab": vocab}


async def synthesize(
    text: str,
    voice: str,
    rate: str,
    out_path: Path,
    semaphore: asyncio.Semaphore,
    overwrite: bool,
) -> None:
    if not overwrite and out_path.exists() and out_path.stat().st_size > 0:
        return

    out_path.parent.mkdir(parents=True, exist_ok=True)
    async with semaphore:
        last_error = None
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
                await communicate.save(str(out_path))
                break
            except NoAudioReceived as error:
                last_error = error
                if out_path.exists():
                    out_path.unlink()
                if attempt == 2:
                    raise
                await asyncio.sleep(1 + attempt)
        else:
            raise last_error

    if out_path.stat().st_size == 0:
        raise RuntimeError(f"Generated empty file: {out_path}")


def decode_mp3_to_pcm(path: Path, sample_rate: int = 44100) -> miniaudio.DecodedSoundFile:
    return miniaudio.decode_file(
        str(path),
        output_format=miniaudio.SampleFormat.SIGNED16,
        nchannels=1,
        sample_rate=sample_rate,
    )


def encode_pcm_to_mp3(samples: array, out_path: Path, sample_rate: int = 44100) -> None:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(96)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)

    pcm_bytes = samples.tobytes()
    mp3_data = encoder.encode(pcm_bytes)
    mp3_data += encoder.flush()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(mp3_data)

    if out_path.stat().st_size == 0:
        raise RuntimeError(f"Generated empty file: {out_path}")


def build_5x_audio(
    female_slow_path: Path,
    male_slow_path: Path,
    out_path: Path,
) -> None:
    female = decode_mp3_to_pcm(female_slow_path)
    male = decode_mp3_to_pcm(male_slow_path, sample_rate=female.sample_rate)

    merged = array("h")
    for voice_key in FIVE_EN_SEQUENCE:
        if voice_key == "female_slow":
            merged.extend(female.samples)
        else:
            merged.extend(male.samples)

    encode_pcm_to_mp3(merged, out_path, sample_rate=female.sample_rate)


async def generate_section(
    section_file: Path,
    base_dir: Path,
    overwrite: bool,
) -> None:
    payload = load_section_payload(section_file)
    section_name = payload["section"]
    en_dir = base_dir / "mp3" / "en" / section_name
    jp_dir = base_dir / "mp3" / "jp" / section_name
    five_en_dir = base_dir / "mp3" / "5en" / section_name
    word_dir = base_dir / "mp3" / "word" / section_name
    five_word_dir = base_dir / "mp3" / "5word" / section_name
    semaphore = asyncio.Semaphore(2)

    tasks = []
    for sentence in payload["sentences"]:
        sid = sentence["id"]
        english = sanitize_tts_text(sentence["english"])
        japanese = sentence["japanese"]

        tasks.extend(
            [
                synthesize(
                    english,
                    VOICES["en_female"],
                    RATES["en_slow"],
                    en_dir / f"{sid}_female_slow.mp3",
                    semaphore,
                    overwrite,
                ),
                synthesize(
                    english,
                    VOICES["en_male"],
                    RATES["en_slow"],
                    en_dir / f"{sid}_male_slow.mp3",
                    semaphore,
                    overwrite,
                ),
                synthesize(
                    japanese,
                    VOICES["jp_female"],
                    RATES["jp_default"],
                    jp_dir / f"{sid}_female.mp3",
                    semaphore,
                    overwrite,
                ),
            ]
        )

    await asyncio.gather(*tasks)

    for sentence in payload["sentences"]:
        sid = sentence["id"]
        female_slow_path = en_dir / f"{sid}_female_slow.mp3"
        male_slow_path = en_dir / f"{sid}_male_slow.mp3"
        five_en_path = five_en_dir / f"{sid}_female_5x.mp3"

        if overwrite or not five_en_path.exists() or five_en_path.stat().st_size == 0:
            build_5x_audio(female_slow_path, male_slow_path, five_en_path)

    word_tasks = []
    for vocab in payload["vocab"]:
        vid = vocab["id"]
        word = sanitize_tts_word(vocab["word"])
        word_tasks.extend(
            [
                synthesize(
                    word,
                    VOICES["en_female"],
                    RATES["en_slow"],
                    word_dir / f"{vid}_female_slow.mp3",
                    semaphore,
                    overwrite,
                ),
                synthesize(
                    word,
                    VOICES["en_male"],
                    RATES["en_slow"],
                    word_dir / f"{vid}_male_slow.mp3",
                    semaphore,
                    overwrite,
                ),
            ]
        )

    await asyncio.gather(*word_tasks)

    for vocab in payload["vocab"]:
        vid = vocab["id"]
        female_slow_path = word_dir / f"{vid}_female_slow.mp3"
        male_slow_path = word_dir / f"{vid}_male_slow.mp3"
        five_word_path = five_word_dir / f"{vid}_female_5x.mp3"

        if overwrite or not five_word_path.exists() or five_word_path.stat().st_size == 0:
            build_5x_audio(female_slow_path, male_slow_path, five_word_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("section_files", nargs="+", type=Path)
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path("/home/ps/eiken-jun1-mobile"),
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
    )
    args = parser.parse_args()

    async def run_all() -> None:
        for section_file in args.section_files:
            await generate_section(
                section_file=section_file,
                base_dir=args.base_dir,
                overwrite=args.overwrite,
            )

    asyncio.run(run_all())


if __name__ == "__main__":
    main()
