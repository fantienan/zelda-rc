import React, { FC, useState, useEffect, useRef, useMemo } from 'react'
import { Table as ATable } from 'antd'
import { Resizable } from 'react-resizable'
// import { VariableSizeGrid as Grid } from 'react-window'
// import ResizeObserver from 'rc-resize-observer'
import DragProvider from './DragProvider'
import { ACCEPT, DRAG_TABLE_CLS, LEVEL_VALUE, CANCEL_FRAG_COLUMN_CLS, /* classNames */ } from './config'
import useGridProxy from './useGridProxy'
import {
	KV,
	IEnhanceTableProps,
	TEnhanceColumn,
	TMoveCard,
	TState,
	THandleResizable,
	THandleResizableStop,
	TColumn,
	IHeaderCellProps,
	IStoreProps,
	IRenderDragProviderItem
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

const EnhanceTable: FC<IEnhanceTableProps> = (props) => {
	const { store, dragColumn, resizableColumn, virtual, ...tableProps } = props
	const [columns, setColumns] = useState<TEnhanceColumn[]>([])
	const [gridProxyHolder, setGridProxyStyle] = useGridProxy()
	const ref = useRef<any>()
	// const [tableWidth, setTableWidth] = useState(0)
	// const [widthColumns, occupyWidth] = useMemo((): [TEnhanceColumn[], number] => {
	// 	const ws = columns.filter((col: TEnhanceColumn) => col.width)
	// 	const ow = ws.reduce((widths: number, col: TEnhanceColumn) => widths + Number(col.width), 0)
	// 	return [ws, ow]
	// }, [columns])
	// const noneWidthColumnCount = columns.length - widthColumns.length
	// const widths = widthColumns.reduce((ws: number, cw: TEnhanceColumn) => ws + Number(cw.width), 0)
	// const mergedColumns = useMemo(() => {
	// 	let fontWidths = 0
	// 	return columns.map((column: TEnhanceColumn, index: number) => {
	// 		const lastItem = index === columns.length - 1
	// 		if (!noneWidthColumnCount && widths < tableWidth) {
	// 			const w = Number((tableWidth / columns.length).toFixed(6))
	// 			!lastItem && (fontWidths += w)
	// 			return {
	// 				...column,
	// 				width: lastItem ? tableWidth - fontWidths : w
	// 			}
	// 		}
	// 		if (column.width) {
	// 			return column
	// 		}
	// 		let width = Number(((tableWidth - occupyWidth) / noneWidthColumnCount).toFixed(6))
	// 		return {
	// 			...column,
	// 			width: width < 0 ? 0 : width
	// 		}
	// 	})
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [columns, tableWidth])
	// const gridRef = useRef<any>()
	// const [connectObject] = useState<any>(() => {
	// 	const obj = {}
	// 	Object.defineProperty(obj, 'scrollLeft', {
	// 		get: () => null,
	// 		set: (scrollLeft: number) => {
	// 			if (gridRef.current) {
	// 				gridRef.current.scrollTo({ scrollLeft })
	// 			}
	// 		},
	// 	})
	// 	return obj
	// })
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

	// const renderVirtualList = (data: TEnhanceColumn[], { scrollbarSize, ref, onScroll }: any) => {
	// 	ref.current = connectObject

	// 	return (
	// 		<Grid
	// 			ref={gridRef}
	// 			className={classNames({
	// 				'virtual-grid': true,
	// 				'virtual-grid-bordered': props.bordered
	// 			})}
	// 			columnCount={mergedColumns.length}
	// 			columnWidth={index => {
	// 				const { width } = mergedColumns[index]
	// 				return index === mergedColumns.length - 1 ? width - scrollbarSize - 1 : width
	// 			}}
	// 			height={200}
	// 			rowCount={cacheDataSource.length}
	// 			rowHeight={_rowHeight}
	// 			width={tableWidth}
	// 			onScroll={({ scrollLeft }) => onScroll({ scrollLeft })}
	// 		>
	// 			{({ columnIndex, rowIndex, style }) => {
	// 				const customerConfig = rowHighlight ? {
	// 					[DATA_ROW_CLASS_NAME]: `row-${rowIndex}`,
	// 					onClick: clickHandle
	// 				} : undefined
	// 				return (
	// 					<div
	// 						className={classNames('virtual-table-cell', {
	// 							'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
	// 							'virtual-table-cell-first': columnIndex === 0,
	// 							[`row-highlight row-${rowIndex}`]: rowHighlight
	// 						})}
	// 						style={getStyle(style, columnIndex, rowIndex)}
	// 						{...customerConfig}
	// 					>
	// 						<RenderGrid
	// 							valueKey={valueKey}
	// 							rawData={cacheDataSource}
	// 							rowIndex={rowIndex}
	// 							columnIndex={columnIndex}
	// 							loadingData={loadingData}
	// 							mergedColumns={mergedColumns}
	// 							addCacheChidlren={addCacheChidlren}
	// 							removeCacheChidlren={removeCacheChidlren}
	// 							getCacheChidlren={getCacheChidlren}
	// 							renderGrid={props.renderGrid}
	// 						/>
	// 					</div>
	// 				)
	// 			}}
	// 		</Grid>
	// 	)
	// }
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
				// body: renderVirtualList
			},
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
	return <div {...containerCnf}>
		<ATable {...tableCnf} />
		{proxyHolder}
	</div>
}
export function Table<RecordType extends object = any>(props: ITableProps<RecordType>) {
	const { dragColumn, resizableColumn, virtual, ...tableProps } = props
	const store = useRef<IStoreProps>({
		dragTableCls: `drag-table-${parseInt((Math.random() * 1000000).toString())}`,
		hoverActiveItem: undefined,
		destroy: () => {
			store.current.hoverActiveItem = undefined
		}
	})
	if (
		!Array.isArray(props.columns) ||
		!(props.columns || []).length ||
		(!dragColumn && !resizableColumn)
	) {
		return <ATable {...tableProps} />
	}

	return <EnhanceTable {...props} store={store.current} columns={props.columns} />
}

Table.defaultProps = {
	dragColumn: true,
	resizableColumn: true,
	className: '',
	bordered: true,
	loading: false,
	size: 'small',
	virtual: false
}

export default Table

