import React, { FC, useState, useEffect, useRef, useMemo, ReactNode } from 'react'
import { Table as ATable } from 'antd'
import { Resizable } from 'react-resizable'
import DragProvider from './dragProvider'
// import VirtualTable from './virtualTable'
import {
	ACCEPT, DRAG_TABLE_CLS, LEVEL_VALUE, CANCEL_FRAG_COLUMN_CLS, CONTAINER_CLASS,
	TR_SELECTED_CLS, CLASS_NAME, /* PADDING_LEFT, VALUE_KEY */
} from './config'
import useGridProxy from './useGridProxy'
import {
	KV, IEnhanceTableProps, TEnhanceColumn, TMoveCard, TState, TBody,
	THandleResizable, THandleResizableStop, TColumn, IHeaderCellProps,
	IStoreProps, IRenderDragProviderItem, ITableProps as IT
} from './interface'
import "./style/index"

export interface ITableProps<RecordType = any> extends IT<RecordType> { }

const EnhanceTable: FC<IEnhanceTableProps> = (props) => {
	const {
		store,
		dragColumn,
		resizableColumn,
		virtual,
		rowHighlight,
		// paddingLeft = PADDING_LEFT,
		// valueKey = VALUE_KEY,
		loadingData,
		...tableProps
	} = props
	const [columns, setColumns] = useState<TEnhanceColumn[]>([])
	const [gridProxyHolder, setGridProxyStyle] = useGridProxy()
	const ref = useRef<any>()
	const orderBy: TMoveCard = (targetItem, nextItem, data = columns) => {
		const [removed] = data.splice(targetItem.index, 1)
		data.splice(nextItem.index, 0, removed)
	}
	// 拖拽改变顺序的回调
	const moveCard: TMoveCard = (targetItem, nextItem) => {
		if (targetItem.index === nextItem.index || !columns.length) {
			return
		}
		if (!nextItem.isLeaf) {
			orderBy(targetItem, nextItem)
			return setColumns(columns.map((c, index) => ({
				...c,
				state: {
					...c.state,
					index
				}
			})))
		}
		const data = getChildrenItem(targetItem, columns)
		if (Array.isArray(data) && data.length) {
			orderBy(targetItem, nextItem, data)
			setColumns(transformColumns(columns) as any)
		}
	}
	function getChildrenItem(targetItem: TState, columns: TEnhanceColumn[]) {
		let [, ...indexs] = (targetItem.indexPath || "").split('-').filter(Boolean).map(v => Number(v)).reverse()
		indexs = indexs.reverse()
		let i = 0
		let data = columns[indexs[0]].children
		while (i < indexs.length - 1 && Array.isArray(data) && data.length) {
			data = data[indexs[++i]].children
		}
		return data
	}
	// Resizable
	const handleResizeStart: THandleResizable = column => (e, data) => {
		setGridProxyStyle(e, data, 'start', ref)
	}

	const handleResize: THandleResizable = column => (e, data) => {
		setGridProxyStyle(e, data, 'resize', ref)
	}
	const setContainerWidth = (newWidth: number, oldWidth: number | string = 0) => {
		store.width = store.width - Number(oldWidth) + newWidth
	}
	const resizaStopCallback = (width: number, column: TEnhanceColumn, columns: TEnhanceColumn[]) => {
		const { index, isLeaf } = column.state
		if (isLeaf) {
			const data = getChildrenItem(column.state, columns)
			if (Array.isArray(data) && data.length) {
				setContainerWidth(width, data[index].width)
				data[index].width = width
				setColumns([...columns])
			}
			return
		}
		columns[index].width = width
		setContainerWidth(width, column.width)
		setColumns([...columns])
	}
	const handleResizeStop: THandleResizableStop = column => (e, data, columns) => {
		setGridProxyStyle(e, data, 'stop', ref, (width: number) => resizaStopCallback(width, column, columns))
	}

	const onHeaderCell = (column: TEnhanceColumn) => ({
		width: column.width,
		state: column.state,
		onResizeStart: handleResizeStart(column),
		onResize: handleResize(column),
		onResizeStop: handleResizeStop(column)
	})

	function generateColumns(col: TColumn, parentIndex: number, level: number, path: string): KV {
		if (Array.isArray(col.children) && col.children.length) {
			const type = `${ACCEPT}-${parentIndex}-${level}`
			return {
				...col,
				children: col.children.map((c: TColumn, index) => {
					const indexPath = `${path}-${index}`
					const state = {
						index,
						type,
						isLeaf: true,
						indexPath
					}
					return {
						...generateColumns(c, parentIndex, level + 1, indexPath),
						state,
						onHeaderCell
					}
				})
			}
		}
		return col
	}
	function transformColumns(data: TColumn[] = []) {
		return data.map((c: TColumn, index) => ({
			...generateColumns(c, index, LEVEL_VALUE, index.toString()),
			state: {
				index,
				type: ACCEPT,
				isLeaf: false
			},
			onHeaderCell
		}))
	}

	const renderDragProviderItem = ({ state, title, node }: IRenderDragProviderItem) => {
		const element = node ? node : title
		return dragColumn && state && typeof state === "object" ?
			<DragProvider.Item
				state={state}
				title={title}
				store={store}
				moveCard={moveCard}
			>
				{element}
			</DragProvider.Item> :
			element
	}
	const renderResize = (argus: IHeaderCellProps) => {
		let { onResize, onResizeStart, onResizeStop, width, state, ...restProps } = argus
		/**
		 * @todo 
		 * node扩展排序、筛选
		 */
		const node = undefined
		const th = <th {...restProps} >
			{renderDragProviderItem({ state, title: argus.children[1], node, className: argus.className })}
		</th>
		return resizableColumn ? <Resizable
			width={width || 0}
			height={0}
			handle={<span
				className={`react-resizable-handle react-resizable-handle-se ${CANCEL_FRAG_COLUMN_CLS}`}
				onClick={e => e.stopPropagation()}
			/>}
			onResize={onResize}
			onResizeStart={onResizeStart}
			onResizeStop={(e, data) => onResizeStop(e, data, columns)}
			draggableOpts={{ enableUserSelectHack: false }}
		>
			{th}
		</Resizable> : th
	}
	const headerCell = (argus: IHeaderCellProps) => {
		let { onResize, onResizeStart, onResizeStop, width, state, ...restProps } = argus
		return width === undefined ?
			<th {...restProps} >{renderDragProviderItem({ state, title: argus.children[1], className: argus.className })}</th> :
			renderResize(argus)
	}
	function clearHighlight() {
		if (store.nodes.length) {
			store.nodes.forEach((node: HTMLElement) => {
				node.classList.remove(TR_SELECTED_CLS)
			})
		}
	}
	function mouseClick(e: MouseEvent) {
		const target = e.target as HTMLElement
		if (target) {
			const container = target.closest(CONTAINER_CLASS)
			!container && clearHighlight()
		}
	}
	// 计算宽度，解决设置列宽后、拖拽调整列宽列宽不准的问题
	const moldedbreadth = (data: any, ws: number = 0) => {
		return data.reduce((acc: number, cur: any) => {
			if (!Array.isArray(cur.children)) {
				acc += Number(cur.width)
			} else {
				acc = moldedbreadth(cur.children, acc)
			}
			return acc
		}, ws)
	}
	useEffect(() => {
		rowHighlight && document.addEventListener('click', mouseClick)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rowHighlight])
	useEffect(() => {
		store.width = moldedbreadth(props.columns || [], 70)
		setColumns(transformColumns(props.columns) as any)
		return () => {
			rowHighlight && document.removeEventListener('click', mouseClick)
			store.nodes = []
			store.destroy()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.columns])
	if (!columns.length) {
		return null
	}
	const generateNode = (body?: TBody) => {
		const containerCnf = {
			ref,
			className: dragColumn ? [DRAG_TABLE_CLS, store.dragTableCls].join(" ") : undefined,
			style: {
				maxWidth: "100%",
				width: store.width || undefined
			}
		}
		const tableCnf = {
			...tableProps,
			columns,
			components: {
				header: {
					cell: headerCell,
				},
				body
			}
		}
		const proxyHolder = resizableColumn ? gridProxyHolder : null
		const node = <div {...containerCnf}>
			{dragColumnWrapper(<ATable {...tableCnf} />)}
			{proxyHolder}
		</div>
		return node
	}
	// 拖拽列排序包装器
	const dragColumnWrapper = (children: ReactNode) => (
		dragColumn ? <DragProvider>
			{children}
		</DragProvider> :
			children
	)
	// 渲染器
	// const renderer = () => {
	// 	return virtual ?
	// 		<VirtualTable
	// 			{...tableProps}
	// 			columns={columns}
	// 			store={store}
	// 			rowHighlight={rowHighlight}
	// 			paddingLeft={paddingLeft}
	// 			valueKey={valueKey}
	// 			loadingData={loadingData}
	// 			generateNode={generateNode}
	// 			clearHighlight={clearHighlight}
	// 		/> :
	// 		generateNode()
	// }
	// return renderer()
	return generateNode()

}
export function Table<RecordType extends object = any>(props: ITableProps<RecordType>) {
	const {
		dragColumn,
		resizableColumn,
		virtual,
		rowHighlight,
		paddingLeft,
		valueKey,
		loadingData,
		...tableProps
	} = props
	const store = useMemo<IStoreProps>(() => ({
		dragTableCls: `drag-table-${parseInt((Math.random() * 1000000).toString())}`,
		hoverActiveItem: undefined,
		setTableWidthTimer: null,
		oldDataSource: [], // 只用于比对前后两次dataSource是否一样
		cacheDataSources: {},// 缓存状态：例如展开、收起...
		nodes: [],
		width: 0,
		destroy: () => {
			store.hoverActiveItem = undefined
			clearTimeout(store.setTableWidthTimer)
			store.setTableWidthTimer = null
			store.oldDataSource = []
			store.cacheDataSources = {}
			store.nodes = []
			store.width = 0
		}
	}), [])
	if (
		!Array.isArray(props.columns) ||
		!(props.columns || []).length ||
		(!dragColumn && !resizableColumn && !virtual)
	) {
		return <ATable {...tableProps} />
	}

	return <EnhanceTable {...props} store={store} columns={props.columns} />
}

Table.defaultProps = {
	dragColumn: true,
	resizableColumn: true,
	className: CLASS_NAME,
	bordered: true,
	loading: false,
	size: 'small',
	virtual: false,
}

export default Table

