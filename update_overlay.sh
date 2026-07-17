#!/bin/bash
cat src/components/ShortcutsOverlay.tsx | awk '
/export default function ShortcutsOverlay/ {
    print "export default function ShortcutsOverlay({ show }: { show: boolean }) {"
    skip = 1
    next
}
/const \[show, setShow\] = useState/ && skip == 1 {
    while (getline > 0) {
        if (match($0, /  return \(/)) {
            print $0
            break
        }
    }
    skip = 0
    next
}
{ print }
' > src/components/ShortcutsOverlay.tsx.new && mv src/components/ShortcutsOverlay.tsx.new src/components/ShortcutsOverlay.tsx
