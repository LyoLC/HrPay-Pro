#!/bin/bash
sed -i 's/import ReportsView from \x27.\/components\/ReportsView\x27;/import ReportsView from \x27.\/components\/ReportsView\x27;\nimport TimeOffView from \x27.\/components\/TimeOffView\x27;\nimport PerformanceView from \x27.\/components\/PerformanceView\x27;/g' src/App.tsx

awk '
/      case \x27Processamento Salarial\x27:/ {
    print "      case \x27Férias e Licenças\x27:"
    print "        return ("
    print "          <TimeOffView employees={employees} currentUserRole={currentUser.perfil} />"
    print "        );"
    print "      case \x27Desempenho\x27:"
    print "        return ("
    print "          <PerformanceView employees={employees} currentUserRole={currentUser.perfil} />"
    print "        );"
    print $0
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
