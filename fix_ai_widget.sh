#!/bin/bash
awk '
/interface AIAssistantWidgetProps/ {
    print "interface AIAssistantWidgetProps {"
    print "  currentUser: any;"
    print "  employees: any[];"
    print "  contracts: any[];"
    print "  tasks: any[];"
    print "  attendance: any[];"
    print "}"
    skip = 1
    next
}
/export default function AIAssistantWidget\(\{ currentUser, employeesCount, departmentsCount \}: AIAssistantWidgetProps\) \{/ {
    print "export default function AIAssistantWidget({ currentUser, employees, contracts, tasks, attendance }: AIAssistantWidgetProps) {"
    skip = 0
    next
}
/      const context = \{/ {
    print "      const summary = {"
    print "        totalEmployees: employees.length,"
    print "        employeesList: employees.map(e => ({ name: e.nome, role: e.cargo, status: e.estado, dept: e.departamento })),"
    print "        expiringContracts: contracts.filter(c => c.estado === \x27Ativo\x27 && c.dataFim).map(c => ({ id: c.funcionarioId, end: c.dataFim })),"
    print "        tasks: tasks.map(t => ({ title: t.titulo, status: t.estado, assignee: t.funcionarioId })),"
    print "        todayAttendance: attendance.filter(a => a.data === new Date().toISOString().split(\x27T\x27)[0])"
    print "      };"
    print "      const context = {"
    print "        currentUserRole: currentUser.perfil,"
    print "        dataSummary: summary"
    print "      };"
    skip_context = 1
    next
}
/      \};/ && skip_context == 1 {
    skip_context = 0
    next
}
skip == 1 { next }
skip_context == 1 { next }
{ print }
' src/components/AIAssistantWidget.tsx > src/components/AIAssistantWidget.tsx.new && mv src/components/AIAssistantWidget.tsx.new src/components/AIAssistantWidget.tsx
