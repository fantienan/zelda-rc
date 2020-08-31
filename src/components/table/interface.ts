import { ReactNodeArray, RefObject, SyntheticEvent, ReactNode } from 'react'
import { ResizeCallbackData } from 'react-resizable'
import { ColumnsType, ColumnType } from 'antd/lib/table'
import { ITableProps } from './table'

export type KV<T = any> = {
    [k: string]: T
}

export interface ColumnGroupType<RecordType> extends Omit<ColumnType<RecordType>, 'dataIndex'> {
    children: ColumnsType<RecordType>;
}
export type TColumn<RecordType = any> = (
    | ColumnGroupType<RecordType>
    | ColumnType<RecordType>
) & {
    children?: TColumn<RecordType>[]
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
export interface IEnhanceTableProps extends ITableProps<any> {
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
    className: string
}

export interface IRenderDragProviderItem {
    state: TState,
    title: ReactNode,
    node?: JSX.Element,
    className: string
}