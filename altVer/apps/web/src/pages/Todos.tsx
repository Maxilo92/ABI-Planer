import React from 'react';
import { useAppContext } from '../context/AppContext';
import { mockTodos } from '../data/mockData';
import { CheckCircle2, Circle, User, Calendar, Trash2, Plus, Lock, ClipboardList } from 'lucide-react';

const Todos: React.FC = () => {
  const { currentYear, isReadOnly } = useAppContext();
  const todos = mockTodos[currentYear.id] || [];

  const openTodos = todos.filter(t => t.status === 'todo');
  const doneTodos = todos.filter(t => t.status === 'done');

  const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high' }> = ({ priority }) => {
    const colors = {
      low: 'bg-blue-50 text-blue-600 border-blue-100',
      medium: 'bg-amber-50 text-amber-600 border-amber-100',
      high: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    };

    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const TodoItem: React.FC<{ todo: typeof todos[0] }> = ({ todo }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover-card-effect group">
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          {todo.status === 'done' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
          )}
        </div>
        <div>
          <h3 className={`font-bold text-sm sm:text-base ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {todo.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <PriorityBadge priority={todo.priority} />
            {todo.assignee && (
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                {todo.assignee}
              </span>
            )}
            {todo.dueDate && (
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(todo.dueDate).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aufgaben</h1>
          <p className="text-slate-500">Behalte den Überblick über alle To-Dos für {currentYear.label}</p>
        </div>
        <button
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
            isReadOnly
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
          }`}
        >
          {isReadOnly ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Nur Lesezugriff</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Neues Todo</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Open Todos */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              Offen
              <span className="bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {openTodos.length}
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {openTodos.length > 0 ? (
              openTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium italic">Keine offenen Aufgaben.</p>
              </div>
            )}
          </div>
        </div>

        {/* Done Todos */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              Erledigt
              <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {doneTodos.length}
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {doneTodos.length > 0 ? (
              doneTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium italic">Noch keine Aufgaben erledigt.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Todos;
