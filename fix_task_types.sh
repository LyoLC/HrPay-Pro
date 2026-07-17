#!/bin/bash
sed -i 's/task.estado === "Completed"/task.estado === "Concluída"/g' src/App.tsx
sed -i 's/task.estado === "In Progress"/task.estado === "Em Progresso"/g' src/App.tsx
