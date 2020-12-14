import InternalDragProvider from './dragProvider'
import Item from './item'

type TInternalDragProvider = typeof InternalDragProvider

interface IDragProvider extends TInternalDragProvider {
    Item: typeof Item
}

const DragProvider: IDragProvider = InternalDragProvider as IDragProvider

DragProvider.Item = Item

export default DragProvider

