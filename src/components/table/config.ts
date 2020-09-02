export const DRAG_TABLE_CLS = 'drag-column-table'
export const ACCEPT = 'card'
export const LEVEL_VALUE = 1
export const SAFETY = 1
export const HOVER_ACTIVE_CLS = 'hover-active'
export const CUSTOM_DRAG_LAYER = 'custom-drag-layer'
export const OPACITY = 0.9
export const TH = 'th'
export const CANCEL_FRAG_COLUMN_CLS = 'cancel-drag'
export const ANT_TABLE_SELECTION_CLS = 'ant-table-selection'
export const KEY_ALL = 'all'
export const EXPORATION_TIME = 60 * 1000 * 30 	// 过期时间用于更新子节点
export const ROW_HEIGHT = 38
export const DATA_ROW_CLASS_NAME = 'data-row-class-name'
export const TR_SELECTED_CLS = 'cell-selected'
export const CONTAINER_CLASS = '.ant-table-container'
export const PADDING_LEFT = 15
export const CLASS_NAME = ''
export const VALUE_KEY = 'id'
export const PERFIX_ICON = 'prefix-icon'
export const DEFAULT_STATE = {
	isOpen: false,
	nodeDisabled: false,
	checkDisabled: false,
	checked: false
}
export const VIRTUAL_GRID_CLS = 'virtual-grid'
export const VIRTUAL_GRID_BORDERED_CLS = 'virtual-grid-bordered'
export const VIRTUAL_TABLE_CELL_CLS = 'virtual-table-cell'
export const VIRTUAL_TABLE_CELL_LAST_CLS = 'virtual-table-cell-last'
export const VIRTUAL_TABLE_CELL_FIRST_CLS = 'virtual-table-cell-first'
export const ROW_HIGHLIGHT = 'row-highlight'
export const classNames = (clsObj: { [k: string]: boolean | undefined }) => {
    return Object.keys(clsObj).reduce((acc: Array<string>, key: string) => {
        clsObj[key] && acc.push(key)
        return acc
    }, []).join(" ")
}