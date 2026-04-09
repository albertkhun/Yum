import { SearchX, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon = SearchX, title = 'Nothing here yet', description = 'No results found.', action, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-brand" />
      </div>
      <h3 className="font-display font-bold text-gray-800 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">{description}</p>
      {actionTo && (
        <Link to={actionTo} className="btn-primary flex items-center gap-2">
          <PlusCircle size={17} />{actionLabel || 'Get Started'}
        </Link>
      )}
      {action && (
        <button onClick={action} className="btn-primary flex items-center gap-2">
          {actionLabel || 'Try Again'}
        </button>
      )}
    </div>
  );
}
