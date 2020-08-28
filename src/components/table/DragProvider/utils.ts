import { CSSProperties } from 'react'
import { XYCoord } from 'react-dnd/lib/interfaces/monitors'
import { OPACITY } from '../config'
interface IGetItemStylesProps {
    initialOffset: XYCoord | null
    currentOffset: XYCoord | null
    width: number
    height: number
    snapToGrid?: boolean
}

export function snapToGrid(x: number, y: number) {
    const snappedX = Math.round(x / 32) * 32
    const snappedY = Math.round(y / 32) * 32
    return [snappedX, snappedY]
}

export function getItemStyles(props: IGetItemStylesProps): CSSProperties {
    const { initialOffset, currentOffset, width, height } = props
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none'
        }
    }
    let { x, y } = currentOffset
    // 对齐网格，吸附网格
    if (props.snapToGrid) {
        x -= initialOffset.x
        y -= initialOffset.y
            ;[x, y] = snapToGrid(x, y)
        x += initialOffset.x
        y += initialOffset.y
    }
    const transform = `translate(${x - initialOffset.x}px, ${y - initialOffset.y}px)`
    return {
        top: initialOffset.y,
        left: initialOffset.x,
        width: width + 'px',
        height: height + 'px',
        opacity: OPACITY,
        transform,
        WebkitTransform: transform,
    }
}