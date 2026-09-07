@echo off
set "NEW_PATH=C:\Program Files\Tesseract-OCR"
echo Adding %NEW_PATH% to System PATH...
setx /M PATH "%PATH%;%NEW_PATH%"
echo Done. Please restart your terminal/IDE for changes to take effect.
pause