import React, { FC, CSSProperties, useState, useEffect, useRef, useMemo } from 'react'
import { Table as ATable } from 'antd'
import { Resizable } from 'react-resizable'
import { VariableSizeGrid as Grid } from 'react-window'
import ResizeObserver from 'rc-resize-observer'
import {
	FolderOutlined,
	FolderOpenOutlined,
	PlusSquareOutlined,
	MinusSquareOutlined,
	LoadingOutlined
} from '@ant-design/icons'
import DragProvider from './DragProvider'
import {
	ACCEPT, DRAG_TABLE_CLS, LEVEL_VALUE, CANCEL_FRAG_COLUMN_CLS, TRUE, FALSE,
	classNames, KEY_ALL, ROW_HEIGHT, DATA_ROW_CLASS_NAME, CONTAINER_CLASS, EXPORATION_TIME,
	TR_SELECTED_CLS, PADDING_LEFT, CLASS_NAME, VALUE_KEY, PERFIX_ICON, DEFAULT_STATE,
	VIRTUAL_GRID_BORDERED_CLS, ROW_HIGHLIGHT, VIRTUAL_GRID_CLS, VIRTUAL_TABLE_CELL_CLS,
	VIRTUAL_TABLE_CELL_LAST_CLS, VIRTUAL_TABLE_CELL_FIRST_CLS
} from './config'
import useGridProxy from './useGridProxy'
import {
	KV, IEnhanceTableProps, TEnhanceColumn, TMoveCard, TState,
	THandleResizable, THandleResizableStop, TColumn, IHeaderCellProps,
	IStoreProps, IRenderDragProviderItem, IRenderGridProps, TOriginalData,
	TreeDataInterface, TLoadingDataRes, TLoadingData, TRenderGrid
} from './interface'
import { TableProps } from 'antd/lib/table'
import "./style/index"

export interface ITableProps<RecordType = any> extends TableProps<RecordType> {
	/**
	 * 拖拽改变列的顺序
	*/
	dragColumn?: boolean
    /**
     * 拖拽改变列宽
    */
	resizableColumn?: boolean
	/**
	 * 虚拟表格
	*/
	virtual?: boolean
	/**
	 * 虚拟表格配置行高
	 */
	rowHeight?: (index: number) => void | number
	/**
	 * 虚拟表格层级间的梯度
	*/
	paddingLeft?: number
	/**
	 * 虚拟列表树状数据获取唯一标识的key
	 */
	valueKey?: string
	/**
	 * 虚拟列表加载树状数据子节点数据
	 */
	loadingData?: TLoadingData
	/**
	 * 虚拟列表渲染table tbody单元格
	 */
	renderGrid?: TRenderGrid
	/**
	 * 点击行是否高亮
	 */
	rowHighlight?: boolean
    /**
     * 页面是否加载，[配置项](https://ant.design/components/table-cn/#Table)
    */
	loading?: TableProps<RecordType>["loading"]
	/**
	 * 表格是否可滚动，也可制定表格宽高，[配置项](https://ant.design/components/table-cn/#scroll)
	*/
	scroll?: TableProps<RecordType>["scroll"]
	/**
	 * 是否展示外边框和内边框，[配置项](https://ant.design/components/table-cn/#Table)
	*/
	bordered?: TableProps<RecordType>["bordered"]
	/**
	 * 表格大小，[配置项](https://ant.design/components/table-cn/#Table)
	*/
	size?: TableProps<RecordType>["size"]
}
function RenderGrid(props: IRenderGridProps) {
	const {
		rawData,
		rowIndex,
		columnIndex,
		mergedColumns,
		addCacheChidlren,
		removeCacheChidlren,
		getCacheChidlren
	} = props
	let timer: any = null
	const [loading, setLoading] = useState(false)
	const { dataIndex, render } = mergedColumns[columnIndex]
	const record = rawData[rowIndex]
	const prefix = columnIndex === 0 ? renderPrefix() : null
	const node = typeof render === 'function' ?
		render(record.originalData[dataIndex], record, rowIndex) :
		typeof props.renderGrid === 'function' ?
			props.renderGrid(record, rowIndex, columnIndex, dataIndex) :
			_renderGrid()
	function _renderGrid() {
		// 第一列的子节点
		if (columnIndex === 0 && record.pid && record.state.labelKey) {
			return record.originalData[record.state.labelKey]
		}
		return record.originalData[dataIndex]
	}
	async function clickHandle() {
		if (loading) {
			return
		}
		clearTimeout(timer)
		timer = setTimeout(async () => {
			// 关闭文件夹
			if (record.state.isOpen) {
				return removeCacheChidlren(record, rowIndex)
			}
			// 打开文件夹
			if (
				!record.state.isOpen &&
				(record.children || []).length &&
				record.state.childExpirationTime >= Date.now()
			) {
				return getCacheChidlren(record, rowIndex)
			}
			if (typeof props.loadingData === 'function') {
				setLoading(true)
				try {
					const { data, state } = await props.loadingData({ record, rowIndex, columnIndex }) as TLoadingDataRes
					addCacheChidlren(record, rowIndex, data, state)
				} catch (err) {
					setLoading(false)
				}
			}
		}, 300)

	}
	function renderPrefix() {
		const { isLeaf, state } = record
		if (!isLeaf) {
			const Square = state.isOpen ? MinusSquareOutlined : PlusSquareOutlined
			const Folder = state.isOpen ? FolderOpenOutlined : FolderOutlined
			const c = {
				className: PERFIX_ICON,
				onClick: clickHandle
			}
			return <>
				<Square {...c} />
				{
					loading ?
						<LoadingOutlined {...c} /> :
						<Folder {...c} />
				}
			</>
		}
		return null
	}
	return <>
		{prefix}{node}
	</>
}
const EnhanceTable: FC<IEnhanceTableProps> = (props) => {
	const {
		store,
		dragColumn,
		resizableColumn,
		virtual,
		rowHighlight,
		paddingLeft = PADDING_LEFT,
		valueKey = VALUE_KEY,
		loadingData,
		...tableProps
	} = props
	const key = (props.pagination || {}).current || KEY_ALL
	// 缓存数据
	const cacheDataSource = store.cacheDataSources[key] || []
	const [columns, setColumns] = useState<TEnhanceColumn[]>([])
	const [update, forceUpdate] = useState(0)
	const [gridProxyHolder, setGridProxyStyle] = useGridProxy()
	const ref = useRef<any>()
	const [tableWidth, setTableWidth] = useState(0)
	const [widthColumns, occupyWidth] = useMemo((): [TEnhanceColumn[], number] => {
		const ws = columns.filter((col: TEnhanceColumn) => col.width)
		const ow = ws.reduce((widths: number, col: TEnhanceColumn) => widths + Number(col.width), 0)
		return [ws, ow]
	}, [columns])
	const noneWidthColumnCount = columns.length - widthColumns.length
	const widths = widthColumns.reduce((ws: number, cw: TEnhanceColumn) => ws + Number(cw.width), 0)
	const mergedColumns = useMemo(() => {
		let fontWidths = 0
		return columns.map((column: TEnhanceColumn, index: number) => {
			const lastItem = index === columns.length - 1
			if (!noneWidthColumnCount && widths < tableWidth) {
				const w = Number((tableWidth / columns.length).toFixed(6))
				!lastItem && (fontWidths += w)
				return {
					...column,
					width: lastItem ? tableWidth - fontWidths : w
				}
			}
			if (column.width) {
				return column
			}
			let width = Number(((tableWidth - occupyWidth) / noneWidthColumnCount).toFixed(6))
			return {
				...column,
				width: width < 0 ? 0 : width
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [columns, tableWidth])
	const gridRef = useRef<any>()
	const [connectObject] = useState<any>(() => {
		const obj = {}
		Object.defineProperty(obj, 'scrollLeft', {
			get: () => null,
			set: (scrollLeft: number) => {
				if (gridRef.current) {
					gridRef.current.scrollTo({ scrollLeft })
				}
			},
		})
		return obj
	})
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
			// @ts-ignore
			setColumns(transformColumns(columns))
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
	const resizaStopCallback = (width: number, column: TEnhanceColumn, columns: TEnhanceColumn[]) => {
		const { index, isLeaf } = column.state
		if (isLeaf) {
			const data = getChildrenItem(column.state, columns)
			if (Array.isArray(data) && data.length) {
				data[index].width = width
				setColumns([...columns])
			}
			return
		}
		columns[index].width = width
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
	function transformColumns(data: TColumn[]) {
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

	const renderDragProviderItem = ({ state, title, node, className }: IRenderDragProviderItem) => {
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
				onClick={e => {
					e.stopPropagation();
				}}
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

	function initCache() {
		const data = (props.dataSource || []).reduce((acc: KV<any>, cur: TOriginalData) => {
			acc.push({
				id: cur[valueKey],
				isleaf: cur.isleaf,
				path: `-${cur[valueKey]}-`,
				state: {
					...JSON.parse(JSON.stringify(DEFAULT_STATE)),
					childExpirationTime: Date.now() + EXPORATION_TIME
				},
				originalData: JSON.parse(JSON.stringify(cur))
			})
			return acc
		}, [])
		return data
	}
	function setCacheDataSource(data: TreeDataInterface[]) {
		store.oldDataSource = JSON.parse(JSON.stringify(props.dataSource))
		store.cacheDataSources[key] = data
		forceUpdate(update + 1)
	}
	function getCacheChidlren(record: TOriginalData, rowIndex: number) {
		cacheDataSource[rowIndex].state = {
			...cacheDataSource[rowIndex].state,
			isOpen: true
		}
		if (!Array.isArray((cacheDataSource[rowIndex] || {}).children)) {
			return
		}
		const datas = ((cacheDataSource[rowIndex] || {})
			.children || [])
			.reduce((acc: { data: Array<any>, index: number }, cur: TreeDataInterface, i: number) => {
				acc.data.push(cur)
				if (cur.state.isOpen && (cur.children || []).length) {
					const index = acc.index || i
					acc.data.splice(index + 1, 0, ...(cur.children as TreeDataInterface[]))
					acc.index = acc.index + (cur.children as TreeDataInterface[]).length + 1
				}
				return acc
			}, { data: [], index: 0 })
		cacheDataSource.splice(rowIndex + 1, 0, ...datas.data)
		setCacheDataSource(cacheDataSource)
	}
	// 加载子节点数据
	function addCacheChidlren(record: TOriginalData, rowIndex: number, children: TOriginalData[] = [], state: TreeDataInterface['state']) {
		const { path, id } = record
		const childExpirationTime = Date.now() + EXPORATION_TIME
		const data = children.reduce((acc: KV<any>, cur: TOriginalData) => {
			acc.push({
				id: Number(`${cur[valueKey]}${id}`),
				pid: id,
				isleaf: cur.isleaf,
				path: `${path}${cur[valueKey]}-`,
				state: {
					...JSON.parse(JSON.stringify(DEFAULT_STATE)),
					// @ts-ignore
					childExpirationTime,
					...state
				},
				originalData: cur
			})
			return acc
		}, []) as TreeDataInterface[]
		cacheDataSource[rowIndex].state = {
			...cacheDataSource[rowIndex].state,
			childExpirationTime,
			isOpen: true
		}
		cacheDataSource[rowIndex].children = data
		cacheDataSource.splice(rowIndex + 1, 0, ...data)
		setCacheDataSource(cacheDataSource)
	}
	function removeCacheChidlren(record: TOriginalData, rowIndex: number) {
		const { path } = cacheDataSource[rowIndex]
		const pattern = new RegExp(`^${path}`)
		let i = rowIndex + 1
		while (i < cacheDataSource.length && pattern.test(cacheDataSource[i].path)) {
			i++
		}
		cacheDataSource[rowIndex].state = {
			...cacheDataSource[rowIndex].state,
			isOpen: false
		}
		cacheDataSource.splice(rowIndex + 1, i - rowIndex - 1)
		setCacheDataSource(cacheDataSource)
	}
	const resetVirtualGrid = () => {
		gridRef.current && gridRef.current.resetAfterIndices({
			columnIndex: 0,
			shouldForceUpdate: false,
		})
	}
	resetVirtualGrid()
	useEffect(() => {
		/**
		 * @TODO 切换分页时获取对应缓存的状态
		 * **/
		if (JSON.stringify(store.oldDataSource) !== JSON.stringify(props.dataSource)) {
			setCacheDataSource(initCache())
		}
		return () => {
			store.oldDataSource = []
			// eslint-disable-next-line react-hooks/exhaustive-deps
			store.cacheDataSources = {}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.dataSource])
	const rowHeight = (index: number): number => {
		return (
			typeof props.rowHeight === 'function' ?
				props.rowHeight(index) :
				typeof props.rowHeight === 'number' ?
					props.rowHeight :
					ROW_HEIGHT
		) as number
	}
	const clickHandle = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement
		const rowClassName = target.getAttribute(DATA_ROW_CLASS_NAME)
		if (!rowHighlight || !rowClassName || !(gridRef.current || {})._outerRef) {
			return
		}
		clearHighlight()
		store.nodes = [...gridRef.current._outerRef.getElementsByClassName(rowClassName)]
		store.nodes.forEach((node: HTMLElement) => {
			node.classList.add(TR_SELECTED_CLS)
		})
	}
	const getStyle = (style: CSSProperties, columnIndex: number, rowIndex: number) => {
		const result: CSSProperties = {
			...style,
			lineHeight: (Number(style.height) / 2 + 'px'),
		}
		if (columnIndex === 0 && cacheDataSource[rowIndex]) {
			const tier = cacheDataSource[rowIndex].path.split('-').filter(Boolean).length - 1
			tier && (result.paddingLeft = tier * paddingLeft + 8)
		}
		return result
	}
	const renderVirtualList = (data: TEnhanceColumn[], { scrollbarSize, ref, onScroll }: any) => {
		ref.current = connectObject
		return (
			<Grid
				ref={gridRef}
				className={classNames({
					[VIRTUAL_GRID_CLS]: true,
					[VIRTUAL_GRID_BORDERED_CLS]: props.bordered
				})}
				columnCount={mergedColumns.length}
				columnWidth={index => {
					const width = mergedColumns[index].width as number
					return index === mergedColumns.length - 1 ? width - scrollbarSize - 1 : width
				}}
				height={200}
				rowCount={cacheDataSource.length}
				rowHeight={rowHeight}
				width={tableWidth}
				onScroll={({ scrollLeft }) => onScroll({ scrollLeft })}
			>
				{({ columnIndex, rowIndex, style }) => {
					const customerConfig = rowHighlight ? {
						[DATA_ROW_CLASS_NAME]: `row-${rowIndex}`,
						onClick: clickHandle
					} : undefined
					return (
						<div
							className={classNames({
								[VIRTUAL_TABLE_CELL_CLS]: true,
								[VIRTUAL_TABLE_CELL_LAST_CLS]: columnIndex === mergedColumns.length - 1,
								[VIRTUAL_TABLE_CELL_FIRST_CLS]: columnIndex === 0,
								[`${ROW_HIGHLIGHT} row-${rowIndex}`]: rowHighlight
							})}
							style={getStyle(style, columnIndex, rowIndex)}
							{...customerConfig}
						>
							<RenderGrid
								valueKey={valueKey}
								rawData={cacheDataSource}
								rowIndex={rowIndex}
								columnIndex={columnIndex}
								loadingData={loadingData}
								mergedColumns={mergedColumns}
								addCacheChidlren={addCacheChidlren}
								removeCacheChidlren={removeCacheChidlren}
								getCacheChidlren={getCacheChidlren}
								renderGrid={props.renderGrid}
							/>
						</div>
					)
				}}
			</Grid>
		)
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
	useEffect(() => {
		rowHighlight && document.addEventListener('click', mouseClick)
		return () => {
			rowHighlight && document.removeEventListener('click', mouseClick)
			store.nodes = []
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	useEffect(() => {
		// @ts-ignore
		setColumns(transformColumns(props.columns))
		return () => {
			store.destroy()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.columns])
	if (!columns.length) {
		return null
	}
	const containerCnf = {
		ref,
		className: dragColumn ? [DRAG_TABLE_CLS, store.dragTableCls].join(" ") : undefined
	}
	const tableCnf = {
		...tableProps,
		columns,
		components: {
			header: {
				cell: headerCell,
			},
			body: virtual ? renderVirtualList : undefined
		}
	}
	const proxyHolder = resizableColumn ? gridProxyHolder : null
	if (dragColumn) {
		return <div {...containerCnf}>
			<DragProvider>
				<ATable {...tableCnf} />
			</DragProvider>
			{proxyHolder}
		</div>
	}
	return <ResizeObserver
		onResize={({ width }) => {
			clearTimeout(store.setTableWidthTimer)
			store.setTableWidthTimer = setTimeout(() => setTableWidth(width), 10)
		}}
	>
		<div {...containerCnf}>
			<ATable {...tableCnf} />
			{proxyHolder}
		</div>
	</ResizeObserver>
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
	const store = useRef<IStoreProps>({
		dragTableCls: `drag-table-${parseInt((Math.random() * 1000000).toString())}`,
		hoverActiveItem: undefined,
		setTableWidthTimer: null,
		oldDataSource: [], // 只用于比对前后两次dataSource是否一样
		cacheDataSources: {},// 缓存状态：例如展开、收起...
		nodes: [],
		destroy: () => {
			store.current.hoverActiveItem = undefined
			clearTimeout(store.current.setTableWidthTimer)
			store.current.setTableWidthTimer = null
			store.current.oldDataSource = []
			store.current.cacheDataSources = {}
			store.current.nodes = []
		}
	})
	if (
		!Array.isArray(props.columns) ||
		!(props.columns || []).length ||
		(!dragColumn && !resizableColumn && !virtual)
	) {
		return <ATable {...tableProps} />
	}

	return <EnhanceTable {...props} store={store.current} columns={props.columns} />
}

Table.defaultProps = {
	dragColumn: TRUE,
	resizableColumn: FALSE,
	className: CLASS_NAME,
	bordered: TRUE,
	loading: FALSE,
	size: 'small',
	virtual: FALSE
}

export default Table

