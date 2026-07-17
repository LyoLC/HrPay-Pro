#!/bin/bash
awk '
/import LoginView from \x27.\/components\/LoginView\x27;/ {
    print "import React, { useState, useEffect, useRef, Suspense, lazy } from \x27react\x27;"
    print "const LoginView = lazy(() => import(\x27./components/LoginView\x27));"
    print "const DashboardView = lazy(() => import(\x27./components/DashboardView\x27));"
    print "const EmployeesView = lazy(() => import(\x27./components/EmployeesView\x27));"
    print "const ContractsView = lazy(() => import(\x27./components/ContractsView\x27));"
    print "const AttendanceView = lazy(() => import(\x27./components/AttendanceView\x27));"
    print "const TimeOffView = lazy(() => import(\x27./components/TimeOffView\x27));"
    print "const ActivitiesView = lazy(() => import(\x27./components/ActivitiesView\x27));"
    print "const PerformanceView = lazy(() => import(\x27./components/PerformanceView\x27));"
    print "const PayrollView = lazy(() => import(\x27./components/PayrollView\x27));"
    print "const ReportsView = lazy(() => import(\x27./components/ReportsView\x27));"
    print "const CustomReportsView = lazy(() => import(\x27./components/CustomReportsView\x27));"
    print "const ConfigView = lazy(() => import(\x27./components/ConfigView\x27));"
    print "const ProfileView = lazy(() => import(\x27./components/ProfileView\x27));"
    print "const PrintView = lazy(() => import(\x27./components/PrintView\x27));"
    skip = 14
    next
}
skip > 0 {
    skip--
    next
}
/import \{ useState, useEffect, useRef \} from \x27react\x27;/ {
    next
}
{ print }
' src/App.tsx > src/App.tsx.new && mv src/App.tsx.new src/App.tsx
