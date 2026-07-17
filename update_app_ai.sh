#!/bin/bash
sed -i 's/import ShortcutsOverlay from ".\/components\/ShortcutsOverlay";/import ShortcutsOverlay from ".\/components\/ShortcutsOverlay";\nimport AIAssistantWidget from ".\/components\/AIAssistantWidget";/g' src/App.tsx

awk '
/      <ShortcutsOverlay \/>/ {
    print "      {currentUser && <AIAssistantWidget currentUser={currentUser} employeesCount={employees.length} departmentsCount={[...new Set(employees.map(e => e.departamento))].length} />}"
    print $0
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
