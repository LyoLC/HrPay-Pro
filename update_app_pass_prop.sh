#!/bin/bash
sed -i 's/<ShortcutsOverlay \/>/<ShortcutsOverlay show={showShortcuts} \/>/g' src/App.tsx
