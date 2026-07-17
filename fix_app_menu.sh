#!/bin/bash
sed -i 's/import { \n  LayoutDashboard/import { \n  LayoutDashboard, Palmtree, Award, /g' src/App.tsx

# Wait, there's no newline after import { in some cases. Let's do it safer.
sed -i 's/LayoutDashboard, Users,/LayoutDashboard, Users, Palmtree, Award,/g' src/App.tsx

awk '
/name: \x27Assiduidade\x27/ {
    print $0
    print "    { name: \x27Férias e Licenças\x27, icon: Palmtree, blockForEmployee: false },"
    next
}
/name: \x27Atividades\x27/ {
    print $0
    print "    { name: \x27Desempenho\x27, icon: Award, blockForEmployee: false },"
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
