import React, { useState, useRef } from 'react';
import { User, Employee, Contract_Doc, ActivityTask, PayrollProcessed, UserRole, AttendanceRecord, EmployeeDocument } from '../types';
import { UserCheck, Phone, MapPin, Mail, Award, Lock, FileText, Printer, CheckSquare, Sparkles, Save, ShieldAlert, CalendarDays, Camera, ImagePlus, X, FileBadge, Trash2 } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  employees: Employee[];
  contracts: Contract_Doc[];
  tasks: ActivityTask[];
  attendance?: AttendanceRecord[];
  payrollHistory: PayrollProcessed[];
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onPrintSlip: (payroll: PayrollProcessed) => void;
  onTaskStatusChange: (taskId: string, newStatus: any) => void;
}

export default function ProfileView({
  currentUser,
  employees,
  contracts,
  tasks,
  attendance = [],
  payrollHistory,
  onUpdateEmployee,
  onPrintSlip,
  onTaskStatusChange
}: ProfileViewProps) {
  // Try to find linked employee
  const linkedEmployee = employees.find(e => e.id === currentUser.funcionarioId);
  
  // Local state for editing contacts
  const [contacto, setContacto] = useState(linkedEmployee?.contacto || '');
  const [morada, setMorada] = useState(linkedEmployee?.morada || '');
  const [email, setEmail] = useState(linkedEmployee?.email || '');

  const handleUpdateContacts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedEmployee) return;

    onUpdateEmployee(linkedEmployee.id, {
      contacto,
      morada,
      email
    });
    alert('Os seus dados de contacto pessoal foram transmitidos ao departamento de Recursos Humanos com sucesso.');
  };

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [docType, setDocType] = useState('BI');
  const [docName, setDocName] = useState('Cartão de Identificação');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert('Não foi possível aceder à sua câmara. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && linkedEmployee) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        
        const newDoc: EmployeeDocument = {
          id: `doc-${Date.now()}`,
          nome: docName,
          tipo: docType,
          url: dataUrl,
          dataUpload: new Date().toISOString().split('T')[0]
        };

        const currentDocs = linkedEmployee.documentos || [];
        onUpdateEmployee(linkedEmployee.id, {
          documentos: [...currentDocs, newDoc]
        });

        stopCamera();
      }
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (linkedEmployee) {
      const currentDocs = linkedEmployee.documentos || [];
      onUpdateEmployee(linkedEmployee.id, {
        documentos: currentDocs.filter(d => d.id !== docId)
      });
    }
  };

  // Filter properties if Linked Employee exists
  const myContract = linkedEmployee 
    ? contracts.find(c => c.funcionarioId === linkedEmployee.id && c.estado === 'Ativo')
    : null;

  const myTasks = linkedEmployee
    ? tasks.filter(t => t.funcionarioId === linkedEmployee.id)
    : [];

  const myPaychecks = linkedEmployee
    ? payrollHistory.filter(p => p.funcionarioId === linkedEmployee.id)
    : [];

  const myAttendance = linkedEmployee
    ? attendance.filter(a => a.funcionarioId === linkedEmployee.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : [];

  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  return (
    <div className="space-y-6" id="profiles-workspace">
      {/* Intro header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Definições da Conta e Perfil</h2>
        <p className="text-xs text-slate-500 font-medium">Consulte dados de autenticação e credenciais associadas ao seu cargo na organização</p>
      </div>

      {/* Linked Worker Portal Layout */}
      {linkedEmployee ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="worker-portal-dashboard">
          
          {/* Column 1: Contacts editor and Contract file */}
          <div className="space-y-6">
            {/* User card summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
              <img
                src={linkedEmployee.foto}
                alt={linkedEmployee.nome}
                className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500/10 mx-auto"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">{linkedEmployee.nome}</h3>
                <span className="inline-block text-[10px] text-slate-500 bg-slate-100 font-bold px-2 py-0.5 rounded-md mt-1">
                  {linkedEmployee.cargo}
                </span>
                <span className="block text-[9px] text-emerald-700 tracking-wider font-extrabold mt-1">
                  {linkedEmployee.departamento}
                </span>
              </div>
            </div>

            {/* Contacts editing form */}
            <form onSubmit={handleUpdateContacts} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Contactos de Emergência e Morada</h4>
              
              <div className="space-y-3 font-semibold text-xs text-slate-600">
                {/* Contact */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none"
                    value={contacto}
                    onChange={e => setContacto(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">E-mail de Contacto</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {/* Morada */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Morada Residencial</label>
                  <textarea
                    required
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl focus:outline-none"
                    value={morada}
                    onChange={e => setMorada(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Atualizar Contactos</span>
              </button>
            </form>
          </div>

          {/* Column 2 & 3: Active Contract, Tasks, Payslips History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Contract Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                  <FileText className="w-4.5 h-4.5 text-emerald-600" />
                  <span>O Meu Contrato de Trabalho Activo</span>
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                  Registado em Sistema
                </span>
              </div>

              {myContract ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo de Contrato:</span>
                      <span className="text-slate-800 font-bold">{myContract.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Salário Base Registado:</span>
                      <span className="text-slate-900 font-black">{formatMT(myContract.salarioBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Data de Início:</span>
                      <span className="text-slate-800 font-bold">{myContract.dataInicio}</span>
                    </div>
                    {myContract.dataFim && (
                      <div className="flex justify-between text-rose-700">
                        <span>Data do Termo:</span>
                        <span className="font-bold">{myContract.dataFim}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Aviso de Governança Compliance:</p>
                      <p className="text-[9.5px] text-slate-500 mt-1 font-medium leading-relaxed">
                        Este documento digitalizado é cópia fiel do contrato assinado com a nossa organização. Em caso de dúvidas, contacte os Recursos Humanos.
                      </p>
                    </div>

                    {myContract.arquivoPdf && (
                      <button
                        type="button"
                        onClick={() => alert(`A descarregar cópia legítima do contrato: ${myContract.arquivoPdf}`)}
                        className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors w-full"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Baixar Documento Assinado (PDF)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 italic">Não há registo de contrato activo associado ao seu ID fiscal.</p>
              )}
            </div>

            {/* Personal Documents */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2 pb-2 border-b border-slate-50">
                <FileBadge className="w-4.5 h-4.5 text-emerald-600" />
                <span>Documentos Pessoais</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Action */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Adicionar Documento</h4>
                    <p className="text-[10px] text-slate-500 mb-3">Tire uma foto do seu documento de identificação, NUIT ou atestado médico.</p>
                  </div>
                  
                  {isCameraOpen ? (
                    <div className="space-y-2">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-32 object-cover"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Nome (Ex: BI)" className="p-1.5 border border-slate-200 rounded font-semibold focus:outline-none focus:border-emerald-500" />
                        <select value={docType} onChange={e => setDocType(e.target.value)} className="p-1.5 border border-slate-200 rounded font-semibold focus:outline-none focus:border-emerald-500 bg-white">
                          <option value="BI">BI</option>
                          <option value="NUIT">NUIT</option>
                          <option value="Atestado">Atestado Médico</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={capturePhoto} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Capturar</span>
                        </button>
                        <button onClick={stopCamera} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={startCamera} className="bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors w-full">
                      <ImagePlus className="w-4 h-4" />
                      <span>Usar Câmara</span>
                    </button>
                  )}
                </div>

                {/* Document List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {linkedEmployee?.documentos && linkedEmployee.documentos.length > 0 ? (
                    linkedEmployee.documentos.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                            <img src={doc.url} alt={doc.nome} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{doc.nome}</p>
                            <p className="text-[9px] text-slate-500 uppercase">{doc.tipo} • {doc.dataUpload}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-medium text-center">Nenhum documento<br/>carregado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List of Tasks Assigned to me */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2 pb-2 border-b border-slate-50">
                <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                <span>As Minhas Atividades e Tarefas Atribuídas ({myTasks.length})</span>
              </h3>

              {myTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 italic">Excelente! De momento não possui nenhuma atividade pendente.</p>
              ) : (
                <div className="space-y-2.5">
                  {myTasks.map(tsk => (
                    <div key={tsk.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800">{tsk.titulo}</h4>
                        <p className="text-[10px] text-slate-400">Prazo de Resolução: <span className="font-mono text-slate-600 font-bold">{tsk.prazo}</span></p>
                      </div>

                      <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tsk.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {tsk.priority === 'High' ? 'Alta' : tsk.priority === 'Medium' ? 'Média' : 'Baixa'}
                        </span>

                        <select
                          className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] text-slate-600 font-bold focus:outline-none"
                          value={tsk.estado}
                          onChange={e => onTaskStatusChange(tsk.id, e.target.value as any)}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em Progresso">Em Progresso</option>
                          <option value="Concluída">Concluída</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance History */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2 pb-2 border-b border-slate-50">
                <CalendarDays className="w-4.5 h-4.5 text-emerald-600" />
                <span>O Meu Histórico de Assiduidade ({myAttendance.length})</span>
              </h3>

              {myAttendance.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 italic">Não há registos de assiduidade associados a si.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2">
                  {myAttendance.map(a => (
                    <div key={a.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800">{a.data}</h4>
                        {a.comentario && <p className="text-[10px] text-slate-400">{a.comentario}</p>}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          a.presente === 'Presente' ? 'bg-emerald-50 text-emerald-700' :
                          a.presente === 'Atraso' ? 'bg-amber-50 text-amber-700' :
                          a.presente === 'Falta Justificada' ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {a.presente}
                        </span>
                        {a.horasExtras > 0 && (
                          <span className="text-[9px] text-blue-600 font-bold uppercase">
                            +{a.horasExtras}h Extras
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download/Check personal payslips history */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2 pb-2 border-b border-slate-50">
                <Award className="w-4.5 h-4.5 text-emerald-600" />
                <span>O Meu Histórico de Recibos de Salário ({myPaychecks.length})</span>
              </h3>

              {myPaychecks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 italic">Nenhum recibo de vencimento processado para o período atual.</p>
              ) : (
                <div className="space-y-2.5">
                  {myPaychecks.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3.5 bg-emerald-50/20 border border-emerald-100/60 rounded-xl font-semibold text-xs">
                      <div>
                        <h4 className="font-bold text-emerald-950 font-mono">Folha Salarial — {p.mes}/{p.ano}</h4>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1">
                          Ref Bancária: <span className="font-mono font-bold text-slate-700">{p.referenciaBancaria || 'A Processar'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-black text-emerald-800 font-mono">
                          {formatMT(p.salarioLiquido)}
                        </span>
                        <button
                          onClick={() => onPrintSlip(p)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Recibo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        // Administrative account profile dashboard
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-md p-6 space-y-6" id="admin-profile-card">
          <div className="text-center">
            <span className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 inline-block mb-3">
              <UserCheck className="w-10 h-10 mx-auto" />
            </span>
            <h3 className="font-extrabold text-slate-800 text-lg">{currentUser.nome}</h3>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mt-1 border border-emerald-100">
              {currentUser.perfil}
            </span>
          </div>

          <div className="border-t border-slate-50 pt-5 space-y-3 font-semibold text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">E-mail:</span>
              <span className="text-slate-800 font-bold">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data de Registro:</span>
              <span className="text-slate-800 font-bold">{currentUser.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Privilégios de Segurança:</span>
              <span className="text-emerald-700 font-bold">Leitura & Gravação (Total)</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl flex items-start space-x-2.5 text-[10px] font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-amber-800">
              Esta é uma conta administrativa ({currentUser.perfil}). Para visualizar a experiência do **Portal do Funcionário (onde se consulta recibos e assiduidade pessoal)**, faça log out e aceda através do perfil de teste de funcionário **abel@hrpay.co.mz** disponível no rodapé da página de autenticação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
