#!/bin/bash
sed -i 's/title={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}/title={isDarkMode ? "Tema Claro (Ctrl+Alt+D)" : "Tema Escuro (Ctrl+Alt+D)"}/g' src/App.tsx
