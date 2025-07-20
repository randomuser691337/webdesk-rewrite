#!/bin/bash

SRC_DIR="/Users/user/webdesk-rewrite/desk"
ZIP_NAME="desk.zip"
DEST_DIR="/Users/user/webdesk-rewrite"

cd "$SRC_DIR" || exit 1

zip -r "$ZIP_NAME" . \
    -x "*.DS_Store" \
    -x "__MACOSX/*" \
    -x "Thumbs.db" \
    -x "desktop.ini"

mv "$ZIP_NAME" "$DEST_DIR/$ZIP_NAME"