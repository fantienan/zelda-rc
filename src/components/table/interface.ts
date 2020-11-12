import { ReactNodeArray, RefObject, SyntheticEvent, ReactNode } from 'react'
import { ResizeCallbackData } from 'react-resizable'
import { ColumnsType, ColumnType, TableProps } from 'antd/lib/table'

export type KV<T = any> = {
    [k: string]: T
}
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
    width: number
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
export type TBody = (data: TEnhanceColumn[], params: any) => ReactNode
export interface IVirtualTableProps extends IEnhanceTableProps {
    columns: TEnhanceColumn[]
    valueKey: string
    paddingLeft: number
    generateNode: (body: TBody) => ReactNode
    clearHighlight: Function
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