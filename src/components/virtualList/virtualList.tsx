/**
 * 虚拟list 功能组件
 * **/
import React, { FC } from 'react'
import { List, Tooltip } from 'antd'
import { List as VList, AutoSizer, Index, ListRowRenderer, ListRowProps } from 'react-virtualized'
import './style/index'

type KV<T> = {
    [K: string]: T
}

export interface RowRendererParams {
    index: number
    isScrolling: boolean
    key: string
    style: KV<any>
}
export type GetRowHeight = (index: number) => number
export interface IRowRenderer extends ListRowProps { }
export interface IVirtualList {
    className?: string
    data?: KV<any>[]
    rowHeight?: number
    listHeight?: number
    overscanRowCount?: number
    rowCount?: number
    useDynamicRowHeight?: boolean
    scrollToIndex?: number
    valueKey?: string
    labelKey?: string
    getRowHeight?: GetRowHeight
    rowRenderer?: ListRowRenderer
    width?: number
    tooltip?: boolean
    rowClick?: (index: number, data: KV<any>) => void
}
export const VirtualList: FC<IVirtualList> = (props) => {
    const {
        className = '',
        data = [],
        rowHeight = 28,
        listHeight = 300,
        overscanRowCount = 2,
        useDynamicRowHeight,
        scrollToIndex = -1,
        // valueKey = 'value',
        labelKey = 'label',
        getRowHeight,
        rowRenderer,
        tooltip,
        rowClick = (index: number, data: KV<any>) => { }
    } = props
    const _noRowsRenderer = () => {
        return <div>暂无数据</div>
    }

    const _getRowHeight = (info: Index) => {
        return useDynamicRowHeight && typeof getRowHeight === "function" ? getRowHeight(info.index) : rowHeight
    }
    const rowClickHandle = (index: number, item: KV<any>) => {
        if (typeof props.rowClick === "function") {
            rowClick(index, item)
        }
    }
    const _rowRenderer = (argus: IRowRenderer) => {
        if (typeof rowRenderer === "function") {
            return rowRenderer(argus)
        }
        const { index, key, style = {} } = argus
        try { 
            !style.lineHeight && (style.lineHeight = style.height + 'px')
        } catch (e) { 
            console.log(e)
        }
        const item = data[index]
        const text = item[labelKey]
        return <div
            className="row"
            style={style}
            key={key}
            onClick={() => rowClickHandle(index, item)}
        >
            {
                tooltip ? <Tooltip placement="topLeft" title={text}>
                    <div className="text">{text}</div>
                </Tooltip> : <div className="text">{text}</div>
            }
        </div>
    }
    return <List className={"enhance-list " + className}>
        <AutoSizer disableHeight>
            {({ width }) =>
                <VList
                    className='react-virtualized-list'
                    height={listHeight}
                    overscanRowCount={overscanRowCount}
                    noRowsRenderer={_noRowsRenderer}
                    rowCount={data.length}
                    rowHeight={_getRowHeight}
                    rowRenderer={_rowRenderer}
                    scrollToIndex={scrollToIndex}
                    width={props.width || width}
                />
            }
        </AutoSizer>
    </List>
}

export default VirtualList