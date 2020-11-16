import React, { FC, ReactNode, Ref, CSSProperties, useRef, useEffect, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DragObjectWithType } from 'react-dnd/lib/interfaces/hooksApi'
import { HOVER_ACTIVE_CLS, TH } from '../config'
import { IStoreProps, TMoveCard, TState } from '../interface'
export interface IItemProps {
    children?: ReactNode
    state: TState
    title: string | ReactNode
    store: IStoreProps
    moveCard: TMoveCard
}
export interface IDragItem extends DragObjectWithType {
    index: TState["index"]
    node: Ref<any>
    type: TState["type"]
    title: string
    isLeaf: TState["isLeaf"]
    indexPath?: TState["indexPath"]
}
const Item: FC<IItemProps> = (props) => {
    const { children, title, state, moveCard } = props
    const { type } = state
    const ref = useRef<any>()
    const [style, setStyle] = useState<CSSProperties>()
    // useDrop：用于将当前组件用作放置目标。
    const [, drop] = useDrop({
        // 定义拖拽类型
        accept: type,
        hover(dragItem, monitor) {
            const item = dragItem as IDragItem
            // 拖拽目标的index
            const dragIndex = item.index
            // 放置目标的index
            const hoverIndex = props.state.index
            // 如果拖拽目标和放置目标相同的话，停止执行
            if (dragIndex === hoverIndex) {
                return clearHoverActive()
            }
            props.store.hoverActiveItem &&
                props.store.hoverActiveItem.current &&
                props.store.hoverActiveItem !== ref &&
                props.store.hoverActiveItem.current.classList.remove(HOVER_ACTIVE_CLS)

            if (props.store.hoverActiveItem !== ref) {
                props.store.hoverActiveItem = ref
                ref.current.classList.add(HOVER_ACTIVE_CLS)
            }
        },
        drop: (dragItem, monitor) => {
            clearHoverActive()
            const { title, node, ...state } = dragItem as IDragItem
            moveCard(
                { ...state },
                { ...props.state }
            )
        },
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        })
    })
    // useDrag：用于将当前组件用作拖动源。
    const [/* { isDragging, opacity } */, drag, preview] = useDrag({
        item: {
            node: ref,
            title,
            ...state
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(), // 是否正在拖拽
            opacity: monitor.isDragging() ? 0.4 : 1,
        }),
        end: (item, monitor) => {
            clearHoverActive()
        },
        // options: {
        //     dropEffect: props.showCopyIcon ? 'copy' : 'move',
        // },
        // canDrag: (monitor) => { },
        // isDragging: (monitor) => { },
        // begin: (monitor) => {},
    })
    function clearHoverActive() {
        if (
            props.store.hoverActiveItem &&
            props.store.hoverActiveItem.current
        ) {
            props.store.hoverActiveItem.current.classList.remove(HOVER_ACTIVE_CLS)
            props.store.hoverActiveItem = undefined
        }
    }
    drag(drop(ref))
    useEffect(() => {
        preview(getEmptyImage(), {
            captureDraggingState: true,
        })
        if (ref && ref.current) {
            const th = ref.current.closest(TH)
            if (th) {
                setStyle({
                    height: th.getBoundingClientRect().height,
                })
                th.style.padding = 0
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <div className="drag-item" ref={ref} style={style}>{children}</div>
}

export default Item
