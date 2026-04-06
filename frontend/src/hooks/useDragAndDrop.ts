// useDragAndDrop: encapsulates dnd-kit sensor configuration
// The actual DnD context lives in StockGrid.tsx — this hook provides shared config
import { PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { DRAG_ACTIVATION_DISTANCE } from '../lib/constants'

export function useDragAndDrop() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return { sensors }
}
