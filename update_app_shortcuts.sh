#!/bin/bash
cat src/App.tsx | awk '
/  const \[showSearchResults, setShowSearchResults\] = useState\(false\);/ {
    print $0
    print "  const [showShortcuts, setShowShortcuts] = useState(false);"
    next
}
/    const handleKeyDown = \(e: KeyboardEvent\) => {/ {
    print "    let shiftTimeoutId: NodeJS.Timeout;"
    print "    const handleKeyDown = (e: KeyboardEvent) => {"
    print "      if ((e.ctrlKey || e.metaKey) && e.key === \x27k\x27) {"
    print "        e.preventDefault();"
    print "        searchInputRef.current?.focus();"
    print "      }"
    print "      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === \x27p\x27) {"
    print "        e.preventDefault();"
    print "        setPrintMode(\x27general\x27);"
    print "        setPrintingPayroll(null);"
    print "      }"
    print "      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === \x27m\x27) {"
    print "        e.preventDefault();"
    print "        setMobileMenuOpen(prev => !prev);"
    print "      }"
    print "      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === \x27d\x27) {"
    print "        e.preventDefault();"
    print "        setIsDarkMode(prev => !prev);"
    print "      }"
    print "      if (e.key === \x27Shift\x27 && !e.repeat) {"
    print "        const activeTag = document.activeElement?.tagName.toLowerCase();"
    print "        if (activeTag === \x27input\x27 || activeTag === \x27textarea\x27 || activeTag === \x27select\x27) return;"
    print "        shiftTimeoutId = setTimeout(() => {"
    print "          setShowShortcuts(true);"
    print "        }, 400);"
    print "      }"
    print "    };"
    print "    const handleKeyUp = (e: KeyboardEvent) => {"
    print "      if (e.key === \x27Shift\x27) {"
    print "        clearTimeout(shiftTimeoutId);"
    print "        setShowShortcuts(false);"
    print "      }"
    print "    };"
    print "    const handleBlur = () => {"
    print "      clearTimeout(shiftTimeoutId);"
    print "      setShowShortcuts(false);"
    print "    };"
    print "    window.addEventListener(\x27keydown\x27, handleKeyDown);"
    print "    window.addEventListener(\x27keyup\x27, handleKeyUp);"
    print "    window.addEventListener(\x27blur\x27, handleBlur);"
    print "    return () => {"
    print "      window.removeEventListener(\x27keydown\x27, handleKeyDown);"
    print "      window.removeEventListener(\x27keyup\x27, handleKeyUp);"
    print "      window.removeEventListener(\x27blur\x27, handleBlur);"
    print "      clearTimeout(shiftTimeoutId);"
    print "    };"
    skip = 1
    next
}
/    return \(\) => window.removeEventListener\(\x27keydown\x27, handleKeyDown\);/ && skip == 1 {
    skip = 0
    next
}
/    window.addEventListener\(\x27keydown\x27, handleKeyDown\);/ && skip == 1 {
    next
}
skip == 1 { next }
{ print }
' > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
