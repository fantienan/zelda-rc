import React, { useState, useMemo, useRef, useEffect, FC, CSSProperties } from 'react'
import { VariableSizeGrid as Grid } from 'react-window'
import ResizeObserver from 'rc-resize-observer'
import {
    FolderOutlined,
    FolderOpenOutlined,
    PlusSquareOutlined,
    MinusSquareOutlined,
    LoadingOutlined
} from '@ant-design/icons'
import {
    classNames, KEY_ALL, ROW_HEIGHT, DATA_ROW_CLASS_NAME, EXPORATION_TIME,
    TR_SELECTED_CLS, PERFIX_ICON, DEFAULT_STATE,
    VIRTUAL_GRID_BORDERED_CLS, ROW_HIGHLIGHT, VIRTUAL_GRID_CLS, VIRTUAL_TABLE_CELL_CLS,
    VIRTUAL_TABLE_CELL_LAST_CLS, VIRTUAL_TABLE_CELL_FIRST_CLS
} from './config'
import {
    KV, TEnhanceColumn, IRenderGridProps, TOriginalData,
    TreeDataInterface, TLoadingDataRes, IVirtualTableProps
} from './interface'
const RenderGrid: FC<IRenderGridProps> = props => {
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
const VirtualTable: FC<IVirtualTableProps> = (props) => {
    const {
        store,
        rowHighlight,
        paddingLeft,
        valueKey,
        loadingData,
        columns,
        generateNode,
        clearHighlight
    } = props
    const key = (props.pagination || {}).current || KEY_ALL
    const [update, forceUpdate] = useState(0)
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
    // 缓存数据
    const cacheDataSource = store.cacheDataSources[key] || []
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
    return <ResizeObserver
        onResize={({ width }) => {
            clearTimeout(store.setTableWidthTimer)
            store.setTableWidthTimer = setTimeout(() => setTableWidth(width), 10)
        }}
    >
        {generateNode(renderVirtualList)}
    </ResizeObserver>
}

export default VirtualTable