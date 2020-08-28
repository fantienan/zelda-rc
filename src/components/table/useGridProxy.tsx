import React, { SyntheticEvent, RefObject, useRef } from 'react'
import { ResizeCallbackData } from 'react-resizable'
import { TH } from './config'

type TUseGridProxy = [
    JSX.Element,
    (e: SyntheticEvent, data: ResizeCallbackData, type: 'start' | 'resize' | 'stop', dragRef: RefObject<any>, cb?: (width: number) => void) => void
]

const useGridProxy = (): TUseGridProxy => {
    const ref = useRef<any>()
    const setStyle: TUseGridProxy[1] = (e, data, type, dragRef, cb) => {
        const th = data.node.closest(TH)
        if (!ref.current || !dragRef.current || !th) {
            return
        }
        const dragRect = dragRef.current.getBoundingClientRect()
        const thRect = th.getBoundingClientRect()
        const x = thRect.x - dragRect.x
        const y = thRect.y - dragRect.y
        if (type === 'start') {
            const transform = `translate(${x}px, ${y}px)`
            ref.current.style.transform = transform
            ref.current.style.width = thRect.width + 'px'
            ref.current.style.height = thRect.height + 'px'
            ref.current.style.display = 'block'
            return
        }
        // @ts-ignore
        const width = e.x - x - dragRect.x
        if (type === 'resize') {
            return ref.current.style.width = `${width}px`
        }
        typeof cb === 'function' && cb(width)
        ref.current.style.display = 'none'
    }
    return [
        <div ref={ref} className="react-resizable-grid-proxy" />,
        setStyle
    ]
}

export default useGridProxy