import { ReactNodeArray, RefObject, SyntheticEvent, ReactNode } from 'react'
import { ResizeCallbackData } from 'react-resizable'
import { TableProps, ColumnsType, ColumnType } from 'antd/lib/table'

export interface ITableProps extends TableProps<RecordType> {
	/**
	 * 拖拽改变列的顺序
	*/
    dragColumn?: boolean
    /**
     * 拖拽改变列宽
    */
    resizableColumn?: boolean
}
export type RecordType = any
export type KV<T = any> = {
    [k: string]: T
}
export interface ColumnGroupType<RecordType> extends Omit<ColumnType<RecordType>, 'dataIndex'> {
    children: ColumnsType<RecordType>;
}
export type TColumn = (ColumnGroupType<RecordType> | ColumnType<RecordType>) & {
    children?: TColumn[]
    state?: TState
}
export interface IStoreProps {
    dragTableCls: string
    hoverActiveItem?: RefObject<any>
    destroy: Function
}
export type TState = {
    index: number
    type: string
    isLeaf: boolean
    indexPath?: string
}
export type TEnhanceColumn = {
    state: TState
} & TColumn
export interface IEnhanceTableProps extends ITableProps {
    columns: TColumn[]
    store: IStoreProps
}

export type TMoveCard = (targetItem: TState, nextItem: TState, data?: TColumn[]) => void
export type TResizable = (e: SyntheticEvent, data: ResizeCallbackData) => any
export type TResizableStop = (e: SyntheticEvent, data: ResizeCallbackData, columns: TEnhanceColumn[]) => any
export type THandleResizable = (column: TEnhanceColumn) => TResizable
export type THandleResizableStop = (column: TEnhanceColumn) => TResizableStop
export interface IHeaderCellProps {
    onResize: TResizable
    onResizeStart: TResizable
    onResizeStop: TResizableStop
    width?: number
    children: ReactNodeArray
    state: TState
}

export interface IRenderDragProviderItem {
    state: TState,
    title: ReactNode,
    node?: JSX.Element
}