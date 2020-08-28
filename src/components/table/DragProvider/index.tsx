import InternalDragProvider from './DragProvider'
import Item from './Item'

type TInternalDragProvider = typeof InternalDragProvider

interface IDragProvider extends TInternalDragProvider {
    Item: typeof Item
}

const DragProvider: IDragProvider = InternalDragProvider as IDragProvider

DragProvider.Item = Item

export default DragProvider

