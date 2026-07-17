#!/bin/bash
awk '
/    <\/div>/ {
    if (NR > 1380) {
        print "      <ShortcutsOverlay />"
        print $0
        next
    }
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
