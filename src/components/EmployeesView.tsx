import React, { useState } from 'react';
import { Employee, ContractType, UserRole, MOZAMBIQUE_DEPARTMENTS } from '../types';
import { Search, UserPlus, Eye, Edit2, CheckCircle2, XCircle, MapPin, Phone, Mail, Calendar, CreditCard, Filter, Trash2 } from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  onCreateEmployee: (employee: Employee) => void;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
  currentUserRole: UserRole;
}

export default function EmployeesView({
  employees,
  onCreateEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currentUserRole
}: EmployeesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedEstado, setSelectedEstado] = useState('Todos');
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formName, setFormName] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [formBI, setFormBI] = useState('');
  const [formNUIT, setFormNUIT] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMorada, setFormMorada] = useState('');
  const [formDepartamento, setFormDepartamento] = useState(MOZAMBIQUE_DEPARTMENTS[0]);
  const [formCargo, setFormCargo] = useState('');
  const [formDataAdmissao, setFormDataAdmissao] = useState('');
  const [formSalarioBase, setFormSalarioBase] = useState(15000);
  const [formTipoContrato, setFormTipoContrato] = useState<ContractType>('Contrato a prazo');
  const [formEstado, setFormEstado] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [formSkills, setFormSkills] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Document Add States
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Cópia de BI');
  const [docUrl, setDocUrl] = useState('');
  const [docExpiry, setDocExpiry] = useState('');

  const departments = ['Todos', ...MOZAMBIQUE_DEPARTMENTS];

  // Filter processes
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.nuit.includes(searchTerm) ||
                          (emp.skills && emp.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesDept = selectedDept === 'Todos' || emp.departamento === selectedDept;
    const matchesEstado = selectedEstado === 'Todos' || emp.estado === selectedEstado;
    return matchesSearch && matchesDept && matchesEstado;
  });

  const openAddForm = () => {
    setIsEditing(false);
    setFormName('');
    setFormFoto('');
    setFormBI('');
    setFormNUIT('');
    setFormContacto('');
    setFormEmail('');
    setFormMorada('');
    setFormDepartamento(MOZAMBIQUE_DEPARTMENTS[0]);
    setFormCargo('');
    setFormDataAdmissao(new Date().toISOString().split('T')[0]);
    setFormSalarioBase(20000);
    setFormTipoContrato('Contrato a prazo');
    setFormEstado('Ativo');
    setFormSkills('');
    setIsFormOpen(true);
  };

  const openEditForm = (emp: Employee) => {
    setIsEditing(true);
    setEditingId(emp.id);
    setFormName(emp.nome);
    setFormFoto(emp.foto);
    setFormBI(emp.bi);
    setFormNUIT(emp.nuit);
    setFormContacto(emp.contacto);
    setFormEmail(emp.email);
    setFormMorada(emp.morada);
    setFormDepartamento(emp.departamento);
    setFormCargo(emp.cargo);
    setFormDataAdmissao(emp.dataAdmissao);
    setFormSalarioBase(emp.salarioBase);
    setFormTipoContrato(emp.tipoContrato);
    setFormEstado(emp.estado);
    setFormSkills(emp.skills ? emp.skills.join(', ') : '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formBI || formBI.length < 5) {
      alert('Por favor, informe um número de Bilhete de Identidade (BI) válido.');
      return;
    }
    if (!formNUIT || formNUIT.length !== 9) {
      alert('O NUIT em Moçambique deve conter exatamente 9 algarismos.');
      return;
    }

    const defaultPhoto = formFoto.trim() || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=300&auto=format&fit=crop&q=80`;

    const parsedSkills = formSkills ? formSkills.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (isEditing) {
      onUpdateEmployee(editingId, {
        nome: formName,
        foto: defaultPhoto,
        bi: formBI,
        nuit: formNUIT,
        contacto: formContacto,
        email: formEmail,
        morada: formMorada,
        departamento: formDepartamento,
        cargo: formCargo,
        dataAdmissao: formDataAdmissao,
        salarioBase: Number(formSalarioBase),
        tipoContrato: formTipoContrato,
        estado: formEstado,
        skills: parsedSkills
      });
      // If we are looking at this detail, update it
      if (detailEmployee && detailEmployee.id === editingId) {
        setDetailEmployee({
          ...detailEmployee,
          nome: formName,
          foto: defaultPhoto,
          bi: formBI,
          nuit: formNUIT,
          contacto: formContacto,
          email: formEmail,
          morada: formMorada,
          departamento: formDepartamento,
          cargo: formCargo,
          dataAdmissao: formDataAdmissao,
          salarioBase: Number(formSalarioBase),
          tipoContrato: formTipoContrato,
          estado: formEstado,
          skills: parsedSkills
        });
      }
    } else {
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        nome: formName,
        foto: defaultPhoto,
        bi: formBI,
        nuit: formNUIT,
        contacto: formContacto,
        email: formEmail,
        morada: formMorada,
        departamento: formDepartamento,
        cargo: formCargo,
        dataAdmissao: formDataAdmissao,
        salarioBase: Number(formSalarioBase),
        tipoContrato: formTipoContrato,
        estado: 'Ativo',
        skills: parsedSkills
      };
      onCreateEmployee(newEmp);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza absoluta que deseja remover este funcionário? Todos os registos associados serão apagados (ação irreversível).')) {
      onDeleteEmployee(id);
      if (detailEmployee?.id === id) {
        setDetailEmployee(null);
      }
    }
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailEmployee) return;

    const newDoc = {
      id: `doc_${Date.now()}`,
      nome: docName,
      tipo: docType,
      url: docUrl,
      validade: docExpiry,
      dataUpload: new Date().toISOString().split('T')[0]
    };

    const updatedDocs = [...(detailEmployee.documentos || []), newDoc];
    onUpdateEmployee(detailEmployee.id, { documentos: updatedDocs });
    setDetailEmployee({ ...detailEmployee, documentos: updatedDocs });

    setIsAddingDoc(false);
    setDocName('');
    setDocUrl('');
    setDocExpiry('');
    setDocType('Cópia de BI');
  };

  return (
    <div className="space-y-6" id="funcionarios-layout">
      {/* Upper action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ficha Geral de Funcionários ({employees.length})</h2>
          <p className="text-xs text-slate-500 font-medium">Controlo, contratações e dados cadastrais de pessoal administrativo</p>
        </div>

        {currentUserRole !== UserRole.SUPERVISOR && currentUserRole !== UserRole.FUNCIONARIO && (
          <button
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/10 transition-colors cursor-pointer"
            id="btn-registar-colaborador"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Funcionário</span>
          </button>
        )}
      </div>

      {/* Filter and search parameters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            placeholder="Pesquisar por Nome, Cargo ou NUIT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dept Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            value={selectedEstado}
            onChange={e => setSelectedEstado(e.target.value)}
          >
            <option value="Todos">Todos Estados</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid containing Employees or Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Primary Workers Lists Table/Grid */}
        <div className="lg:col-span-2 space-y-3" id="funcionarios-list-container">
          {filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium text-xs">
              Nenhum funcionário encontrado correspondente aos parâmetros de pesquisa indicados.
            </div>
          ) : (
            filteredEmployees.map(emp => (
              <div
                key={emp.id}
                onClick={() => setDetailEmployee(emp)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex justify-between items-center ${detailEmployee?.id === emp.id ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={emp.foto}
                    alt={emp.nome}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm">{emp.nome}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">{emp.cargo} • <span className="text-slate-400">{emp.departamento}</span></p>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[9px] font-semibold text-slate-400 font-mono">NUIT: {emp.nuit}</span>
                      <span className="text-[9px] text-slate-300">•</span>
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {emp.salarioBase.toLocaleString('pt-MZ')} MT /mês
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                  {emp.estado === 'Ativo' ? (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="hidden sm:inline">Ativo</span>
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold flex items-center space-x-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span className="hidden sm:inline">Inativo</span>
                    </span>
                  )}

                  <button
                    onClick={() => setDetailEmployee(emp)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {currentUserRole !== UserRole.SUPERVISOR && currentUserRole !== UserRole.FUNCIONARIO && (
                    <>
                      <button
                        onClick={() => openEditForm(emp)}
                        className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Side Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
          {detailEmployee ? (
            <div className="space-y-6" id="detalhes-funcionario-card">
              <div className="text-center">
                <img
                  src={detailEmployee.foto}
                  alt={detailEmployee.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/10 mx-auto shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-extrabold text-slate-800 text-md mt-3">{detailEmployee.nome}</h3>
                <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md mt-1">
                  {detailEmployee.cargo}
                </span>
              </div>

              <div className="border-t border-slate-50 pt-5 space-y-4">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Informações Pessoais</h4>
                
                <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
                  <div className="flex items-center space-x-2.5">
                    <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>BI:</b> {detailEmployee.bi}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>NUIT:</b> {detailEmployee.nuit}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>Contacto:</b> {detailEmployee.contacto}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>E-mail:</b> {detailEmployee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>Morada:</b> {detailEmployee.morada}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-5 space-y-4">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Dados Profissionais</h4>
                
                <div className="space-y-3 text-xs text-slate-600 font-semibold bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departamento:</span>
                    <span className="text-slate-800 font-bold">{detailEmployee.departamento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data de Admissão:</span>
                    <span className="text-slate-800 font-bold">{detailEmployee.dataAdmissao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vínculo Contratual:</span>
                    <span className="text-emerald-700 font-bold">{detailEmployee.tipoContrato}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salário Base Mensal:</span>
                    <span className="text-slate-900 font-bold">{detailEmployee.salarioBase.toLocaleString('pt-MZ')} MT</span>
                  </div>
                </div>
              </div>

              {detailEmployee.skills && detailEmployee.skills.length > 0 && (
                <div className="border-t border-slate-50 pt-5 space-y-4">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Competências & Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailEmployee.skills.map((skill, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2.5 py-1 rounded-full font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentos Obrigatórios */}
              <div className="border-t border-slate-50 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Documentos Obrigatórios</h4>
                  {currentUserRole !== UserRole.SUPERVISOR && currentUserRole !== UserRole.FUNCIONARIO && (
                    <button
                      onClick={() => setIsAddingDoc(!isAddingDoc)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition-colors"
                    >
                      {isAddingDoc ? 'Cancelar' : '+ Adicionar'}
                    </button>
                  )}
                </div>

                {isAddingDoc && (
                  <form onSubmit={handleAddDoc} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3 mb-3">
                    <div>
                      <input type="text" required placeholder="Nome do Ficheiro" className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none" value={docName} onChange={e => setDocName(e.target.value)} />
                    </div>
                    <div className="flex space-x-2">
                      <select className="flex-1 text-xs p-2 rounded-lg border border-slate-200 focus:outline-none" value={docType} onChange={e => setDocType(e.target.value)}>
                        <option value="Cópia de BI">Cópia de BI</option>
                        <option value="Certificado Médico">Certificado Médico</option>
                        <option value="Registo Criminal">Registo Criminal</option>
                        <option value="Certificado Literário">Certificado Literário</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input type="date" placeholder="Validade" className="flex-1 text-xs p-2 rounded-lg border border-slate-200 focus:outline-none" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} title="Data de Validade (opcional)" />
                    </div>
                    <div>
                      <input type="url" required placeholder="URL do Ficheiro (Drive, S3, etc)" className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none" value={docUrl} onChange={e => setDocUrl(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-emerald-700">Guardar Documento</button>
                  </form>
                )}

                {detailEmployee.documentos && detailEmployee.documentos.length > 0 ? (
                  <div className="space-y-2">
                    {detailEmployee.documentos.map(doc => {
                      let isExpired = false;
                      let isExpiringSoon = false;
                      if (doc.validade) {
                        const validadeDate = new Date(doc.validade);
                        const today = new Date();
                        const diffTime = validadeDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) {
                          isExpired = true;
                        } else if (diffDays <= 30) {
                          isExpiringSoon = true;
                        }
                      }
                      
                      return (
                        <div key={doc.id} className={`p-3 border rounded-xl text-xs flex justify-between items-center ${isExpired ? 'border-rose-300 bg-rose-50' : isExpiringSoon ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                          <div>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline">{doc.nome}</a>
                            <div className="text-[10px] text-slate-500 mt-0.5">{doc.tipo} {doc.validade && `• Validade: ${doc.validade}`}</div>
                          </div>
                          {isExpired && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">Expirado</span>}
                          {isExpiringSoon && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Expira em breve</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum documento registado.</p>
                )}
              </div>

              {currentUserRole !== UserRole.SUPERVISOR && currentUserRole !== UserRole.FUNCIONARIO && (
                <div className="pt-2">
                  <button
                    onClick={() => openEditForm(detailEmployee)}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 rounded-xl text-xs transition-colors border border-emerald-200 cursor-pointer"
                  >
                    Editar Cadastro do Funcionário
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              <Eye className="w-8 h-8 mx-auto text-slate-300 stroke-1 block mb-3" />
              Selecione um funcionário à esquerda para visualizar todos os dados contratuais e identificações tributárias.
            </div>
          )}
        </div>
      </div>

      {/* Creator/Editor Modal Panel */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-50">
              <h3 className="text-md font-bold text-slate-800">
                {isEditing ? 'Atualizar Dados do Funcionário' : 'Novo Cadastro Corporativo'}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                onClick={() => setIsFormOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Abel Chilundo"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
                </div>

                {/* Foto */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Foto (URL público opcional)</label>
                  <input
                    type="url"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="https://images.unsplash.com/..."
                    value={formFoto}
                    onChange={e => setFormFoto(e.target.value)}
                  />
                </div>

                {/* BI */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Número de BI (Identidade) *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 110103982736A"
                    value={formBI}
                    onChange={e => setFormBI(e.target.value.toUpperCase())}
                  />
                </div>

                {/* NUIT */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">NUIT Tributário (9 dígitos) *</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Ex: 110294821"
                    value={formNUIT}
                    onChange={e => setFormNUIT(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {/* Contacto */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Contacto Telefónico *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="+258 84 123 4567"
                    value={formContacto}
                    onChange={e => setFormContacto(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email Corporativo *</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="abel@empresa.co.mz"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                  />
                </div>

                {/* Departamento */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Departamento *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formDepartamento}
                    onChange={e => setFormDepartamento(e.target.value)}
                  >
                    {MOZAMBIQUE_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Cargo */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Analista de Sistemas"
                    value={formCargo}
                    onChange={e => setFormCargo(e.target.value)}
                  />
                </div>

                {/* Skills */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Competências / Skills (separadas por vírgula)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: React, Node.js, Liderança, Gestão de Projetos"
                    value={formSkills}
                    onChange={e => setFormSkills(e.target.value)}
                  />
                </div>

                {/* Data Admissao */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Data de Admissão *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formDataAdmissao}
                    onChange={e => setFormDataAdmissao(e.target.value)}
                  />
                </div>

                {/* Salario Base */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Salário Base (MT) *</label>
                  <input
                    type="number"
                    required
                    min={5000}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                    value={formSalarioBase}
                    onChange={e => setFormSalarioBase(Number(e.target.value))}
                  />
                </div>

                {/* Tipo de Contrato */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Vínculo Inicial *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formTipoContrato}
                    onChange={e => setFormTipoContrato(e.target.value as ContractType)}
                  >
                    <option value="Contrato a prazo">Contrato a prazo (Termo Determinado)</option>
                    <option value="Contrato sem termo">Contrato sem termo (Efectivo)</option>
                    <option value="Prestação de serviços">Prestação de serviços</option>
                  </select>
                </div>

                {/* Estado (Only editable if editing) */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Estado Funcional *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formEstado}
                    onChange={e => setFormEstado(e.target.value as 'Ativo' | 'Inativo')}
                    disabled={!isEditing}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo (Rescindido/Afastado)</option>
                  </select>
                </div>
              </div>

              {/* Morada Moradia */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Morada Residencial *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="Av. Julius Nyerere, Edifício 24, Maputo"
                  value={formMorada}
                  onChange={e => setFormMorada(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
                  id="submit-register-employee-button"
                >
                  {isEditing ? 'Atualizar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizational Hierarchy Tree */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="pb-4 border-b border-slate-50 mb-6">
          <h3 className="text-md font-bold text-slate-800">Hierarquia Organizacional</h3>
          <p className="text-xs text-slate-500 font-medium">Estrutura de funcionários por departamento e cargo</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-max pb-4">
            <div className="flex flex-col items-start ml-2 relative">
              {/* Root Node */}
              <div className="flex items-center mb-6 relative z-10">
                <div className="bg-emerald-950 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm">
                  A Empresa
                </div>
              </div>
              
              <div className="pl-6 border-l-2 border-emerald-100 space-y-6 relative ml-4">
                {departments.filter(d => d !== 'Todos').map((dept, index, array) => {
                  const deptEmployees = employees.filter(e => e.departamento === dept && e.estado === 'Ativo');
                  if (deptEmployees.length === 0) return null;

                  // Group by roles
                  const roleGroups = deptEmployees.reduce((acc, emp) => {
                    if (!acc[emp.cargo]) acc[emp.cargo] = [];
                    acc[emp.cargo].push(emp);
                    return acc;
                  }, {} as Record<string, Employee[]>);

                  const isLastDept = index === array.length - 1;

                  return (
                    <div key={dept} className="relative">
                      {/* Connector to department */}
                      <div className="absolute -left-6 top-4 w-6 border-t-2 border-emerald-100" />
                      {isLastDept && <div className="absolute -left-[26px] top-4 bottom-0 w-1 bg-white z-0" />}

                      {/* Department Node */}
                      <div className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-200 inline-block mb-3 relative z-10">
                        {dept} <span className="text-emerald-600/70 ml-1 font-normal">({deptEmployees.length})</span>
                      </div>

                      <div className="pl-6 border-l-2 border-slate-100 space-y-4 ml-3 relative">
                        {Object.entries(roleGroups).map(([role, roleEmployees], rIndex, rArray) => {
                          const isLastRole = rIndex === rArray.length - 1;
                          
                          return (
                            <div key={role} className="relative">
                              {/* Connector to role */}
                              <div className="absolute -left-6 top-3 w-6 border-t-2 border-slate-100" />
                              {isLastRole && <div className="absolute -left-[26px] top-3 bottom-0 w-1 bg-white z-0" />}

                              {/* Role Node */}
                              <div className="bg-slate-50 text-slate-700 font-semibold text-[11px] px-2.5 py-1 rounded border border-slate-200 inline-block mb-2 relative z-10">
                                {role} <span className="text-slate-400 font-normal">({roleEmployees.length})</span>
                              </div>

                              <div className="pl-8 flex flex-col space-y-2 relative">
                                {roleEmployees.map((emp, eIndex, eArray) => (
                                  <div key={emp.id} className="flex items-center space-x-2 relative group">
                                    <div className="absolute -left-8 top-3 w-8 border-t border-slate-200 border-dashed" />
                                    {eIndex === eArray.length - 1 && <div className="absolute -left-[34px] top-3 bottom-0 w-1 bg-white z-0" />}
                                    <img
                                      src={emp.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                      alt={emp.nome}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-200 z-10"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-emerald-600 transition-colors cursor-pointer z-10" onClick={() => setDetailEmployee(emp)}>
                                      {emp.nome}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
