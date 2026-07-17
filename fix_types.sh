#!/bin/bash
sed -i 's/emp.codigoFuncionario/emp.nuit/g' src/App.tsx
sed -i 's/pay.funcionarioNome/employees.find(e => e.id === pay.funcionarioId)?.nome/g' src/App.tsx
sed -i 's/pay.periodo/`${pay.mes}\/${pay.ano}`/g' src/App.tsx
sed -i 's/c.tipoContrato/c.tipo/g' src/App.tsx
sed -i 's/contract.tipoContrato/contract.tipo/g' src/App.tsx
sed -i 's/contract.status/contract.estado/g' src/App.tsx
sed -i 's/task.status/task.estado/g' src/App.tsx
sed -i 's/pay.status/pay.status/g' src/App.tsx # Wait, does pay have status?
