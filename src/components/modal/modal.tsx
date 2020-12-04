import React, {
	FC, CSSProperties, RefObject, ReactNode, useRef, useEffect, useState,
	Ref, forwardRef, useImperativeHandle
} from "react"
import { createPortal } from "react-dom"
import { Modal as AModal } from "antd"
import { Rnd, Props, RndResizeStartCallback, RndResizeCallback, RndDragCallback } from 'react-rnd'
import { ModalProps } from 'antd/lib/modal'
import {
	RND_CLS, BOX_SHADOW, REACT_DRAGGBLE_DRAGGED, INIT_TIME_CLS, DESTROY_TIME_CLS, DEFAULT_CANCEL_CLOSABLE_CLASS_NAMES,
	OVERFLOW_CLS, STYLE, TOLERANCE, DEFAULT_X, DEFAULT_Y, BODY_TAG_NAME, RND_CANCEL_SELECTOR, ANT_MODAL_CLS,
	DEFAULT_WIDTH, MIN_HEIGHT, DEFAULT_RESIZE_GRID, ANT_MODAL_SELECTOR, ANT_MODAL_BODY_SELECTOR, RESIZE_HANDLE_WRAPPER_CLASS,
	ANT_MODAL_HEADER_SELECTOR, ANT_MODAL_FOOTER_SELECTOR, RND_Z_INDEX, CANCEL_CLOSABLE_CLASS_NAME,
} from './config'
import './style/index'
import useClick from "./use-click"

interface IUpdate {
	width?: number | string
	height?: number | string
	x?: number
	y?: number
}
type TKV<V = any> = {
	[k: string]: V
}
interface ICnf {
	width: number
	height: number
	x: number
	y: number
}
interface IStoreProps {
	id: any
	destroyFlag: boolean,
	portals: {
		node: HTMLElement | null
		id: string
	}
	rndContainerCls: string
	draging: boolean
	resizeing: boolean
	resizeingWidth: number
	resizeingHeight: number
}
interface IRendererBasiceProps {
	rndRef: RefObject<any>
	destroy: Function
}
type TRendererProps = {
	afterShowModalFn: (rect?: DOMRect) => void
	clickHandle: (e: MouseEvent) => void
} & TModalProps & IRendererBasiceProps

interface IPlaceholder {
	afterShowModalFn: (rect?: DOMRect) => void
	clickHandle: (e: MouseEvent) => void
	visible?: boolean
	closable?: boolean
	mask?: boolean
	rndRef: RefObject<any>
}

type TEnhanceModalProps = {
	store: IStoreProps
	rndRef: RefObject<any>
} & TModalProps
interface IBasicsModalProps {
	children?: ReactNode
	/**
	 * 拖拽移动
	*/
	drag?: boolean
	/**
	 * 拖拽的配置，参考[react-rnd](https://github.com/bokuweb/react-rnd)
	*/
	rnd?: Props
	/**
	 * 改变弹框大小，`只在drag=true时生效`
	*/
	resizable?: boolean
	/**
	 * 标题
	 */
	title: ReactNode | string
	/**
	 * 宽度
	*/
	width: number | string
	/**
	 * 点击弹窗以外的部分是否关闭弹窗，`只在drag=true时生效`
	*/
	closable?: boolean
	/**
	 * 设置 Modal 的 z-index
	*/
	zIndex?: number
	/**
	 * 在点击弹窗以外的部分时阻止关闭Modal的className，`只在drag=true时生效`
	*/
	cancelClosableClassName?: string | string[]
	/**
	 * 是否展示遮罩层，`drag=true`、`mask=true`时，点击弹窗以外弹窗将不会被关闭，这是设置`closable=true`将失效
	*/
	mask?: boolean
	/**
	 * rnd className
	*/
	rndClassName?: string
}
export type TModalProps = Partial<IBasicsModalProps & ModalProps & { rndRef: RefObject<any> }>

const Placeholder = (props: IPlaceholder) => {
	const rect = useRef<DOMRect>()
	useClick({
		visible: props.visible,
		clickHandle: props.clickHandle,
		closable: props.closable,
		mask: props.mask
	})
	useEffect(() => {
		if (props.visible) {
			if (!rect.current) {
				const { resizable } = props.rndRef.current.resizable
				rect.current = resizable.querySelector(ANT_MODAL_SELECTOR).getBoundingClientRect()
			}
			props.afterShowModalFn(rect.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.visible])
	return <div></div>
}
const Renderer = forwardRef((props: TRendererProps, ref: Ref<any>) => {
	const {
		children, rndRef, visible, destroy, afterShowModalFn,
		clickHandle, closable, ...resetProps
	} = props
	const [show, setShow] = useState<boolean>()
	const [width, setWidth] = useState<string | number | undefined>(resetProps.width)
	const [modalProps, setModalProps] = useState<ModalProps>()
	const afterClose = () => {
		destroy()
		if (!props.destroyOnClose && rndRef.current.resizable) {
			const { resizable } = rndRef.current.resizable
			const antModalNode = resizable.querySelector(ANT_MODAL_SELECTOR)
			antModalNode.style.top = '0px'
			antModalNode.style.left = '0px'
		}
		typeof resetProps.afterClose === "function" && resetProps.afterClose()
	}
	useEffect(() => {
		setWidth(resetProps.width)
	}, [resetProps.width])
	useEffect(() => {
		const modalProps: any = {
			mask: false,
			maskClosable: false,
			style: STYLE,
			afterClose
		}
		if (rndRef && rndRef.current) {
			modalProps.getContainer = () => ((rndRef.current || {}).resizable || {}).resizable || false
		} else if (typeof resetProps.getContainer === "function") {
			modalProps.getContainer = resetProps.getContainer
		}
		setModalProps(modalProps)
		setShow(props.visible)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.visible])
	useImperativeHandle(ref, () => ({
		setKeyboard: (keyboard?: false) => {
			setModalProps({
				...modalProps,
				keyboard
			})
		},
		setWidth: (width: number) => {
			setWidth(width)
		}
	}))
	return <AModal {...resetProps} {...modalProps} visible={show} width={width}>
		{props.children}
		<Placeholder
			afterShowModalFn={afterShowModalFn}
			visible={visible}
			clickHandle={clickHandle}
			rndRef={rndRef}
			closable={closable}
			mask={resetProps.mask}
		/>
	</AModal>
})

const EnhanceModal: FC<TEnhanceModalProps> = (props) => {
	const {
		children, drag, style, centered, rnd = {}, store, visible,
		resizable, rndRef, rndClassName, closable, cancelClosableClassName,
		...resetProps
	} = props
	const [update, forceupdate] = useState(1)
	const rendererRef = useRef<any>()
	const updateRnd = ({ width = 0, height = 0, x = 0, y = 0 }: IUpdate) => {
		!store.resizeing && rndRef.current.updateSize({ width, height })
		!store.draging && rndRef.current.updatePosition({ x, y })
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

	// 创建传送门挂载的dom
	const createDom = () => {
		store.portals.node = (
			typeof resetProps.getContainer === "function" &&
				resetProps.getContainer() instanceof HTMLElement ?
				resetProps.getContainer() :
				document.getElementsByTagName("body")[0]
		)
		const { id } = store.portals
		store.portals.node.classList.add(id)
		if (store.portals.node.tagName !== BODY_TAG_NAME && !document.querySelector(`.${id}`)) {
			document.getElementsByTagName("body")[0].appendChild(store.portals.node)
		}
	}
	// 更新rnd props 
	const updateRndProps = () => ({
		width: window.innerWidth - DEFAULT_X,
		height: window.innerHeight - DEFAULT_Y,
		x: DEFAULT_X,
		y: DEFAULT_Y - TOLERANCE
	})

	const defaultRnd = (cnf: ICnf) => {
		return rnd.default || cnf
	}

	// Modal显示之后
	const afterShowModalFn = async (rect?: DOMRect) => {
		if (rndRef.current) {
			updateRnd(defaultRnd(updateRndProps()))
			document.getElementsByTagName('body')[0].classList.add(OVERFLOW_CLS)
			!rnd.default && rndRef.current.resizable.resizable.classList.add(INIT_TIME_CLS)
			// 反复切换drag时 rndRef.current会丢失
			if (rndRef.current && rect) {
				// 是可拖拽给变大小并且拖拽改变大过
				if (
					rnd.enableResizing &&
					store.resizeingHeight &&
					store.resizeingWidth &&
					!resetProps.destroyOnClose
				) {
					rect.width = store.resizeingWidth
					rect.height = store.resizeingHeight
				}
				const { resizable } = rndRef.current.resizable
				document.getElementsByTagName('body')[0].classList.remove(OVERFLOW_CLS)
				if (rnd.default) {
					resizable.classList.add(BOX_SHADOW)
					return
				}
				setTimeout(() => {
					updateRnd(defaultRnd({
						width: rect.width,
						height: rect.height,
						...getPosition(rect.width, rect.height)
					}))
					resizable.classList.add(BOX_SHADOW)
					resizable.classList.remove(INIT_TIME_CLS)
				}, 300)
			}
		}
	}
	// Modal隐藏之后
	const afterHideModalFn = () => {
		if (rndRef.current) {
			document.getElementsByTagName('body')[0].classList.add(OVERFLOW_CLS)
			const { resizable } = rndRef.current.resizable
			const antModalNode = resizable.querySelector(ANT_MODAL_SELECTOR)
			// visible为false时 切换drag为true
			if (!antModalNode) {
				updateRnd({
					x: - DEFAULT_X,
					y: - DEFAULT_Y
				})
				return
			}
			updateRnd({
				...updateRndProps(),
				height: window.innerHeight + TOLERANCE,
				y: 0
			})
			resizable.classList.remove(BOX_SHADOW)
			resizable.classList.remove(REACT_DRAGGBLE_DRAGGED)
			resizable.classList.add(DESTROY_TIME_CLS)
			const { x, y } = resizable.getBoundingClientRect()
			if (antModalNode) {
				resizable.querySelector(ANT_MODAL_SELECTOR).style.top = y + 'px'
				resizable.querySelector(ANT_MODAL_SELECTOR).style.left = x + 'px'
			}
		}
	}
	const destroy = () => {
		document.getElementsByTagName('body')[0].classList.remove(OVERFLOW_CLS)
		// 销毁组件
		if (resetProps.destroyOnClose) {
			store.destroyFlag = true
			forceupdate(update + 1)
			return
		}
		rndRef.current.resizable.resizable.classList.remove(DESTROY_TIME_CLS)
		updateRnd({
			x: - DEFAULT_X,
			y: - DEFAULT_Y
		})
	}
	function clickHandle(e: MouseEvent | React.MouseEvent) {
		e.stopPropagation()
		if (!e.target || !props.visible || store.resizeing) return
		const target = e.target as HTMLElement
		// 兼容点击删除modal中元素
		if (!document.body.contains(target) || target.closest(`.${RND_CLS}`)) return
		let excludes = typeof cancelClosableClassName === "string" && !!cancelClosableClassName.trim() ?
			[cancelClosableClassName] :
			Array.isArray(cancelClosableClassName) && cancelClosableClassName.filter(v => v.toString().trim()).length ?
				cancelClosableClassName :
				[]
		excludes = [
			...DEFAULT_CANCEL_CLOSABLE_CLASS_NAMES,
			...excludes
		]
		let close = true
		for (let i = 0; i < excludes.length; i++) {
			const cls = excludes[i].toString().trim()
			if (target.closest(`.${cls}`)) {
				close = false
				break
			}
		}
		if (close && typeof props.onCancel === "function") {
			props.onCancel(e as any)
		}
	}
	useEffect(() => {
		if (rndRef.current && visible === false) {
			afterHideModalFn()
		}
		return () => {
			try {
				if (store.portals.node) {
					document.getElementsByTagName("body")[0].removeChild(store.portals.node)
					// eslint-disable-next-line react-hooks/exhaustive-deps
					store.portals.node = null
				}
			} catch (e) { }
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.visible, props.drag])
	if (visible === undefined || store.destroyFlag) {
		store.destroyFlag = false
		return null
	}
	createDom()
	const getRndStyle = () => {
		const s: TKV = {
			top: rnd.style?.top,
			left: rnd.style?.left,
			bottom: rnd.style?.bottom,
			right: rnd.style?.right,
			zIndex: rnd.style?.zIndex || props.zIndex || RND_Z_INDEX
		}
		return Object.keys(s).reduce((acc: TKV, k: string) => {
			s[k] && (acc[k] = s[k])
			return acc
		}, {}) as CSSProperties
	}
	const setRect = () => {
		const containerNode = rndRef.current.resizable.resizable
		const bodyNode = containerNode.querySelector(ANT_MODAL_BODY_SELECTOR)
		const headerNodeRect = containerNode.querySelector(ANT_MODAL_HEADER_SELECTOR).getBoundingClientRect()
		const footerNodeRect = containerNode.querySelector(ANT_MODAL_FOOTER_SELECTOR).getBoundingClientRect()
		bodyNode.style.height = containerNode.getBoundingClientRect().height - headerNodeRect.height - footerNodeRect.height + 'px'
	}

	const onResizeStart: RndResizeStartCallback = (e, dir, refToElement) => {
		store.resizeing = true
		typeof rnd.onResizeStart === 'function' && rnd.onResizeStart(e, dir, refToElement)
	}
	const onResize: RndResizeCallback = (e, dir, refToElement, delta, position) => {
		setRect()
		typeof rnd.onResize === "function" && rnd.onResize(e, dir, refToElement, delta, position)
	}
	const onResizeStop: RndResizeCallback = (e, dir, elementRef, delta, position) => {
		const elementRefRect = elementRef.getBoundingClientRect()
		store.resizeingHeight = elementRefRect.height
		store.resizeingWidth = elementRefRect.width
		rendererRef.current.setWidth(elementRefRect.width)
		setTimeout(() => {
			store.resizeing = false
		}, 120)
		typeof rnd.onResizeStop === "function" && rnd.onResizeStop(e, dir, elementRef, delta, position)
	}
	const onDragStart: RndDragCallback = (e, data) => {
		// 拖拽时点击esc禁止关闭modal
		rendererRef.current.setKeyboard(false)
		store.draging = true
		typeof rnd.onDragStart === "function" && rnd.onDragStart(e, data)
	}
	const onDragStop: RndDragCallback = (e, data) => {
		rendererRef.current.setKeyboard()
		store.draging = false
		typeof rnd.onDragStop === "function" && rnd.onDragStop(e, data)
	}
	const maskWrapper = (children: ReactNode) => (
		props.mask ?
			<div className={visible ? "drag-modal-mask" : ""} onClick={clickHandle}>{children}</div> :
			children
	)
	return <>{
		createPortal(maskWrapper(
			<Rnd
				ref={rndRef}
				className={[
					RND_CLS, store.rndContainerCls, rndClassName,
					rnd.enableResizing ? "enable-resizing" : ""
				].join(" ")}
				style={getRndStyle()}
				minWidth={resetProps.width}
				minHeight={MIN_HEIGHT}
				resizeGrid={DEFAULT_RESIZE_GRID}
				{...rnd}
				resizeHandleWrapperClass={RESIZE_HANDLE_WRAPPER_CLASS}
				dragHandleClassName={ANT_MODAL_CLS}
				onResizeStart={onResizeStart}
				onResize={onResize}
				onResizeStop={onResizeStop}
				onDragStart={onDragStart}
				onDragStop={onDragStop}
			>
				<Renderer
					ref={rendererRef}
					{...resetProps}
					rndRef={rndRef}
					visible={visible}
					destroy={destroy}
					afterShowModalFn={afterShowModalFn}
					clickHandle={clickHandle}
					closable={closable}
				>
					{children}
				</Renderer>
			</Rnd>),
			store.portals.node || document.getElementsByTagName("body")[0]
		)
	}</>
}
export const Modal = forwardRef((props: TModalProps, ref: Ref<any>) => {
	const { children, drag, rnd, resizable, rndClassName, ...modalProps } = props
	const store = useRef<IStoreProps>({
		id: null,
		destroyFlag: false,
		portals: {
			node: null,
			id: `portal-id-${parseInt((Math.random() * 1000000).toString())}`
		},
		rndContainerCls: `${RND_CLS}-${parseInt((Math.random() * 1000000).toString())}`,
		draging: false,
		resizeing: false,
		resizeingWidth: 0,
		resizeingHeight: 0
	})
	const rndRef = useRef<any>()
	useImperativeHandle(ref, () => ({
		rndRef
	}))
	useEffect(() => {
		store.current.resizeing = false
		store.current.resizeingHeight = 0
		store.current.resizeingWidth = 0
	}, [props.resizable])
	if (!drag && !resizable) {
		return <AModal {...modalProps}>
			{children}
		</AModal>
	}
	// 初始化时不渲染
	if (props.visible === undefined) {
		return null
	}
	const getRndCnf = () => {
		const rndCnf: Props = {
			enableResizing: resizable,
			disableDragging: !drag,
			...rnd
		}
		!rnd?.cancel && (rndCnf.cancel = RND_CANCEL_SELECTOR)
		!rnd?.bounds && (rndCnf.bounds = "body")
		return rndCnf
	}
	return <EnhanceModal {...props} store={store.current} rnd={getRndCnf()} rndRef={rndRef}>
		{children}
	</EnhanceModal>
})
Modal.defaultProps = {
	drag: true,
	resizable: false,
	width: DEFAULT_WIDTH,
	closable: true,
	zIndex: RND_Z_INDEX,
	cancelClosableClassName: CANCEL_CLOSABLE_CLASS_NAME,
	rndClassName: ""
}

export default Modal;