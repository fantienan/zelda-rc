import React, { FC } from 'react'
import { useDragLayer } from 'react-dnd'
import { getItemStyles } from './utils'
import { CUSTOM_DRAG_LAYER } from '../config'
interface IRect {
    width: number
    height: number
}

const CustomDragLayer: FC = () => {
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))
    function renderItem() {
        switch (itemType) {
            case item.type:
                return item.title
            default:
                return null
        }
    }
    if (!isDragging || !((item || {}).node || {}).current) {
        return null
    }
    const { width, height } = item.node.current.parentElement.getBoundingClientRect() as IRect
    return (
        <div className={CUSTOM_DRAG_LAYER}
            style={getItemStyles({ initialOffset, currentOffset, width, height })}
        >
            {renderItem()}
        </div>
    )
}

export default CustomDragLayer