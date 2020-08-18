import React, { FC, CSSProperties, RefObject, useRef, useEffect, useState } from "react"
import { Modal as AModal } from "antd"
import { Rnd, Props } from 'react-rnd'
import { ModalProps } from 'antd/lib/modal'
import './style/index'

type TDelayTask = { modalNode: HTMLElement }
interface IUpdate {
    width?: number
    height?: number
    x?: number
    y?: number
}
type TKV<V = any> = {
    [k: string]: V
}
export interface IBasiceModalProps {
    children?: React.ReactNode
    /**
     * 拖拽移动
    */
    drag?: boolean
    /**
     * 拖拽的配置，参考[react-rnd](https://github.com/bokuweb/react-rnd)
    */
    rnd?: Props
    /**
     * 改变弹框大小
    */
    resizable: boolean
}
export type TModalProps = Partial<IBasiceModalProps & ModalProps>
type TRendererProps = Partial<TModalProps & { rndRef: RefObject<any> }>

const RND_CLS = "rnd-container"
const BOX_SHADOW = "box-shadow"
const REACT_DRAGGBLE_DRAGGED = "react-draggable-dragged"
const INIT_TIME = "init-time"
const OVERFLOW_CLS = "overflow-hidden"
const STYLE: CSSProperties = {
    top: 0,
    paddingBottom: 0
}

const DEFAULT_X = 0
const DEFAULT_Y = 100
const DELAY = 500

const Renderer: FC<TRendererProps> = (props) => {
    const { children, rndRef, visible, ...resetProps } = props
    const [show, setShow] = useState<boolean>()
    useEffect(() => {
        props.visible ? setTimeout(() => {
            setShow(props.visible)
        }, 50) : setShow(props.visible)
    }, [props.visible])
    const modalProps = {
        ...resetProps,
        mask: false,
        getContainer: () => rndRef && rndRef.current ? rndRef.current.resizable.resizable : false,
        style: STYLE
    }
    return <AModal {...modalProps} visible={show}>
        {props.children}
    </AModal>
}

export const Modal: FC<TModalProps> = (props) => {
    const { children, drag, style, centered, rnd = {}, visible, resizable, ...resetProps } = props
    const store = useRef<{ id: any }>({ id: null })
    const rndRef = useRef<any>()
    const requestAnimationFrameFn = (() => (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (cb: FrameRequestCallback) {
            return window.setTimeout(cb, 1000 / 60)
        }
    ))()

    const cancelAnimationFrameFn = (() => (
        window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        function (id: any) {
            window.clearTimeout(id)
        }
    ))()

    const fn = (cb: Function) => requestAnimationFrameFn(() => {
        const modalNode = rndRef.current.resizable.resizable.getElementsByClassName('ant-modal')
        if (!modalNode.length) {
            fn(cb)
            return
        }
        cancelAnimationFrameFn(store.current.id)
        cb({ modalNode: modalNode[0] })
    })
    const delayTask = (): Promise<TDelayTask> => new Promise((resolve, reject) => {
        store.current.id = fn(({ modalNode }: TDelayTask) => setTimeout(() => resolve({ modalNode }), DELAY))
    })

    const updateRnd = ({ width = 0, height = 0, x = 0, y = 0 }: IUpdate) => {
        rndRef.current.updateSize({ width, height })
        rndRef.current.updatePosition({ x, y })
    }

    const getPosition = (width: number, height: number) => {
        const position = {
            x: window.innerWidth / 2 - width / 2,
            y: DEFAULT_Y
        }
        if (centered) {
            position.y = window.innerHeight / 2 - height / 2
        }
        return position
    }
    // Modal显示之后
    const afterShowModalFn = async () => {
        if (rndRef.current) {
            updateRnd({
                width: window.innerWidth - DEFAULT_X,
                height: window.innerHeight - DEFAULT_Y,
                x: DEFAULT_X,
                y: DEFAULT_Y - 10
            })
            document.getElementsByTagName('body')[0].classList.add(OVERFLOW_CLS)
            rndRef.current.resizable.resizable.classList.add(INIT_TIME)
            const { modalNode } = await delayTask()
            const rect = modalNode.getBoundingClientRect()
            rndRef.current.resizable.resizable.classList.remove(INIT_TIME)
            document.getElementsByTagName('body')[0].classList.remove(OVERFLOW_CLS)
            updateRnd({
                width: rect.width,
                height: rect.height,
                ...getPosition(rect.width, rect.height)
            })
            rndRef.current.resizable.resizable.classList.add(BOX_SHADOW)
        }
    }
    // Modal隐藏之后
    const afterHideModal = () => {
        if (rndRef.current) {
            updateRnd({})
            rndRef.current.resizable.resizable.classList.remove(BOX_SHADOW)
            rndRef.current.resizable.resizable.classList.remove(REACT_DRAGGBLE_DRAGGED)
        }
    }

    useEffect(() => {
        if (rndRef.current) {
            visible === true && afterShowModalFn()
            visible === false && afterHideModal()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.visible])
    if (!drag) {
        return <AModal visible={visible} {...resetProps}>
            {children}
        </AModal>
    }
    if (!visible) {
        return null
    }
    const rndStyle = ((): CSSProperties => {
        const s: TKV = {
            top: rnd.style?.top,
            left: rnd.style?.left,
            bottom: rnd.style?.bottom,
            right: rnd.style?.right,
        }
        if (!resizable) {
            s.overflow = "hidden"
        }
        return Object.keys(s).reduce((acc: TKV, k: string) => {
            s[k] && (acc[k] = s[k])
            return acc
        }, {}) as CSSProperties
    })()
    return <Rnd ref={rndRef} className={RND_CLS} style={rndStyle} >
        <Renderer {...resetProps} children={children} rndRef={rndRef} visible={visible} />
    </Rnd>
}
Modal.defaultProps = {
    drag: true,
    resizable: false
}

export default Modal;