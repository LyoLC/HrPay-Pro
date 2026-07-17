#!/bin/bash
sed -i 's/<AIAssistantWidget currentUser={currentUser} employeesCount={employees.length} departmentsCount={\[...new Set(employees.map(e => e.departamento))\].length} \/>/<AIAssistantWidget currentUser={currentUser} employees={employees} contracts={contracts} tasks={tasks} attendance={attendance} \/>/g' src/App.tsx
