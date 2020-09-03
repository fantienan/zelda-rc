import React, { FC, CSSProperties, RefObject, ReactNode, useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Modal as AModal } from "antd"
import { Rnd, Props, RndResizeStartCallback, RndResizeCallback, RndDragCallback } from 'react-rnd'
import { ModalProps } from 'antd/lib/modal'
import {
	RND_CLS, BOX_SHADOW, REACT_DRAGGBLE_DRAGGED, INIT_TIME_CLS, DESTROY_TIME_CLS, DEFAULT_CANCEL_CLOSABLE_CLASS_NAMES,
	OVERFLOW_CLS, STYLE, TOLERANCE, DEFAULT_X, DEFAULT_Y, DELAY, BODY_TAG_NAME, RND_CANCEL_SELECTOR,
	DEFAULT_WIDTH, MIN_HEIGHT, DEFAULT_RESIZE_GRID, ANT_MODAL_SELECTOR, ANT_MODAL_BODY_SELECTOR,
	ANT_MODAL_HEADER_SELECTOR, ANT_MODAL_FOOTER_SELECTOR, RND_Z_INDEX, CANCEL_CLOSABLE_CLASS_NAME,
} from './config'
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
}
interface IRendererBasiceProps {
	rndRef: RefObject<any>
	destroy: Function
}
type TRendererProps = TModalProps & IRendererBasiceProps
type TEnhanceModalProps = {
	store: IStoreProps
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
}
export type TModalProps = Partial<IBasicsModalProps & ModalProps>
const Renderer: FC<TRendererProps> = (props) => {
	const { children, rndRef, visible, destroy, ...resetProps } = props
	const [show, setShow] = useState<boolean>()
	const store = useRef<{ modalProps: ModalProps }>({ modalProps: {} })
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
		const modalProps = {
			...resetProps,
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
		store.current.modalProps = modalProps
		setShow(props.visible)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.visible])

	return <AModal {...store.current.modalProps} visible={show} width={resetProps.width}>
		{props.children}
	</AModal>
}

const EnhanceModal: FC<TEnhanceModalProps> = (props) => {
	const { children, drag, style, centered, rnd = {}, store, visible, resizable, ...resetProps } = props
	const rndRef = useRef<any>()
	const [update, forceupdate] = useState(1)

	// 兼容requestAnimationFrame
	const requestAnimationFrameFn = (
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		function (cb: FrameRequestCallback) {
			return window.setTimeout(cb, 1000 / 60)
		}
	)

	const cancelAnimationFrameFn = (
		window.cancelAnimationFrame ||
		window.webkitCancelAnimationFrame ||
		function (id: any) {
			window.clearTimeout(id)
		}
	)

	// 获取ant Modal
	const fn = (cb: Function) => requestAnimationFrameFn(() => {
		if (!rndRef.current) {
			fn(cb)
			return
		}
		const modalNode = rndRef.current.resizable.resizable.querySelector(ANT_MODAL_SELECTOR)
		if (!modalNode) {
			fn(cb)
			return
		}
		cancelAnimationFrameFn(store.id)
		cb({ modalNode })
	})

	const delayTask = (): Promise<TDelayTask> => new Promise((resolve, reject) => {
		store.id = fn(({ modalNode }: TDelayTask) => setTimeout(() => resolve({ modalNode }), DELAY))
	})

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

	// Modal显示之后
	const afterShowModalFn = async () => {
		if (rndRef.current) {
			updateRnd(updateRndProps())
			document.getElementsByTagName('body')[0].classList.add(OVERFLOW_CLS)
			rndRef.current.resizable.resizable.classList.add(INIT_TIME_CLS)
			const { modalNode } = await delayTask()
			const rect = modalNode.getBoundingClientRect()
			// 反复切换drag时 rndRef.current会丢失
			if (rndRef.current) {
				rndRef.current.resizable.resizable.classList.remove(INIT_TIME_CLS)
				document.getElementsByTagName('body')[0].classList.remove(OVERFLOW_CLS)
				const { width } = rect
				updateRnd({
					width,
					height: rect.height,
					...getPosition(rect.width, rect.height)
				})
				setTimeout(() => {
					const { height } = modalNode.getBoundingClientRect()
					updateRnd({
						width,
						height,
						...getPosition(rect.width, height)
					})
				}, 300)
				rndRef.current.resizable.resizable.classList.add(BOX_SHADOW)
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
	useEffect(() => {
		if (rndRef.current) {
			if (visible) {
				afterShowModalFn()
			} else if (visible === false) {
				afterHideModalFn()
			}
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
		if (!resizable) {
			s.overflow = "hidden"
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
		store.resizeing = false
		typeof rnd.onResizeStop === "function" && rnd.onResizeStop(e, dir, elementRef, delta, position)
	}
	const onDragStart: RndDragCallback = (e, data) => {
		store.draging = true
		typeof rnd.onDragStart === "function" && rnd.onDragStart(e, data)
	}
	const onDragStop: RndDragCallback = (e, data) => {
		store.draging = false
		typeof rnd.onDragStop === "function" && rnd.onDragStop(e, data)
	}
	const getAModalWidth = () => {
		if (visible === false && resizable && rndRef.current) {
			const node = rndRef.current.resizable.resizable.querySelector(ANT_MODAL_SELECTOR)
			const modalRect = node ? node.getBoundingClientRect() : { width: DEFAULT_WIDTH }
			return { width: modalRect.width }
		}
		return {
			width: resetProps.width
		}
	}
	const maskWrapper = (children: ReactNode) => (
		props.mask ?
			<div className={visible ? "drag-modal-mask" : ""}>{children}</div> :
			children
	)

	return <>{
		createPortal(maskWrapper(
			<Rnd
				ref={rndRef}
				className={[RND_CLS, store.rndContainerCls].join(" ")}
				style={getRndStyle()}
				minWidth={resetProps.width}
				minHeight={MIN_HEIGHT}
				resizeGrid={DEFAULT_RESIZE_GRID}
				{...rnd}
				onResizeStart={onResizeStart}
				onResize={onResize}
				onResizeStop={onResizeStop}
				onDragStart={onDragStart}
				onDragStop={onDragStop}
			>
				<Renderer
					{...resetProps}
					rndRef={rndRef}
					visible={visible}
					destroy={destroy}
					{...getAModalWidth()}
				>
					{children}
				</Renderer>
			</Rnd>),
			store.portals.node || document.getElementsByTagName("body")[0]
		)
	}</>
}
export const Modal: FC<TModalProps> = (props) => {
	const { children, drag, rnd, resizable, closable, cancelClosableClassName, ...modalProps } = props
	const store = useRef<IStoreProps>({
		id: null,
		destroyFlag: false,
		portals: {
			node: null,
			id: `portal-id-${parseInt((Math.random() * 1000000).toString())}`
		},
		rndContainerCls: `${RND_CLS}-${parseInt((Math.random() * 1000000).toString())}`,
		draging: false,
		resizeing: false
	})
	function clickHandle(e: MouseEvent) {
		if (!e.target || !props.visible) {
			return
		}
		const target = e.target as HTMLElement
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
		if (close && !target.closest(`.${store.current.rndContainerCls}`) && typeof props.onCancel === "function") {
			// @ts-ignore
			props.onCancel(e)
		}
	}
	useEffect(() => {
		props.visible && closable && !props.mask && document.addEventListener('click', clickHandle)
		return () => {
			closable && !props.mask && document.removeEventListener('click', clickHandle)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.visible])
	// 初始化时不渲染
	if (props.visible === undefined) {
		return null
	}
	if (!drag) {
		return <AModal {...modalProps}>
			{children}
		</AModal>
	}
	const rndCnf = !rnd?.cancel ? {
		...rnd,
		cancel: RND_CANCEL_SELECTOR
	} : rnd
	return <EnhanceModal {...props} store={store.current} rnd={rndCnf}>
		{children}
	</EnhanceModal>
}
Modal.defaultProps = {
	drag: true,
	resizable: false,
	width: DEFAULT_WIDTH,
	closable: true,
	zIndex: RND_Z_INDEX,
	cancelClosableClassName: CANCEL_CLOSABLE_CLASS_NAME
}

export default Modal;

