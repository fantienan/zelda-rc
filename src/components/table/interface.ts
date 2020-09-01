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
    setTableWidthTimer: any
    oldDataSource: Array<KV>
    cacheDataSources: {
        [k: string]: TreeDataInterface[]
    }
    nodes: Array<HTMLElement>
}
export type TState = {
    index: number
    type: string
    isLeaf: boolean
    indexPath?: string
}
export type TEnhanceColumn = {
    state: TState
    id: number
    isLeaf: boolean
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

export type TOriginalData = {
    id: number 		// 唯一标识
    isLeaf: boolean // false: 不是叶子节点；true：是叶子节点
    [k: string]: any
}

export interface TreeDataInterface {
    id: number              			// 唯一标识
    pid?: number						// 父级id
    path: string        				// 层级: -1-
    isLeaf: boolean      				// 是否是叶子节点
    children?: TreeDataInterface[]      // 子节点
    state: {
        isOpen?: boolean              	// 节点是否展开
        nodeDisabled?: boolean         	// 禁用节点
        checkDisabled?: boolean        	// 禁用节点选择框
        checked?: boolean              	// 选中状态
        labelKey?: string               // 子节点获取text的key
        childExpirationTime: number	// 子节点过期时间戳
    }
    originalData: TOriginalData			// 原始数据
    [k: string]: any
}
export type TRenderGrid = (record: TOriginalData, rowIndex: number, columnIndex: number, dataIndex: string) => any
export type TLoadingDataRes = {
    data: TOriginalData[]
    state: TreeDataInterface['state']
}
export interface ILoadingDataParams {
    record: TreeDataInterface
    rowIndex: number
    columnIndex: number,
}
export type TLoadingData = (params: ILoadingDataParams) => Promise<TLoadingDataRes> | TLoadingDataRes | any
export interface IRenderGridProps {
    valueKey: string
    rawData: TreeDataInterface[]
    rowIndex: number
    columnIndex: number
    mergedColumns: TOriginalData[]
    renderGrid?: TRenderGrid
    loadingData?: TLoadingData
    addCacheChidlren: (record: TOriginalData, rowIndex: number, data: TOriginalData[], state: TreeDataInterface['state']) => void
    removeCacheChidlren: (record: TOriginalData, rowIndex: number) => void
    getCacheChidlren: (record: TOriginalData, rowIndex: number) => void
}