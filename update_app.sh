#!/bin/bash
sed -i 's/import PrintView from .\.\/components\/PrintView.;/import PrintView from ".\/components\/PrintView";\nimport ShortcutsOverlay from ".\/components\/ShortcutsOverlay";/g' src/App.tsx
sed -i 's/    <\/div>\n  );\n}/      <ShortcutsOverlay \/>\n    <\/div>\n  );\n}/g' src/App.tsx
