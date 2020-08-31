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
export const classNames = (clsObj: { [k: string]: boolean | undefined }) => {
    return Object.keys(clsObj).reduce((acc: Array<string>, key: string) => {
        clsObj[key] && acc.push(key)
        return acc
    }, []).join(" ")
}