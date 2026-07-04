import React, { useState } from 'react';
import { ActivityTask, Employee, TaskStatus, TaskPriority, UserRole } from '../types';
import { ClipboardList, Plus, AlertCircle, Clock, CheckCircle2, MessageSquare, ChevronRight, Bookmark, Search } from 'lucide-react';

interface ActivitiesViewProps {
  tasks: ActivityTask[];
  employees: Employee[];
  onAddTask: (task: ActivityTask) => void;
  onUpdateTask: (id: string, updated: Partial<ActivityTask>) => void;
  currentUser: { nome: string; email: string; perfil: UserRole };
}

export default function ActivitiesView({
  tasks,
  employees,
  onAddTask,
  onUpdateTask,
  currentUser
}: ActivitiesViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<ActivityTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'Date' | 'Priority'>('Date');

  // Form states
  const [formTitulo, setFormTitulo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formPrazo, setFormPrazo] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formCategory, setFormCategory] = useState<ActivityTask['categoria']>('Geral');

  // Comment state
  const [newCommentText, setNewCommentText] = useState('');

  // Settle columns
  const handleMoveTask = (id: string, newStatus: TaskStatus) => {
    onUpdateTask(id, { estado: newStatus });
    // update current selected detail structure
    if (selectedTaskDetails && selectedTaskDetails.id === id) {
      setSelectedTaskDetails({ ...selectedTaskDetails, estado: newStatus });
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo || !formEmpId) {
      alert('Por favor, informe um título e atribua a um funcionário legítimo.');
      return;
    }

    const newTask: ActivityTask = {
      id: `tsk_${Date.now()}`,
      titulo: formTitulo,
      descricao: formDesc,
      funcionarioId: formEmpId,
      prazo: formPrazo || new Date().toISOString().split('T')[0],
      dueDate: formPrazo || new Date().toISOString().split('T')[0],
      priority: formPriority,
      categoria: formCategory,
      estado: 'Pendente',
      comentarios: []
    };

    onAddTask(newTask);
    setIsFormOpen(false);

    // reset fields
    setFormTitulo('');
    setFormDesc('');
    setFormEmpId('');
    setFormPrazo('');
    setFormCategory('Geral');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskDetails || !newCommentText.trim()) return;

    const newCommentList = [
      ...selectedTaskDetails.comentarios,
      {
        autor: `${currentUser.nome} (${currentUser.perfil})`,
        data: new Date().toISOString().split('T')[0],
        texto: newCommentText.trim()
      }
    ];

    onUpdateTask(selectedTaskDetails.id, { comentarios: newCommentList });
    setSelectedTaskDetails({ ...selectedTaskDetails, comentarios: newCommentList });
    setNewCommentText('');
  };

  // Productivity metrics
  const filteredTasks = tasks.filter(t => {
    if (!searchTerm) return true;
    const emp = employees.find(e => e.id === t.funcionarioId);
    const matchesTitle = t.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmp = emp ? emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return matchesTitle || matchesEmp;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'Priority') {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      const pDiff = pMap[b.priority] - pMap[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
    }
    return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
  });

  const totalTasks = filteredTasks.length;
  const completedCount = sortedTasks.filter(t => t.estado === 'Concluída').length;
  const progressCount = sortedTasks.filter(t => t.estado === 'Em Progresso').length;
  const pendingCount = sortedTasks.filter(t => t.estado === 'Pendente').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const getPriorityColor = (prio: TaskPriority) => {
    if (prio === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (prio === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6" id="activities-board-container">
      {/* Upper metrics summary header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quadro de Atividades e Tarefas</h2>
          <p className="text-xs text-slate-500 font-medium">Controlo de projectos, atribuição de tarefas operacionais e reports de produtividade</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'Date' | 'Priority')}
            className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Date">Ordenar por Data</option>
            <option value="Priority">Ordenar por Prioridade</option>
          </select>
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Procurar tarefa ou funcionário..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

        {currentUser.perfil !== UserRole.FUNCIONARIO && (
          <button
            onClick={() => {
              if (employees.length === 0) {
                alert('Cadastre funcionários primeiro.');
                return;
              }
              setFormEmpId(employees[0].id);
              setFormPrazo(new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]); // +1 week
              setIsFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-500/10 cursor-pointer"
            id="register-task-button"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Tarefa</span>
          </button>
        )}
        </div>
      </div>

      {/* Productivity Bar KPI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Índice Global de Produtividade</span>
            <span className="text-emerald-700 font-black">{completionPercentage}% Concluído</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center md:col-span-2">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Pendentes</span>
            <span className="block text-md font-black text-slate-800 mt-0.5">{pendingCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/60">
            <span className="text-[10px] text-amber-600 font-bold uppercase">Activas</span>
            <span className="block text-md font-black text-amber-800 mt-0.5">{progressCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
            <span className="text-[10px] text-emerald-600 font-bold uppercase">Concluídas</span>
            <span className="block text-md font-black text-emerald-800 mt-0.5">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kanban Column: Pendente */}
        <div className="space-y-4" id="col-tasks-pendente">
          <div className="flex justify-between items-center bg-slate-100 border border-slate-200/60 px-4 py-2.5 rounded-xl">
            <div className="flex items-center space-x-2 text-slate-700">
              <ClipboardList className="w-4.5 h-4.5" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide">Pendente</h3>
            </div>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
              {sortedTasks.filter(t => t.estado === 'Pendente').length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {sortedTasks.filter(t => t.estado === 'Pendente').map(task => (
              <TaskTile
                key={task.id}
                task={task}
                employees={employees}
                onSelect={setSelectedTaskDetails}
                onMove={handleMoveTask}
                getPriorityColor={getPriorityColor}
                currentUserRole={currentUser.perfil}
              />
            ))}
          </div>
        </div>

        {/* Kanban Column: Em Progresso */}
        <div className="space-y-4" id="col-tasks-em-progresso">
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200/50 px-4 py-2.5 rounded-xl">
            <div className="flex items-center space-x-2 text-amber-800">
              <Clock className="w-4.5 h-4.5" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide">Em Progresso</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
              {sortedTasks.filter(t => t.estado === 'Em Progresso').length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {sortedTasks.filter(t => t.estado === 'Em Progresso').map(task => (
              <TaskTile
                key={task.id}
                task={task}
                employees={employees}
                onSelect={setSelectedTaskDetails}
                onMove={handleMoveTask}
                getPriorityColor={getPriorityColor}
                currentUserRole={currentUser.perfil}
              />
            ))}
          </div>
        </div>

        {/* Kanban Column: Concluída */}
        <div className="space-y-4" id="col-tasks-concluida">
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200/50 px-4 py-2.5 rounded-xl">
            <div className="flex items-center space-x-2 text-emerald-800">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide">Concluída</h3>
            </div>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
              {sortedTasks.filter(t => t.estado === 'Concluída').length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {sortedTasks.filter(t => t.estado === 'Concluída').map(task => (
              <TaskTile
                key={task.id}
                task={task}
                employees={employees}
                onSelect={setSelectedTaskDetails}
                onMove={handleMoveTask}
                getPriorityColor={getPriorityColor}
                currentUserRole={currentUser.perfil}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Task Creation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-50">
              <h3 className="text-md font-bold text-slate-800">Atribuir Nova Atividade</h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                onClick={() => setIsFormOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {/* Titulo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Concetualização da API de Pagamentos"
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                />
              </div>

              {/* Descricao */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="Escreva detalhes e instruções para a conclusão desta tarefa..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              {/* Assigned Colaborador */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Responsável *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                  value={formEmpId}
                  onChange={e => setFormEmpId(e.target.value)}
                >
                  {employees.filter(e => e.estado === 'Ativo').map(e => (
                    <option key={e.id} value={e.id}>{e.nome} - {e.cargo}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Data limite */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Data Limite *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formPrazo}
                    onChange={e => setFormPrazo(e.target.value)}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Prioridade *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as TaskPriority)}
                  >
                    <option value="Low">Baixa (Low)</option>
                    <option value="Medium">Média (Medium)</option>
                    <option value="High">Alta (High)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Categoria</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ActivityTask['categoria'])}
                  >
                    <option value="Geral">Geral</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Salarial">Salarial</option>
                    <option value="Recrutamento">Recrutamento</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Atribuir Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & COMMENTS Side Drawer / Dialog overlay */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-white h-full max-w-lg w-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
            {/* Top drawer */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h3 className="font-bold text-slate-800 text-md">Detalhes da Atividade</h3>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold"
                  onClick={() => setSelectedTaskDetails(null)}
                >
                  ✕
                </button>
              </div>

              {/* Title & Priority */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getPriorityColor(selectedTaskDetails.priority)}`}>
                    Prioridade {selectedTaskDetails.priority === 'High' ? 'Alta' : selectedTaskDetails.priority === 'Medium' ? 'Média' : 'Baixa'}
                  </span>
                  {selectedTaskDetails.categoria && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {selectedTaskDetails.categoria}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-bold font-mono">ID: {selectedTaskDetails.id}</span>
                </div>
                <h4 className="text-slate-800 font-extrabold text-lg leading-snug">{selectedTaskDetails.titulo}</h4>
              </div>

              {/* Desc */}
              {selectedTaskDetails.descricao && (
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 italic font-medium leading-relaxed">
                  {selectedTaskDetails.descricao}
                </div>
              )}

              {/* Assigned user avatar info */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 block mb-1">Responsável</span>
                  <div className="flex items-center space-x-2">
                    <img
                      src={employees.find(e => e.id === selectedTaskDetails.funcionarioId)?.foto}
                      alt="assigned"
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-slate-800 truncate">
                      {employees.find(e => e.id === selectedTaskDetails.funcionarioId)?.nome || 'Não atribuída'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Prazo Máximo</span>
                  <div className="text-slate-800 font-extrabold flex items-center space-x-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedTaskDetails.dueDate || selectedTaskDetails.prazo}</span>
                  </div>
                </div>
              </div>

              {/* Status control buttons inside detail sheet */}
              <div className="border-t border-slate-50 pt-4">
                <span className="text-xs text-slate-400 block font-bold mb-2">Modificar Estado da Atividade</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pendente', 'Em Progresso', 'Concluída'] as TaskStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleMoveTask(selectedTaskDetails.id, status)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedTaskDetails.estado === status
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* COMMENTS SECTION */}
              <div className="border-t border-slate-50 pt-4 space-y-3">
                <span className="text-xs text-slate-800 font-extrabold flex items-center space-x-1.5 pb-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Histórico de Comentários ({selectedTaskDetails.comentarios.length})</span>
                </span>

                {selectedTaskDetails.comentarios.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4 italic font-medium">Nenhum comentário registado nesta tarefa.</p>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {selectedTaskDetails.comentarios.map((c, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono">
                          <span>{c.autor}</span>
                          <span>{c.data}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom comment composer form */}
            <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4 mt-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="Escreva uma actualização ou nota de progresso..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl text-xs cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

// Small subcomponent representing Kanban task card
function TaskTile({
  task,
  employees,
  onSelect,
  onMove,
  getPriorityColor,
  currentUserRole
}: {
  key?: string;
  task: ActivityTask;
  employees: Employee[];
  onSelect: (t: ActivityTask) => void;
  onMove: (id: string, st: TaskStatus) => void;
  getPriorityColor: (p: TaskPriority) => string;
  currentUserRole: UserRole;
}) {
  const emp = employees.find(e => e.id === task.funcionarioId);
  const commentCount = task.comentarios.length;

  const activeDateStr = task.dueDate || task.prazo;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isOverdue = false;
  let isApproachingDeadline = false;
  
  if (activeDateStr) {
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const dueDateObj = new Date(y, m - 1, d);
    const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    isOverdue = diffDays < 0 && task.estado !== 'Concluída';
    isApproachingDeadline = diffDays >= 0 && diffDays <= 2 && task.estado !== 'Concluída';
  }

  let dateColor = "text-slate-400";
  let dateIconColor = "text-slate-400";
  let warningBg = "";
  if (isOverdue) {
    dateColor = "text-rose-600 font-extrabold";
    dateIconColor = "text-rose-600";
    warningBg = "bg-rose-50/50 border-rose-200";
  } else if (isApproachingDeadline) {
    dateColor = "text-amber-600 font-extrabold";
    dateIconColor = "text-amber-600";
    warningBg = "bg-amber-50/50 border-amber-200";
  }

  return (
    <div
      onClick={() => onSelect(task)}
      className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 ${warningBg ? warningBg : 'bg-white border-slate-100 hover:border-slate-300'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex space-x-1">
          <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded tracking-wider border ${getPriorityColor(task.priority)}`}>
            {task.priority === 'High' ? 'Alta' : task.priority === 'Medium' ? 'Média' : 'Baixa'}
          </span>
          {task.categoria && (
            <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200">
              {task.categoria}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {(isOverdue || isApproachingDeadline) && (
            <AlertCircle className={`w-3.5 h-3.5 ${dateIconColor}`} />
          )}
          <span className="text-[9px] text-slate-400 font-mono font-bold">#{task.id.slice(-4)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-slate-800 font-bold text-xs sm:text-sm tracking-tight leading-snug line-clamp-2">
          {task.titulo}
        </h4>
        {task.descricao && (
          <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
            {task.descricao}
          </p>
        )}
      </div>

      {/* Date, Comment count and Avatar row */}
      <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
        <div className={`flex items-center space-x-1.5 font-mono text-[9px] ${dateColor}`}>
          <Clock className={`w-3.5 h-3.5 ${dateIconColor}`} />
          <span>{activeDateStr}</span>
        </div>

        <div className="flex items-center space-x-2">
          {commentCount > 0 && (
            <span className="flex items-center text-[9px] text-slate-400 font-bold space-x-0.5">
              <MessageSquare className="w-3 h-3 text-slate-300" />
              <span>{commentCount}</span>
            </span>
          )}

          <img
            src={emp?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt="responsible"
            className="w-6 h-6 rounded-full object-cover border border-slate-100 shrink-0"
            referrerPolicy="no-referrer"
            title={emp?.nome}
          />
        </div>
      </div>
    </div>
  );
}
