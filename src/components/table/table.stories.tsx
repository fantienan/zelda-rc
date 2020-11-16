import React, { useState, useEffect, Key } from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import Table, { ITableProps } from './table'
import { data, columns } from './mock'
import "../../common.css"

export default {
    title: 'Example/Table',
    component: Table
} as Meta

const Template: Story<ITableProps> = (args, i) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<any>([0])
    const [scroll, setScroll] = useState({ y: 200 })
    const rowSelection: ITableProps["rowSelection"] = {
        type: 'checkbox',
        selectedRowKeys,
        onChange: (selectedRowKeys: Key[], selectedRows: any[]) => {
            setSelectedRowKeys(selectedRowKeys)
        },
        getCheckboxProps: (record: any) => {
            return {}
        }
    }
    // const pagination = {
    //     hideOnSinglePage: true,
    //     showSizeChanger: false,
    //     current: 1,
    //     pageSize: 10,
    //     showTotal: (total: any) => `共${total}条数据`,
    //     onChange: (current: number, pageSize?: number | undefined) => {
    //     }
    // }

    useEffect(() => {
        const bodyRect = document.body.getBoundingClientRect()
        setScroll({
            y: bodyRect.height - 205 - 80
        })
    }, [])
    return <Table
        {...args}
        rowSelection={rowSelection}
        // dataSource={data}
        columns={columns as ITableProps['columns']}
        scroll={scroll}
    />
}

export const Basice = Template.bind({})

Basice.args = {
    dragColumn: true,
    resizableColumn: true,
    loading: false,
    bordered: true,
    virtual: false
}