# RECONSTRUCTED 2026-09-06 from session inventory (original body was lost)
import subprocess
import sys


def ocr(image_path: str) -> str:
    try:
        return subprocess.run(
            ["tesseract", image_path, "stdout"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"OCR error: {e.stderr.strip()}"


if __name__ == "__main__":
    print(ocr(sys.argv[1] if len(sys.argv) > 1 else "captcha.png"))