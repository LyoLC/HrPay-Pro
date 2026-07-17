#!/bin/bash
awk '
/  const \[showShortcuts, setShowShortcuts\] = useState\(false\);/ {
    print "  const searchInputRef = useRef<HTMLInputElement>(null);"
    print "  const showShortcuts = useGlobalShortcuts({"
    print "    onSearch: () => searchInputRef.current?.focus(),"
    print "    onPrint: () => {"
    print "      setPrintMode(\x27general\x27);"
    print "      setPrintingPayroll(null);"
    print "    },"
    print "    onMobileMenuToggle: () => setMobileMenuOpen(prev => !prev),"
    print "    onDarkModeToggle: () => setIsDarkMode(prev => !prev)"
    print "  });"
    skip = 1
    next
}
/  const searchInputRef = useRef<HTMLInputElement>\(null\);/ && skip == 1 {
    next
}
/  useEffect\(\(\) => \{/ && skip == 1 {
    in_effect = 1
    next
}
in_effect == 1 {
    if (match($0, /  \}, \[\]\);/)) {
        in_effect = 0
        skip = 0
    }
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx

sed -i 's/import AIAssistantWidget from ".\/components\/AIAssistantWidget";/import AIAssistantWidget from ".\/components\/AIAssistantWidget";\nimport { useGlobalShortcuts } from ".\/hooks\/useGlobalShortcuts";/g' src/App.tsx
