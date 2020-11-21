import React, { FC, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useDragLayer } from 'react-dnd'
import { getItemStyles } from './utils'
import { CUSTOM_DRAG_LAYER } from '../config'
interface IRect {
    width: number
    height: number
}
const style: CSSProperties = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 9999,
    border: "1px solid #f0f0f0",
    top: 0,
    left: 0,
    background: "#fafafa",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
}
const CustomDragLayer: FC = () => {
    const { isDragging, item, initialOffset, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))
    if (!isDragging || !((item || {}).node || {}).current) {
        return null
    }
    const { width, height } = item.node.current.parentElement.getBoundingClientRect() as IRect
    debugger
    return createPortal(
        <div className={CUSTOM_DRAG_LAYER}
            style={{
                ...style,
                ...getItemStyles({ initialOffset, currentOffset, width, height })
            }}
        >
            {item.renderItem()}
        </div>,
        document.getElementsByTagName("body")[0]
    )
}

export default CustomDragLayer