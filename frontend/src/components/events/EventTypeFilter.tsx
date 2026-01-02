import { EVENT_TYPE_LABELS } from '@/lib';

interface EventTypeFilterProps {
  selectedType: number | null;
  onSelect: (type: number | null) => void;
}

const eventTypes = [
  { value: null, label: 'All' },
  { value: 0, label: EVENT_TYPE_LABELS[0] },
  { value: 1, label: EVENT_TYPE_LABELS[1] },
  { value: 2, label: EVENT_TYPE_LABELS[2] },
  { value: 3, label: EVENT_TYPE_LABELS[3] },
  { value: 4, label: EVENT_TYPE_LABELS[4] },
];

export function EventTypeFilter({ selectedType, onSelect }: EventTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {eventTypes.map((type) => (
        <button
          key={type.value ?? 'all'}
          onClick={() => onSelect(type.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-full transition-colors
            ${selectedType === type.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
