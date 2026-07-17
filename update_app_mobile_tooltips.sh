#!/bin/bash
awk '
/onClick=\{\(\) => setIsDarkMode\(!isDarkMode\)\}/ {
    print $0
    if (NR > 1180) {
        print "              title={isDarkMode ? \"Tema Claro (Ctrl+Alt+D)\" : \"Tema Escuro (Ctrl+Alt+D)\"}"
    }
    next
}
/onClick=\{\(\) => setMobileMenuOpen\(true\)\}/ {
    print $0
    print "            title=\"Alternar Menu (Ctrl+M)\""
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
