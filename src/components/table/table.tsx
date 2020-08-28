import React, { FC, useState, useMemo, useEffect, useRef } from 'react'
import { Table as ATable } from 'antd'
import { Resizable } from 'react-resizable'
import DragProvider from './DragProvider'
import { ACCEPT, DRAG_TABLE_CLS, LEVEL_VALUE, CANCEL_FRAG_COLUMN_CLS } from './config'
import useGridProxy from './useGridProxy'
import {
	ITableProps as IT,
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
import "./style/index"

export interface ITableProps extends IT { }

const EnhanceTable: FC<IEnhanceTableProps> = (props) => {
	const { store, dragColumn, resizableColumn, ...tableProps } = props
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

	const renderDragProviderItem = ({ state, title, node }: IRenderDragProviderItem) => {
		const element = node ? node : title
		return dragColumn ? <DragProvider.Item
			state={state}
			title={title}
			store={store}
			moveCard={moveCard}
		>
			{element}
		</DragProvider.Item> : element
	}
	const renderResize = (argus: IHeaderCellProps) => {
		let { onResize, onResizeStart, onResizeStop, width, state, ...restProps } = argus
		/**
		 * @todo 
		 * node扩展排序、筛选
		 */
		const node = undefined
		const th = <th {...restProps} >{renderDragProviderItem({ state, title: argus.children[1], node })}</th>
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
			<th {...restProps} >{renderDragProviderItem({ state, title: argus.children[1] })}</th> :
			renderResize(argus)
	}

	const node = useMemo(() => {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [columns, dragColumn, resizableColumn])
	useEffect(() => {
		// @ts-ignore
		setColumns(transformColumns(props.columns))
		return () => {
			store.destroy()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.columns])
	return <>{node}</>
}
export const Table: FC<ITableProps> = (props) => {
	const { dragColumn, resizableColumn, ...tableProps } = props
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
	bordered: true
}

export default Table

