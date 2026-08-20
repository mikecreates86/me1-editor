#!/bin/bash

set -u

USB_VOLUME="/Volumes/ME1"
PRESET_FOLDER="$USB_VOLUME/ME1PST"

show_error() {
  /usr/bin/osascript -e "display dialog \"$1\" with title \"ME-1 USB Helper\" buttons {\"OK\"} default button \"OK\" with icon stop" >/dev/null
  exit 1
}

if [ ! -d "$USB_VOLUME" ]; then
  show_error "Connect the USB drive named ME1, then try again."
fi

SOURCE_FILE=$(/usr/bin/osascript -e 'POSIX path of (choose file with prompt "Choose the ME-1 preset to copy" of type {"ME1"})') || exit 0
FILE_NAME=$(/usr/bin/basename "$SOURCE_FILE" | /usr/bin/tr '[:lower:]' '[:upper:]')

if ! [[ "$FILE_NAME" =~ ^[A-Z0-9_]{1,8}\.ME1$ ]]; then
  show_error "The filename must contain 1–8 letters, numbers, or underscores before .ME1. Export it from ME-1 Editor first."
fi

FILE_SIZE=$(/usr/bin/stat -f '%z' "$SOURCE_FILE")
if [ "$FILE_SIZE" -ne 4096 ]; then
  show_error "This is not a 4 KB ME-1 preset file. Nothing was copied."
fi

/bin/mkdir -p "$PRESET_FOLDER" || show_error "The ME1PST folder could not be created."

DESTINATION="$PRESET_FOLDER/$FILE_NAME"
COPYFILE_DISABLE=1 /bin/cp -X "$SOURCE_FILE" "$DESTINATION" || show_error "The preset could not be copied."
/usr/bin/xattr -c "$DESTINATION" 2>/dev/null || true

/usr/bin/find "$PRESET_FOLDER" -maxdepth 1 -type f \( -name '._*' -o -name '.DS_Store' \) -delete

if ! /usr/bin/cmp -s "$SOURCE_FILE" "$DESTINATION"; then
  show_error "The copied preset did not verify correctly. The USB was not ejected."
fi

/bin/sync
/usr/sbin/diskutil eject "$USB_VOLUME" >/dev/null || show_error "The preset copied correctly, but the USB could not be ejected. Eject it in Finder."

/usr/bin/osascript -e "display dialog \"$FILE_NAME copied and verified. The ME1 USB is safe to remove.\" with title \"ME-1 USB Ready\" buttons {\"OK\"} default button \"OK\" with icon note" >/dev/null

