export default function Spinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-brand border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" text="Loading..." />
    </div>
  );
}
