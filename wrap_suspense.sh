#!/bin/bash
sed -i 's/{renderRouterSection()}/<Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"><\/div><\/div>}>{renderRouterSection()}<\/Suspense>/g' src/App.tsx
