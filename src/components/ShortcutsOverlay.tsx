import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Command, Search, Printer, Moon, Sun, Menu, X, Keyboard } from 'lucide-react';

export default function ShortcutsOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Atalhos de Teclado</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pressione as combinações abaixo para navegar rapidamente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ShortcutItem icon={<Search className="w-4 h-4" />} label="Pesquisa Global" keys={['Ctrl', 'K']} />
              <ShortcutItem icon={<Printer className="w-4 h-4" />} label="Imprimir/Exportar" keys={['Ctrl', 'P']} />
              <ShortcutItem icon={<Moon className="w-4 h-4" />} label="Alternar Tema" keys={['Ctrl', 'Alt', 'D']} />
              <ShortcutItem icon={<Menu className="w-4 h-4" />} label="Alternar Menu" keys={['Ctrl', 'M']} />
              <ShortcutItem icon={<Keyboard className="w-4 h-4" />} label="Mostrar Atalhos" keys={['Shift (segurar)']} />
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solte a tecla Shift para fechar</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShortcutItem({ icon, label, keys }: { icon: React.ReactNode, label: string, keys: string[] }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            <span className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm">
              {k}
            </span>
            {i < keys.length - 1 && <span className="text-slate-300 dark:text-slate-600">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
