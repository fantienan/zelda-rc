import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import Table, { ITableProps } from './table'
import { data, columns } from './mock'
export default {
    title: 'Example/Table',
    component: Table
} as Meta

const Template: Story<ITableProps> = (args, i) => {
    return <Table dataSource={data} columns={columns} {...args}/>
}

export const Basice = Template.bind({})
Basice.args = {
    dragColumn: true,
    resizableColumn: true
}